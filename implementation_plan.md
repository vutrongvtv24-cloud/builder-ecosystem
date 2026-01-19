# Implementation Plan: Builder Ecosystem Clone

## Project Goal
Create a comprehensive community and education platform mirroring "The All In Plan", featuring a rich 3-column social layout, gamification elements, and a structured learning environment.

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS (for rapid, complex layouts)
- **UI Architecture:** 
  - **Glassmorphism/Modern Dark Mode:** High-contrast, premium feel.
  - **Icons:** Lucide React.
  - **Components:** Shadcn/UI (recommended for consistent, accessible components).

## Core Features to Implement

### Phase 1: Foundation & Layout (The "Shell")
- **Global Layout:** 
  - Left Sidebar (Navigation: Spaces, Classes RPG style).
  - Center Stage (Feed/Content).
  - Right Sidebar (Widgets, Leaderboards).
  - Top Navigation (User tools, Notifications).
- **Design System:** 
  - Define color palette (Dark distinct colors).
  - Typography (Inter or similar modern sans-serif).

### Phase 2: Gamification Engine (The "Hook")
- **Profile Components:**
  - Level Progress Bar.
  - Badge Grid (Displaying 10 lockable badges).
  - "Character Class" rendering (e.g., displaying "Warrior" or "Magician" tags).
- **Leaderboard Widget:** Tabs for 7-day, 30-day, All-time rankings.

### Phase 3: Community & Social (The "Network")
- **Newsfeed:**
  - Post card component (User info, content, rich media).
  - Interaction bar (Like, Comment, Reply).
- **Create Post Widget:** Modal/Inline editor with attachment options.

### Phase 4: Classroom (The "Product")
- **Course Catalog:** Grid view of courses (checking locked/unlocked status).
- **Lesson Viewer:** 
  - Video player placeholder area.
  - Sidebar for lesson navigation.
  - "Mark as Complete" functionality.

## Implementation Steps
1. Initialize Next.js project.
2. Setup Tailwind & Shadcn/UI.
3. Build the `AppShell` layout component.
4. Implement the `Feed` and `Sidebar` static versions.
5. Add interactivity and functionality iteratively.
