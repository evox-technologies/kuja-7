## Admin and Moderator Front-End Requirements

Since there are already several backend endpoints for admins and moderators, implement the corresponding front-end functionality.

The application should provide a separate admin/moderator portal with role-based access, user management, statistics, location management, master-data configuration, moderator management, and permission management.

### 1. Separate Admin/Moderator Portal

Create a separate public URL for the admin and moderator portal.

- The URL should first require authentication.
- Use the existing Supabase authentication/login system.
- After successful authentication:
  - If the user is an Admin, redirect them to the Admin Panel.
  - If the user is a Moderator, redirect them to the Moderator Panel.
- Moderators should only see and access moderator-related screens and functionality.
- Admins should have access to all permitted administrative functionality.

### 2. User Management Module

Create a "Users" module in the navigation bar.

The user-management module should provide the following functionality:

1. View all users
2. Search and filter users
3. Add users manually
4. Edit user profiles
5. Delete users
6. Verify user profiles
7. View registration date

The user list should provide useful filtering and searching capabilities so that admins and moderators can quickly locate specific users.

#### Add User

Both admins and moderators should have the ability to create dummy users.

This functionality is important because, before marketing and launching the website, the system needs to contain realistic sample/dummy profiles that new users can see.

When adding a user:

- Display a complete user/profile form.
- Ask for all required user information.
- Clearly mark mandatory fields with an asterisk (*).
- Validate required fields before submission.
- Allow the moderator/admin to save the profile.
- After saving, the profile should appear in the user-management system.

### 3. Admin User Management

Admins should have additional privileges compared with moderators.

Admins should be able to:

- View all users
- Search and filter users
- Add users
- Edit users
- Verify users
- Delete users
- Activate/deactivate users
- View registration information
- View relevant user details

Moderators should only have the permissions assigned to their role.

For example, moderators may be allowed to add and edit profiles but should not be allowed to delete users unless that permission is explicitly granted.

### 4. Profile Verification

Add a profile-verification capability.

Profiles can have statuses such as:

`Pending → Under Review → Verified → Rejected`

Admins/moderators should be able to:

- View pending profiles
- Review profiles
- Approve profiles
- Reject profiles
- View rejection reasons
- Verify profile information
- Change verification status

This can later be extended to photo and identity verification.

---

## 5. Location Management Module

Location is an important part of matrimonial matching, so locations should not be hard-coded into the application.

Create a "Location Management" module where admins can manage geographical data.

The module should support:

- Countries
- Provinces/States
- Districts
- Cities
- Areas
- Add locations
- Edit locations
- Enable/disable locations

For Sri Lanka, the structure could be:

`Country → Province → District → DS Division/City → Area`

The system should also be designed so that international locations can be added later.

For example:

`Sri Lanka → Western Province → Colombo → Colombo → Area`

The admin should be able to add or modify locations without changing the application source code.

---

## 6. Master Data Management Module

Create a "Master Data" module so that configurable matrimonial profile options do not need to be hard-coded.

The admin should be able to manage values such as:

- Education levels
- Professions
- Industries
- Languages
- Hobbies
- Interests
- Family types
- Marital status
- Height ranges
- Lifestyle options
- Other profile-related attributes

For each master-data category, the admin should be able to:

- Add a new value
- Edit an existing value
- Enable/disable a value
- Reorder values where necessary
- View currently available values

For example, under Education:

`Education → Add Education`

Possible values:

- O/L
- A/L
- Diploma
- Bachelor's Degree
- Master's Degree
- PhD

If a client wants to add another education category, the admin should be able to do so without modifying the application code.

This will make the matrimonial platform reusable for different clients and countries.

---

## 7. Dashboard / Statistics Module

Create a "Dashboard" or "Stats" module for administrators.

The dashboard should provide an overview of the matrimonial platform and user activity.

Possible statistics include:

- Total users
- New registrations
- Active users
- Inactive users
- Verified users
- Unverified users
- Male/female distribution
- Age distribution
- Location distribution
- Interests sent
- Interests accepted
- Number of matches
- Number of conversations
- New messages
- Profile completion rate
- Reported users
- Blocked users
- Paid users
- Revenue

The dashboard should use appropriate cards, tables, charts, and graphs to make the information easy to understand.

A useful high-level conversion flow could be displayed as:

`Registrations → Interests → Matches → Conversations`

