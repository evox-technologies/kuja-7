-- Default permission matrix, per section 9 of the admin requirements.
--
-- Separate from 20260823000000 because that migration adds 'SUPER_ADMIN' to the
-- Role enum, and Postgres refuses to let a new enum value be used inside the
-- same transaction that created it.
--
-- These are defaults, not law: the Roles & Permissions screen writes this table
-- at runtime. ON CONFLICT DO NOTHING keeps the migration re-runnable against a
-- database where an admin has already edited the matrix.

INSERT INTO "role_permissions" ("id", "role", "permission")
SELECT gen_random_uuid(), r.role::"Role", p.permission
FROM (
  VALUES
    ('SUPER_ADMIN'), ('ADMIN'), ('MODERATOR')
) AS r(role)
CROSS JOIN (
  VALUES
    ('users.view'), ('users.create'), ('users.edit'), ('users.delete'),
    ('users.verify'), ('statistics.view'), ('moderators.manage'),
    ('roles.manage'), ('settings.manage')
) AS p(permission)
WHERE
  -- Super admins and admins get everything.
  r.role IN ('SUPER_ADMIN', 'ADMIN')
  -- Moderators are data-entry staff: they may add, edit and verify members,
  -- but not delete them, manage other moderators, or change the matrix.
  OR (r.role = 'MODERATOR' AND p.permission IN (
    'users.view', 'users.create', 'users.edit', 'users.verify'
  ))
ON CONFLICT ("role", "permission") DO NOTHING;
