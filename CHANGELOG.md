# Changelog

All notable changes to this project will be documented in this file.

## [2026-01-27]
### Added
- **Community Feed Topics:** Added topic filtering (Youtube, MMO, Share) to the main feed.
- **Deep Glass Theme:** Implemented a new modern dark theme with glassmorphism effects.
- **Rank Badges:** Enhanced rank badges with better contrast and animations.
- **Database:** Added `topic` column to `posts` table (Migration: `20260127_add_topic_to_posts.sql`).
- **Internationalization:** Complete English and Vietnamese translations for Feed, Create Post, and Todo List features.
- **Deployment:** Successfully deployed to VPS (Ubuntu/aaPanel) with Nginx Reverse Proxy and SSL.

### Changed
- **Sidebar:** Removed `Youtube` and `Tricks & Courses` sub-menus to simplify navigation.
- **Create Post:** Added topic selection dropdown.
- **Feed UI:** Replaced simple list with filter pills for topic selection.
- **Text Contrast:** Improved readability on User Title Badges and Sidebar Rank Widgets.

### Fixed
- **Peer Dependencies:** Resolved NPM peer dependency conflicts during install.
- **Environment:** Automated `.env.local` creation from `vercel_env_vars.html`.
- **Console Logs:** Removed debug console logs from production code.

### Refactored
- **PostCard Component:** Split monolithic `PostCard.tsx` into 5 sub-components (`PostHeader`, `PostContent`, `PostActions`, `PostComments`, `PostApprovalStatus`) for better maintainability.
