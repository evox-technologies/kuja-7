import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

// See the comment on the createClient call below. Same cast as
// upload.controller.ts: ws's types don't structurally match the DOM lib types
// realtime-js expects, though they are functionally compatible.
const wsTransport: any = WebSocket;

/**
 * The service-role Supabase client, used for the one thing the portal cannot do
 * from the browser: minting auth users for new moderators.
 *
 * Members never get an auth user created for them here — self-signup owns that,
 * and staff-created sample profiles deliberately have none.
 */
@Injectable()
export class SupabaseAdminService {
  private readonly logger = new Logger(SupabaseAdminService.name);
  private client: SupabaseClient | null = null;

  private admin(): SupabaseClient {
    if (this.client) return this.client;

    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
      this.logger.error(
        'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured',
      );
      throw new InternalServerErrorException('Auth service is not configured');
    }

    this.client = createClient(url, serviceRoleKey, {
      // Server-side client: nothing to persist, nothing to refresh.
      auth: { autoRefreshToken: false, persistSession: false },
      // Needed even though this client only calls auth.admin.* and never opens a
      // channel. realtime-js resolves its WebSocket constructor inside
      // `new SupabaseClient`, not on first subscribe, and Node 20 has no global
      // one — so omitting this threw before any request was made, taking every
      // moderator creation with it.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- see wsTransport
      realtime: { transport: wsTransport },
    });
    return this.client;
  }

  /**
   * Creates a confirmed auth user. `email_confirm: true` skips the
   * confirmation email — staff accounts are handed out with a temporary
   * password in person, not self-registered.
   */
  async createUser(email: string, password: string): Promise<string> {
    const { data, error } = await this.admin().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error || !data.user) {
      this.logger.error(`createUser failed for ${email}: ${error?.message}`);
      throw new InternalServerErrorException(
        error?.message ?? 'Could not create the auth user',
      );
    }

    this.logger.log(`createUser – created auth user ${data.user.id}`);
    return data.user.id;
  }

  async setPassword(supabaseId: string, password: string): Promise<void> {
    const { error } = await this.admin().auth.admin.updateUserById(supabaseId, {
      password,
    });
    if (error) {
      this.logger.error(
        `setPassword failed for ${supabaseId}: ${error.message}`,
      );
      throw new InternalServerErrorException(error.message);
    }
    this.logger.log(`setPassword – updated auth user ${supabaseId}`);
  }

  /**
   * Best-effort cleanup when the profile insert fails after the auth user was
   * created — otherwise the email is taken by an account with no profile and
   * the moderator can never be created again.
   */
  async deleteUser(supabaseId: string): Promise<void> {
    const { error } = await this.admin().auth.admin.deleteUser(supabaseId);
    if (error) {
      this.logger.error(
        `deleteUser failed for ${supabaseId}: ${error.message} – orphaned auth user left behind`,
      );
    }
  }
}
