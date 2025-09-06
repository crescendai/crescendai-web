# CrescendAI - Music Editor Display PRD

## Overview

CrescendAI is a piano learning web application that provides intelligent feedback on piano performances using AI-powered analysis. The music editor display is the core feature that allows users to visualize their performance alongside expert feedback based on 19 feedback dimensions from the percepiano dataset.

## Problem Statement

Piano learners struggle to identify specific moments in their performance that need improvement. Traditional feedback is often general and doesn't pinpoint exact timestamps where issues occur. Users need a visual, interactive way to:

- See precisely when and where performance issues occur
- Understand what specific aspects need improvement
- Navigate through their performance timeline efficiently
- Receive actionable feedback at granular time intervals

## Product Goals

### Primary Goals
1. **Visual Feedback Timeline**: Provide clear visual indicators of performance quality throughout a piano recording
2. **Granular Analysis**: Display feedback markers every 3 seconds with color-coded performance indicators
3. **Interactive Experience**: Allow users to explore feedback through hover and click interactions
4. **Audio Synchronization**: Enable seamless audio playback with timeline navigation

### Secondary Goals
1. **Performance Insights**: Help users identify patterns in their playing
2. **Progress Tracking**: Provide a foundation for tracking improvement over time
3. **Intuitive Navigation**: Make it easy to jump to specific moments in the performance

## Target Users

### Primary Users
- **Piano Students** (Beginner to Intermediate): Ages 12-35, learning piano independently or with instructors
- **Adult Learners**: Professionals looking to improve piano skills in their spare time

### Secondary Users
- **Piano Teachers**: Using the platform to analyze student performances
- **Advanced Pianists**: Seeking detailed performance analysis for self-improvement

## User Stories

### Core User Stories

**As a piano student, I want to:**
- See a visual timeline of my 1-minute performance with quality indicators
- Understand exactly what went wrong at specific moments in my playing
- Play my recording and jump to specific points where I made mistakes
- Get actionable feedback on how to improve specific aspects of my performance

**As a piano teacher, I want to:**
- Review student performances with detailed timestamp-based feedback
- Show students specific moments that need attention
- Provide structured feedback based on the 19-dimension analysis

### Detailed User Scenarios

#### Scenario 1: First-time User
Sarah, a 22-year-old piano student, uploads her first recording:
1. Navigates to `/details/[recording-id]` page
2. Sees her 1-minute performance timeline with color-coded markers
3. Notices several red markers indicating areas for improvement
4. Hovers over a red marker to see "Timing: -0.3 score - Slightly rushed in this passage"
5. Clicks the marker to see detailed feedback card
6. Uses audio player to listen to that specific section

#### Scenario 2: Regular Practice Session
Mike, an adult learner, is working on improving his technique:
1. Reviews his latest recording in the editor
2. Compares red markers from previous sessions to see improvement
3. Focuses on sections that still show red markers
4. Uses timeline navigation to quickly jump between problem areas

## Feature Requirements

### Must-Have Features (MVP)

#### 1. Audio Player Component
- **Play/Pause Controls**: Standard audio controls
- **Progress Bar**: Visual representation of current playback position
- **Timeline Navigation**: Click-to-seek functionality
- **Duration Display**: Current time / Total time format (e.g., "0:23 / 1:00")

#### 2. Performance Timeline
- **60-Second Timeline**: Horizontal timeline representing full 1-minute recording
- **3-Second Intervals**: 20 markers total (60 seconds ÷ 3 seconds = 20 markers)
- **Color-Coded Markers**: 
  - Green: Positive feedback (score above threshold)
  - Red: Alert/needs improvement (score below threshold)
- **Marker Positioning**: Accurate positioning at 3, 6, 9, 12... 60 seconds

#### 3. Interactive Feedback Markers
- **Hover State**: 
  - Show tooltip with score and truncated feedback text (max 50 characters)
  - Smooth transition effects
- **Click State**:
  - Display detailed feedback card/modal
  - Full feedback text and score
  - Actionable improvement suggestions

#### 4. Responsive Design
- **Mobile Optimized**: Timeline and markers work on touch devices
- **Desktop Enhanced**: Hover states and detailed interactions

### Should-Have Features (Phase 2)

#### 1. Enhanced Audio Controls
- **Playback Speed**: 0.5x, 0.75x, 1x, 1.25x, 1.5x speed options
- **Loop Section**: Ability to loop specific timeline sections
- **Waveform Visualization**: Visual audio waveform overlay

