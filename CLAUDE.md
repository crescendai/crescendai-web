# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CrescendAI is a piano learning web application that provides AI-powered feedback on piano performances based on 19 feedback dimensions. The core feature is a music editor display located at `/dashboard/[id]` that shows performance feedback on an interactive timeline with synchronized audio playback.

The application follows a **Spotify-like design aesthetic** for all music-related components including the audio player, timeline, waveform visualization, markers, hover states, and feedback cards.

## Development Commands

```bash
# Development server with Turbo
pnpm dev

# Database operations
pnpm db:setup        # Create .env file and setup database
pnpm db:migrate      # Run migrations (includes seeding)
pnpm db:seed         # Seed database manually if needed
pnpm db:generate     # Generate new migrations
pnpm db:studio       # Open Drizzle Studio

# Build and production
pnpm build
pnpm start
```

## Architecture Overview

### Database Schema (Multi-tenant with Organizations)
- **Authentication**: NextAuth.js with `users`, `accounts`, `sessions`, `verification_tokens`
- **Multi-tenancy**: `organizations` and `organization_members` tables
- **Core Data**: `recordings` and `recording_results` tables
- **Future**: `feedback_markers` table for timeline feedback (not yet implemented)

### Key Database Relationships
```typescript
// Users belong to organizations (many-to-many)
users ←→ organization_members ←→ organizations

// Recordings belong to organizations and users
recordings → organizations
recordings → users (created_by)
recordings → recording_results (optional)

// Recording states: 'queued' | 'processing' | 'processed'
```

### Application Structure
```
app/
├── dashboard/[id]/          # Main music editor route
│   ├── page.tsx
│   └── loading.tsx
├── components/              # Shared UI components
│   ├── ui/                 # shadcn/ui components
│   ├── audio-player.tsx    # Spotify-style audio player
│   ├── timeline.tsx        # Interactive timeline with markers  
│   ├── feedback-marker.tsx # Color-coded feedback markers
│   └── feedback-card.tsx   # Detailed feedback modal/card
└── layout.tsx
```

### Data Flow Pattern
1. **Recording Upload** → `recordings` table (state: 'queued')
2. **AI Processing** → Update state to 'processing' 
3. **Results Storage** → `recording_results` table + state to 'processed'
4. **Timeline Display** → Parse results for 3-second interval markers
5. **Interactive Feedback** → Hover/click on timeline markers

## Core Feature: Music Editor Timeline

The main feature is a **60-second performance timeline** with:

- **Audio Player**: Spotify-style controls (play/pause, scrubber, time display)
- **Timeline Markers**: 20 markers at 3-second intervals (3s, 6s, 9s... 60s)
- **Color Coding**: Green (positive feedback) / Red (needs improvement)
- **Interactions**: 
  - Hover → Tooltip with score + truncated feedback
  - Click → Detailed feedback card/modal
- **Synchronization**: Audio playback position synced with timeline progress

## Design System

### Spotify-Inspired Design Requirements
- **Dark theme** with green accents (#1DB954 Spotify green)
- **Rounded corners** and smooth animations
- **Subtle shadows** and elevated surfaces
- **Monospace fonts** for time displays
- **Smooth hover transitions** with scale/opacity effects
- **Card-based layouts** with subtle borders
- **Progress bars** with rounded edges and smooth fills

### Component Styling Guidelines
```typescript
// Audio Player: Dark background, green play button, rounded scrubber
// Timeline: Dark surface with green/red circular markers
// Markers: Smooth hover scale, subtle glow effects
// Feedback Cards: Dark modal with green accent border
// Typography: Inter for UI, monospace for times
```

## Database Utilities

### Key Database Files
- `lib/db/schema.ts` - Drizzle schema definitions with relations
- `lib/db/queries.ts` - Reusable query functions
- `lib/db/actions.ts` - Database mutation functions
- `lib/db/drizzle.ts` - Database connection setup

### Pattern for New Queries
```typescript
// Always use proper relations and indexes
export async function getRecordingWithFeedback(recordingId: number) {
  return await db
    .select()
    .from(recordings)
    .leftJoin(feedbackMarkers, eq(recordings.id, feedbackMarkers.recordingId))
    .where(eq(recordings.id, recordingId));
}
```

## Component Development

### shadcn/ui Integration
- Components configured in `components.json` with "new-york" style
- Base path: `@/components/ui`
- Uses CSS variables for theming
- Aliases configured: `@/components`, `@/lib`, `@/hooks`

### Utility Functions
- `lib/utils.tsx` contains `cn()` for className merging
- `formatEmailString()` for user display names
- `highlightText()` for search highlighting
- `toTitleCase()` for text formatting

## Music Editor Implementation Priority

### Phase 1: Core Timeline (Current Focus)
1. Create `/dashboard/[id]` route structure
2. Build Spotify-style audio player component
3. Implement 60-second timeline with 20 marker positions
4. Add basic color-coded markers (green/red)
5. Sync audio playback with timeline progress

### Phase 2: Interactive Features
1. Add hover tooltips for markers
2. Implement click-to-show feedback cards
3. Add seek functionality (click timeline to jump)
4. Enhanced audio controls (speed, volume)

### Phase 3: Advanced Features
1. Waveform visualization overlay
2. Feedback filtering by category
3. Practice loop functionality
4. Performance analytics dashboard

## Important Notes

- **Audio Files**: Plan for web-compatible formats (MP3, WAV)
- **Performance**: Timeline rendering must be optimized for smooth 60fps interactions
- **Accessibility**: Keyboard navigation and screen reader support required
- **Mobile**: Touch-friendly marker interactions with larger touch targets
- **Testing**: Focus on audio playback cross-browser compatibility

The complete technical specification and PRD are available in the `docs/` directory for detailed implementation guidance.