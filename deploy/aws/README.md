# Deploying kuja-seven to a customer's AWS EC2 (domain on domains.lk)

What actually runs on the box: two containers (`kuja7-web`, a static Next.js export
served by nginx; `kuja7-api`, NestJS on :3001 with a socket.io chat gateway) plus one
Caddy container terminating TLS. The database, auth, and file storage are Supabase —
hosted elsewhere, nothing to install. No RDS, no S3, no ALB.

**Images are built by GitHub Actions and pushed to GHCR; the box only pulls them.**
That is the whole reason a t3.micro works — 1 GB of RAM cannot run `next build`, but
it runs the result comfortably.

Target hostnames: the site at **`kuja7.lk`** (with `www.kuja7.lk` redirecting to it)
and the API at **`api.kuja7.lk`**. The domain is registered at
[domains.lk](https://www.domains.lk/) (LK Domain Registry).

---

## Phase 1 — Get an account in the customer's AWS account

You cannot create this yourself; someone with admin on the customer's account must.
Send them Steps 1–5. It takes about five minutes.

1. Sign in to the AWS Console as root or an admin → search **IAM** → **Users** →
   **Create user**.
2. User name `kuja7-deploy` (or the developer's name). Tick **Provide user access to
   the AWS Management Console** → **I want to create an IAM user** → **Custom
   password** → tick **Users must create a new password at next sign-in**.
3. **Permissions** → *Attach policies directly* → attach **AmazonEC2FullAccess**.
   That is all this deployment needs.
4. **Create user**, then copy the **Console sign-in URL**
   (`https://<account-id>.signin.aws.amazon.com/console`), the user name, and the
   one-time password. Send the password over a different channel than the URL.
5. Open the new user → **Security credentials** → **Assign MFA device**.

Then, as the developer: sign in at that URL, set a new password, enrol MFA.

> If the customer uses **IAM Identity Center (SSO)**, ask for a Permission Set with
> `AmazonEC2FullAccess` instead — same result, no long-lived credentials. Everything
> below is console + SSH, so you never need AWS access keys.

---

## Phase 2 — Launch the EC2 instance

Console → **EC2** → **Instances** → **Launch instances**.

| Field | Value | Why |
|---|---|---|
| Name | `kuja7-prod` | |
| AMI | **Ubuntu Server 24.04 LTS (x86_64)** | `deploy/server-setup.sh` is apt-based |
| Instance type | **t3.micro** (2 vCPU / 1 GB) | enough because nothing is built here; free-tier eligible for 12 months on a new account |
| Key pair | **Create new key pair** → RSA → `.pem` → download | the only way in; store it safely |
| Auto-assign public IP | Enable | |
| Storage | **20 GB gp3** | images + Docker overhead; no build layers to hoard |

**Region:** closest to the users *and* to the Supabase project — the API talks to
Supabase on every request. If Supabase is in `ap-southeast-1` (Singapore), put EC2 in
`ap-southeast-1`.

**Security group** — create new, name `kuja7-prod-sg`:

| Type | Port | Source |
|---|---|---|
| SSH | 22 | **My IP** for now (see Phase 6 — CI needs in too) |
| HTTP | 80 | `0.0.0.0/0` — required for Let's Encrypt validation |
| HTTPS | 443 | `0.0.0.0/0` |

### Elastic IP (do not skip)

A default public IP changes on every stop/start, which silently breaks DNS and
certificate renewal.

EC2 → **Elastic IPs** → **Allocate Elastic IP address** → Allocate → select it →
**Actions → Associate** → choose `kuja7-prod` → Associate.

That address is `<ELASTIC_IP>` from here on.

```bash
chmod 400 ~/Downloads/kuja7-prod.pem
ssh -i ~/Downloads/kuja7-prod.pem ubuntu@<ELASTIC_IP>
```

---

## Phase 3 — Prepare the server

All commands run on the EC2 box.

The box never compiles anything — the checkout exists only so `docker-compose.yml` is
on disk and stays current. The repo is private, so the deploy key has to come first:
nothing here can clone before it exists.

```bash
# 1. git — server-setup.sh does not install it
sudo apt-get update -y && sudo apt-get install -y git

# 2. Read-only deploy key for this box
ssh-keygen -t ed25519 -C "kuja7-ec2" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
```

Paste that line into GitHub → `evox-technologies/kuja-7` → **Settings → Deploy keys →
Add deploy key** → title `kuja7-ec2`, leave *Allow write access* **off**.

```bash
# 3. Clone straight to its final home — answer "yes" to the host-key prompt
sudo mkdir -p /opt/apps && sudo chown ubuntu:ubuntu /opt/apps
git clone git@github.com:evox-technologies/kuja-7.git /opt/apps/kuja-seven

# 4. Docker, firewall, /opt/apps
sudo bash /opt/apps/kuja-seven/deploy/server-setup.sh

# 5. Let ubuntu run docker without sudo, then reconnect so the group applies
sudo usermod -aG docker ubuntu
exit
```

```bash
ssh -i ~/Downloads/kuja7-prod.pem ubuntu@<ELASTIC_IP>

# 6. 1 GB with no swap will OOM-kill the API under load even though it never builds
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 7. The shared network the app and Caddy both attach to
docker network create traefik-public
```

---

## Phase 4 — Caddy

`.env` and `apps/api/.env.production` are written by CI on every deploy (Phase 6), so
do not hand-write them. Caddy's own config is not managed by CI:

```bash
sudo mkdir -p /opt/infra && sudo chown ubuntu:ubuntu /opt/infra
cp -r /opt/apps/kuja-seven/deploy/aws /opt/infra/caddy
cat > /opt/infra/caddy/.env << 'EOF'
WEB_DOMAIN=kuja7.lk
API_DOMAIN=api.kuja7.lk
EOF
```

---

## Phase 5 — Point kuja7.lk at the server (domains.lk)

Do this **before** starting Caddy — Let's Encrypt validates by resolving each hostname
back to this server, so certificates cannot be issued until DNS is live.

Sign in at [domains.lk](https://www.domains.lk/) → your domain → the **DNS / Zone
records** section (the panel's exact wording varies), and add three A records:

| Type | Host | Value | TTL |
|---|---|---|---|
| A | `@` — the apex | `<ELASTIC_IP>` | 3600 |
| A | `www` | `<ELASTIC_IP>` | 3600 |
| A | `api` | `<ELASTIC_IP>` | 3600 |

Two things that trip people up here:

- **The apex record.** If the panel rejects `@`, it wants either an empty host field or
  the fully-qualified `kuja7.lk.` (trailing dot). One of the three is always accepted.
- **The default parking record.** Registrars ship new domains pointing at a "coming
  soon" page. Delete that A record — leaving it alongside yours means DNS round-robins
  between the parking server and your box, and roughly half the certificate validations
  fail for no visible reason.

If the domains.lk panel only lets you set **nameservers** and has no record editor,
delegate instead: create a free Cloudflare zone for `kuja7.lk`, add the same three A
records there, and set Cloudflare's two nameservers at domains.lk. Keep every record
**DNS-only (grey cloud)** — proxying puts Cloudflare's own TLS in front of Caddy's, and
you would be maintaining two certificate layers to serve one site.

Verify before continuing. `.lk` zone changes can take a few hours to publish, longer
than most gTLDs:

```bash
dig +short kuja7.lk @8.8.8.8        # @8.8.8.8 skips your ISP's cache
dig +short api.kuja7.lk @8.8.8.8
dig +short www.kuja7.lk @8.8.8.8
```

All three must return `<ELASTIC_IP>`. Do not start Caddy until they do — failed
validations count against Let's Encrypt's rate limit of 5 certificates per domain per
week.

---

## Phase 6 — Wire up CI and deploy

`.github/workflows/deploy-aws.yml` builds both images on GitHub's runners, pushes them
to GHCR, then SSHes in to pull and restart.

### Create the environment

GitHub → repo **Settings → Environments → New environment** → name it exactly
**`customer-aws`**. Environment secrets shadow repo-level ones, which is what keeps
this target's domains from colliding with the droplet's in `deploy.yml`.

Add these as **environment** secrets:

| Secret | Value |
|---|---|
| `EC2_HOST` | `<ELASTIC_IP>` |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | full contents of the `.pem` private key |
| `WEB_DOMAIN` / `API_DOMAIN` | `kuja7.lk` / `api.kuja7.lk` |
| `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL` | `https://api.kuja7.lk` (both) |
| `FRONTEND_URL` | `https://kuja7.lk` |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_URL` | from the Supabase project |

`FRONTEND_URL` is the CORS allow-list in `apps/api/src/main.ts:28` — if it does not
exactly match the site's scheme + host, every browser request fails.

### Let the runner SSH in

The security group currently allows port 22 from your IP only, so the deploy job will
hang and time out. Either:

- open **22 to `0.0.0.0/0`** (SSH keys only; Ubuntu AMIs disable password auth), or
- keep it locked down and deploy manually — see the fallback below.

### Run it

**Actions → Deploy — Kuja7 (customer AWS) → Run workflow.** First run takes ~8 minutes
(cold layer cache); later runs are 2–3.

Then bring up the proxy:

```bash
cd /opt/infra/caddy && docker compose up -d
docker compose logs -f caddy    # wait for "certificate obtained successfully"
```

Verify:

```bash
curl -I https://kuja7.lk                # 200, valid cert
curl -sS https://api.kuja7.lk/api/v1    # 404 is correct — that route does not exist,
                                           # so a 404 proves TLS + routing + Nest are alive
```

Open the site and log in. Chat exercises the websocket path through Caddy.

### One more Supabase step

Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://kuja7.lk`
- **Redirect URLs:** add `https://kuja7.lk/**`

Skip this and confirmation / password-reset emails keep pointing at localhost.

### Manual fallback (no CI SSH access)

The images are already in GHCR, so the box just needs a pull. Use a classic PAT with
`read:packages`:

```bash
cd /opt/apps/kuja-seven
echo IMAGE_TAG=latest >> .env
echo "<PAT>" | docker login ghcr.io -u <github-user> --password-stdin
docker compose pull && docker compose up -d --remove-orphans
```

---

## Operating notes

```bash
docker compose logs -f kuja7-api        # app logs
docker compose ps
free -h                                 # watch swap usage on the micro
```

- **Rollback** is `IMAGE_TAG=<older-sha>` in `/opt/apps/kuja-seven/.env` then
  `docker compose up -d`. No rebuild — CI tags every image with its commit SHA and the
  deploy prunes only images older than 72h.
- **Certificates renew themselves.** Caddy handles it; certs live in the `caddy-data`
  volume. Deleting that volume re-triggers issuance and can hit Let's Encrypt rate
  limits (5 per domain per week).
- **Changing a domain** means re-running the workflow, not restarting — `NEXT_PUBLIC_*`
  are compiled into the JS bundle at build time.
- **`deploy.yml` still deploys to the DigitalOcean droplet on every push to main.**
  If that box is being retired, delete the workflow; otherwise both targets deploy
  together, which is fine as long as their secrets stay separate.
- **GHCR storage** counts against the org's package quota. Two images per commit adds
  up; set a retention rule under **Packages → Manage versions** if it grows.
- **Backups:** the EC2 box holds no data — everything is in Supabase. Rebuilding it is
  Phases 2–6. Back up Supabase, not the instance.
- **Cost:** ~\$8–10/month at t3.micro + 20 GB gp3 + Elastic IP (free while associated,
  billed hourly when not — release it if the instance is ever terminated).

### Skipped deliberately

ALB + ACM (removes TLS from the box but adds ~\$16/month and target groups),
multi-arch images for cheaper Graviton `t4g.micro`, CloudWatch alarms, auto-scaling.
Add the ALB when a second instance appears.
