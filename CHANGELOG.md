# Changelog

Bug fixes are migrated here from `bugs.md` once verified. Features are migrated
from `features.md`. Each entry keeps the original `BUG-<id>` / `FEAT-<id>` so
history can be traced both ways.

The format is loosely [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
with `Verified`, `Added`, `Changed`, `Fixed`, `Removed`, and `Security` sections
under each release/date heading.

---

## Unreleased

### Verified

### Added

### Changed

### Fixed

- [BUG-1781501120] Projects now render in production — replaced the stale Vercel `GITHUB_TOKEN` and hardened `app/lib/github.ts` (try/catch around the paginated repos fetch so a timeout can't crash the render, fallback to the public repos endpoint when the authenticated request yields nothing, and a timeout + graceful fallback in `fetchReadme`). Fixes the always-empty "No projects to display" Work timeline. [patch]

### Removed

### Security
