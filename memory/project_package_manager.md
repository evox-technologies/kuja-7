---
name: Package manager
description: This project uses pnpm, not npm or yarn
type: project
---

This project uses pnpm as the package manager.

**Why:** User preference / pnpm workspace is planned for the monorepo (apps/web + apps/api).

**How to apply:** Always use `pnpm install`, `pnpm dev`, `pnpm add`, etc. Never suggest npm or yarn commands.