The statistics module should be designed in a modular way so additional reports can be added later.

---

## 8. Moderator Management Module

Create a "Moderator Management" module that is accessible only to admins.

Moderators represent data-entry or operational users who help maintain the matrimonial database.

Admins should be able to:

- Create moderator accounts
- Activate/deactivate moderators
- Assign permissions
- Reset moderator access where applicable
- View moderator activity
- View profiles created by each moderator
- View profiles edited by each moderator

For example, the admin could see:

`Moderator A → 125 profiles created → 83 profiles edited`

`Moderator B → 94 profiles created → 42 profiles edited`

This will also help the client monitor the productivity and activity of data-entry staff.

The initial role hierarchy can be:

`Super Admin → Admin → Moderator`

The architecture should allow additional roles to be introduced later.

---

## 9. Roles & Permissions Module

Create a "Roles & Permissions" module rather than hard-coding all permissions directly into the application.

Admins should be able to assign specific permissions to different roles.

For example:

| Permission | Super Admin | Admin | Moderator |
|---|---:|---:|---:|
| View users | ✓ | ✓ | ✓ |
| Search users | ✓ | ✓ | ✓ |
| Add users | ✓ | ✓ | ✓ |
| Edit users | ✓ | ✓ | ✓ |
| Delete users | ✓ | ✓ | ✗ |
| Verify profiles | ✓ | ✓ | ✓ |
| View statistics | ✓ | ✓ | Optional |
| Manage moderators | ✓ | ✓ | ✗ |
| Manage locations | ✓ | ✓ | Optional |
| Manage master data | ✓ | ✓ | ✗ |
| Manage roles | ✓ | ✓ | ✗ |
| System settings | ✓ | ✓ | ✗ |

The permission system should be flexible enough to allow permissions to be added in the future.

For example:

`users.view`

`users.create`

`users.edit`

`users.delete`

`users.verify`

`locations.manage`

`masterData.manage`

`statistics.view`

`moderators.manage`

`roles.manage`

This will make the application much easier to scale.

---

## 10. Front-End Module Configuration

Create a front-end configuration file named `modules.ts`.

This file should control which modules are enabled or disabled for a particular client/deployment.

For example:

```ts
export const modules = {
  users: true,
  profileVerification: true,
  locations: true,
  masterData: true,
  statistics: true,
  moderators: true,
  rolesPermissions: true,
};
```

The application should use this configuration to determine which modules are displayed.

For example, if the Stats module needs to be disabled for a particular client:

```ts
statistics: false
```

After deploying the application, the Statistics module should not appear in the Admin Panel navigation.

The module configuration should be designed so that additional modules can easily be added in the future.

---

## 11. Navigation Structure

The admin/moderator portal should have a clear navigation bar.

A possible Admin navigation structure is:

```text
Dashboard

Users
  ├── All Users
  └── Add User

Verification

Locations

Master Data

Statistics

Moderators

Roles & Permissions

Settings
```

The Moderator navigation could be more restricted:

```text
Dashboard

Users
  ├── All Users
  └── Add User

Verification
```

The exact modules displayed should depend on both:

1. The user's role/permissions
2. The enabled modules in `modules.ts`

Therefore, a module should only be visible when both conditions are satisfied.

For example:

`User has permission + Module enabled = Module visible`

---

## 12. Role-Based Access Requirements

The front-end should enforce role-based access consistently.

Expected behavior:

- Super Admin → Full system access
- Admin → All assigned administrative modules
- Moderator → Only moderator-permitted modules
- Unauthorized user → No access to the admin/moderator portal
- Disabled module → Not displayed and not accessible through the front-end
- Admin-only actions → Not available to moderators without the required permission

The backend should continue to enforce authorization as well. Front-end hiding should not be considered a security mechanism by itself.

---

## 13. Future Extensibility

The architecture should be designed so that additional matrimonial features can be added later without significantly restructuring the application.

Potential future modules include:

- Match management
- Interest management
- Chat management
- Reports and complaints
- Photo management
- Subscription management
- Payment management
- Notification management
- Marketing/campaign management
- Content management
- Audit logs
- Advanced analytics

These should be treated as independent modules so they can later be enabled or disabled through the module configuration system.

The overall goal is to create a reusable, configurable matrimonial administration platform where different clients can have different modules, roles, and permissions without requiring a separate codebase for each client.