#### 2. Advanced Feedback Display
- **Feedback Categories**: Filter markers by feedback dimension (timing, dynamics, etc.)
- **Severity Levels**: Multiple color gradients based on feedback severity
- **Trend Indicators**: Show improvement/decline compared to previous recordings

#### 3. Performance Analytics
- **Overall Score**: Aggregate performance score for the recording
- **Dimension Breakdown**: Scores for each of the 19 feedback dimensions
- **Progress Charts**: Visual representation of improvement over time

### Could-Have Features (Future)

#### 1. Collaborative Features
- **Teacher Comments**: Allow teachers to add additional feedback
- **Shared Sessions**: Share recordings with instructors or peers

#### 2. Practice Tools
- **Metronome Integration**: Visual metronome overlay on timeline
- **Practice Loops**: Automatically create practice loops for problem areas
- **Goal Setting**: Set specific improvement targets for each dimension

## Technical Requirements

### Performance Requirements
- **Page Load Time**: < 2 seconds for timeline rendering
- **Audio Load Time**: < 1 second for audio file loading
- **Smooth Playback**: No audio dropouts or stuttering
- **Responsive Interactions**: Marker hover/click response < 100ms

### Browser Support
- **Desktop**: Chrome 100+, Firefox 100+, Safari 15+, Edge 100+
- **Mobile**: iOS Safari 15+, Chrome Mobile 100+

### Accessibility Requirements
- **Keyboard Navigation**: Full functionality accessible via keyboard
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Color Blind Friendly**: Alternative indicators beyond just color
- **Focus Management**: Clear focus states for all interactive elements

## Success Metrics

### Primary Metrics
1. **User Engagement**: Average time spent on music editor page (target: >3 minutes)
2. **Interaction Rate**: Percentage of users who click on feedback markers (target: >70%)
3. **Completion Rate**: Percentage of users who view their full recording (target: >60%)

### Secondary Metrics
1. **Feedback Utility**: User ratings on feedback helpfulness (target: >4/5)
2. **Return Usage**: Users who return to view the same recording multiple times
3. **Performance Improvement**: Measurable improvement in subsequent recordings

## User Interface Requirements

### Layout Structure
```
┌─────────────────────────────────────────┐
│                Audio Player              │
│  [Play] [0:23 / 1:00] ==================│
└─────────────────────────────────────────┘
│
┌─────────────────────────────────────────┐
│              Timeline View               │
│  0:00    0:15    0:30    0:45    1:00   │
│   │       │       │       │       │     │
│   🔴     🟢      🔴      🟢      🔴    │
│                                         │
│  [Feedback markers every 3 seconds]     │
└─────────────────────────────────────────┘
│
┌─────────────────────────────────────────┐
│         Feedback Card (on click)        │
│                                         │
│  "Timing Feedback"                      │
│  Score: -0.3                           │
│                                         │
│  "This passage was played slightly      │
│   too fast. Try using a metronome..."  │
│                                         │
│  [Improvement Tips]                     │
└─────────────────────────────────────────┘
```

### Visual Design Principles
- **Clean & Minimal**: Focus on the music and feedback
- **High Contrast**: Ensure markers are clearly visible
- **Consistent Colors**: Green = good, Red = needs work
- **Smooth Animations**: Professional, polished interactions

## Risks & Assumptions

### Assumptions
- Users will upload 1-minute piano recordings
- Feedback data includes scores and text for 19 dimensions
- Users have basic familiarity with audio players
- Audio files are in standard web formats (MP3, WAV)

### Risks
- **Audio Loading Issues**: Large audio files may cause performance problems
- **Mobile Touch Interactions**: Small markers may be difficult to tap accurately
- **Feedback Overload**: Too much information might overwhelm users
- **Browser Compatibility**: Audio playback inconsistencies across browsers

### Mitigation Strategies
- Implement audio compression and lazy loading
- Increase marker size on mobile devices
- Provide progressive disclosure of feedback details
- Thorough cross-browser testing and fallbacks

## Success Criteria

The music editor display feature will be considered successful when:

1. **90%+ of users** can successfully navigate the timeline and interact with markers
2. **Average session duration** exceeds 3 minutes on the editor page
3. **User feedback ratings** for the feature average 4+ out of 5 stars
4. **Performance metrics** meet all technical requirements
5. **Zero critical bugs** in audio playback or timeline functionality

## Future Considerations

- Integration with MIDI file support
- Real-time feedback during live playing
- Multi-track support for complex pieces
- Social sharing of performances
- Integration with external practice apps

---

*Document Version: 1.0*  
*Last Updated: [Current Date]*  
*Next Review: [Date + 30 days]*