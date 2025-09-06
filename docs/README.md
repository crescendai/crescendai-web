# CrescendAI Documentation

This directory contains comprehensive documentation for the CrescendAI piano learning web application.

## 📋 Documentation Index

### Planning & Strategy
- **[PRD.md](./PRD.md)** - Product Requirements Document
  - Project overview and goals  
  - User stories and requirements
  - Success metrics and criteria
  - Risk analysis and mitigation

- **[TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md)** - Technical Specification
  - System architecture overview
  - Phase-by-phase implementation plan
  - Database schema and API design
  - Development timeline and deliverables

## 🎯 Project Overview

CrescendAI is a piano learning web application that provides intelligent feedback on piano performances using AI-powered analysis. The core feature is a music editor display that visualizes performance feedback on an interactive timeline.

### Key Features
- **Interactive Timeline**: 60-second performance timeline with feedback markers every 3 seconds
- **AI Feedback**: Color-coded markers showing performance quality (green = good, red = needs improvement)
- **Audio Player**: Synchronized audio playback with seek functionality
- **Detailed Feedback**: Hover and click interactions revealing specific improvement suggestions
- **19 Feedback Dimensions**: Based on the percepiano dataset for comprehensive analysis

## 🏗️ Architecture

```
Frontend (Next.js 15 + React 19)
├── Audio Player Component
├── Timeline Component  
├── Feedback Marker System
└── Interactive Feedback Cards

Backend (PostgreSQL + Drizzle ORM)
├── Recordings Table
├── Feedback Markers Table
└── User Management System
```

## 📈 Development Phases

### Phase 1: Foundation (2-3 weeks)
- Core audio playback functionality
- Basic timeline with static markers  
- Database schema and API endpoints
- Route structure (`/details/[id]`)

### Phase 2: Interactivity (2-3 weeks)
- Hover and click interactions for markers
- Feedback card/modal system
- Enhanced audio controls
- Mobile responsiveness

### Phase 3: Advanced Features (2-3 weeks)
- Waveform visualization
- Feedback filtering and categorization
- Practice loop functionality
- Performance analytics

### Phase 4: Production (1-2 weeks)
- Performance optimization
- Production deployment
- Monitoring and analytics
- Final testing and polish

## 🎨 UI/UX Design

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
└─────────────────────────────────────────┘
│
┌─────────────────────────────────────────┐
│         Feedback Card (on click)        │
│  "Timing Feedback" - Score: -0.3       │
│  "This passage was played slightly..."  │
└─────────────────────────────────────────┘
```

## 🔧 Technical Stack

- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: PostgreSQL with Drizzle ORM  
- **Audio**: Web Audio API + HTML5 Audio
- **State Management**: React hooks + Context
- **Testing**: Jest + Playwright
- **Deployment**: Vercel (recommended)

## 📊 Success Metrics

### Primary KPIs
- **User Engagement**: >3 minutes average session time
- **Interaction Rate**: >70% users clicking on markers
- **Completion Rate**: >60% users viewing full recordings

### Technical KPIs  
- **Page Load Time**: <2 seconds
- **Audio Load Time**: <1 second
- **Interaction Response**: <100ms

## 🚀 Getting Started

1. **Review Documentation**: Start with the PRD to understand requirements
2. **Technical Planning**: Review the technical spec for implementation details
3. **Development Setup**: Follow the main README.md in project root
4. **Phase Implementation**: Begin with Phase 1 core functionality

## 📝 Document Maintenance

- **PRD**: Updated when requirements change or new features are added
- **Technical Spec**: Updated after each phase completion
- **This README**: Updated when new documentation is added

For questions or clarifications, refer to the detailed documents above or create an issue in the project repository.

---

*Last Updated: [Current Date]*  
*Version: 1.0*