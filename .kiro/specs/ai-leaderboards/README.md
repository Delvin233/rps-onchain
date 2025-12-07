# AI Leaderboards Specification

## Overview

This specification defines the AI Leaderboards feature for the Rock Paper Scissors game. Players compete against AI opponents and earn ranks based on their total wins, progressing through 38 ranks from Beginner to the ultimate RPS-God X.

## 📁 Specification Documents

### 1. [requirements.md](./requirements.md)
**Purpose**: Formal requirements with acceptance criteria

**Contents**:
- 10 detailed requirements (EARS-compliant)
- 38 rank definitions with win thresholds
- Database schema
- API endpoints
- Success metrics
- Future enhancements

**Use**: Reference for what needs to be built and how to validate it

---

### 2. [design.md](./design.md)
**Purpose**: Technical design and architecture

**Contents**:
- System architecture diagram
- Database design with indexes
- API endpoint specifications
- Frontend component designs
- Rank calculation logic
- Name resolution strategy
- Performance optimizations
- Security considerations
- Testing strategy
- Deployment checklist

**Use**: Reference for how to build the feature

---

### 3. [tasks.md](./tasks.md)
**Purpose**: Implementation task breakdown

**Contents**:
- 34 actionable tasks across 8 phases
- Estimated time: ~75 hours
- Dependencies and critical path
- Subtasks for each major task
- Team size recommendations

**Use**: Project management and sprint planning

---

### 4. [RANK_SYSTEM.md](./RANK_SYSTEM.md)
**Purpose**: Comprehensive rank system documentation

**Contents**:
- Design philosophy and progression curve
- Complete rank list with descriptions
- Visual design specifications
- Rank up experience design
- Progression examples (casual/dedicated/elite)
- Balancing considerations
- Success metrics and target distribution

**Use**: Understanding the rank system in detail

---

### 5. [HOME_PAGE_MOCKUP.md](./HOME_PAGE_MOCKUP.md)
**Purpose**: Visual mockup of rank card on home page

**Contents**:
- Desktop and mobile layouts
- Card structure and components
- All rank states (unranked to RPS-God X)
- Glowing border implementation (CSS)
- Interaction behaviors
- Implementation code examples
- Responsive design breakpoints

**Use**: Reference for implementing the rank card UI

---

### 6. [LEADERBOARD_MOCKUP.md](./LEADERBOARD_MOCKUP.md)
**Purpose**: Visual mockup of full leaderboard page

**Contents**:
- Desktop and mobile layouts
- Component breakdown (header, user card, table, list)
- Rank badge examples
- Current user highlighting
- Loading, empty, and error states
- Pagination implementation
- Complete code examples

**Use**: Reference for implementing the leaderboard page

---

### 7. [UI_SUMMARY.md](./UI_SUMMARY.md)
**Purpose**: Visual summary of entire UI experience

**Contents**:
- Home page rank card with glowing borders
- Full leaderboard view (desktop and mobile)
- User journey walkthrough
- Key visual features explained
- Animation examples (CSS)
- Responsive behavior
- Accessibility considerations
- Performance optimizations

**Use**: Quick reference for understanding the complete UI

---

### 8. [COLOR_RATIONALE.md](./COLOR_RATIONALE.md)
**Purpose**: Explanation of color choices for each rank tier

**Contents**:
- Design principles (progressive intensity, psychology, accessibility)
- Detailed breakdown of each rank's color choice
- Color psychology and cultural associations
- Visual hierarchy and emotional journey
- Accessibility considerations (color blindness, contrast)
- Cultural sensitivity analysis
- Competitive gaming context
- Implementation notes (CSS variables, Tailwind classes)

**Use**: Understanding the reasoning behind color choices

---

## 🎯 Quick Start

### For Product Managers
1. Read [requirements.md](./requirements.md) for feature scope
2. Review [RANK_SYSTEM.md](./RANK_SYSTEM.md) for rank design
3. Check success metrics and target distribution

### For Developers
1. Read [design.md](./design.md) for architecture
2. Review [tasks.md](./tasks.md) for implementation plan
3. Start with Phase 1: Database & Core Logic

### For Designers
1. Read [RANK_SYSTEM.md](./RANK_SYSTEM.md) for visual design
2. Review rank colors and gradients
3. Design rank badges and rank up animations

### For QA
1. Read [requirements.md](./requirements.md) for acceptance criteria
2. Review [design.md](./design.md) for test scenarios
3. Check [tasks.md](./tasks.md) Phase 7 for testing tasks

---

## 🏆 Rank System Summary

### 38 Total Ranks Across 9 Tiers

```
Entry (0-19 wins)
├─ Beginner, Novice, Fighter

Warrior (20-49 wins)
├─ Warrior I, II, III

Expert (50-79 wins)
├─ Expert I, II, III

Master (80-109 wins)
├─ Master I, II, III

Grandmaster (110-139 wins)
├─ Grandmaster I, II, III

Champion (140-169 wins)
├─ Champion I, II, III

Legend (170-219 wins)
├─ Legend I, II, III, IV, V

Mythic (220-319 wins)
├─ Mythic I, II, III, IV, V

RPS-God (320-690+ wins) ⭐
├─ RPS-God I through X
└─ RPS-God X (690+) 👑 ULTIMATE RANK
```

### Key Features

✅ **38 ranks** with sub-levels for frequent progression  
✅ **Tekken-inspired** proven engagement mechanics  
✅ **Color-coded tiers** from gray → cosmic gradient  
✅ **Auto-tracking** wins update automatically  
✅ **Real-time updates** see rank changes immediately  
✅ **Name resolution** ENS/Basename/Farcaster support  
✅ **Home page integration** rank displayed in stats section  
✅ **Leaderboard** paginated rankings with position  
✅ **One-click access** click rank card to view full leaderboard  

---

## 📊 Implementation Timeline

### Phase 1-2: Core Functionality (2 weeks)
- Database setup
- API endpoints
- Rank calculation logic
- AI match integration

### Phase 3-4: UI Components (1.5 weeks)
- Leaderboard page
- Rank badges
- Profile integration
- Loading/error states

### Phase 5: Name Resolution (1 week)
- ENS/Basename/Farcaster lookup
- Caching mechanism
- Fallback to addresses

### Phase 6-8: Polish & Launch (1.5 weeks)
- Animations and transitions
- Testing and QA
- Deployment and monitoring

**Total Estimated Time**: 6 weeks (1-2 developers)

---

## 🎨 Visual Design Highlights

### Color Progression
- **Entry**: Gray/White (humble beginnings)
- **Warrior-Expert**: Blue/Green (growth)
- **Master-Grandmaster**: Dark Green/Purple (mastery)
- **Champion-Legend**: Gold/Red (prestige)
- **Mythic**: Rainbow gradient (transcendent)
- **RPS-God**: Cosmic gradient with glow (divine)

### Special Effects
- **Mythic ranks**: Rainbow gradient with subtle animation
- **RPS-God ranks**: Cosmic gradient with glow effect
- **RPS-God X**: Enhanced cosmic gradient with pulse animation
- **Rank up**: Confetti effect and celebratory toast

---

## 📈 Success Metrics

### Engagement Metrics
- % of AI players who check leaderboard
- Average leaderboard views per session
- Rank card views on profile

### Retention Metrics
- Do ranked players play more AI matches?
- Return rate after rank up
- Play frequency by rank tier

### Progression Metrics
- Average time to reach each rank
- Win rate by rank tier
- Rank distribution across player base

### Target Distribution (6 months)
- Entry (0-19): 30%
- Warrior-Expert (20-79): 35%
- Master-Grandmaster (80-139): 20%
- Champion-Legend (140-219): 10%
- Mythic (220-319): 4%
- RPS-God (320+): 1%

---

## 🔮 Future Enhancements

### Phase 2 (Post-Launch)
- Animated rank badges
- Rank history tracking
- Weekly leaderboards
- Friend rankings
- Achievement system

### Phase 3 (Advanced)
- Multiplayer leaderboards
- Regional rankings
- Rank decay (inactive players)
- NFT rank badges
- Token rewards
- Rank-based tournaments

---

## 🚀 Getting Started

### Prerequisites
- Turso database access
- Next.js app setup
- AI match completion flow

### Quick Implementation
1. Create database table (Task 1.2)
2. Implement rank utilities (Task 1.1)
3. Build API endpoints (Tasks 2.1-2.3)
4. Create UI components (Tasks 3.1-3.4)
5. Integrate with AI matches (Task 4.2)
6. Test and deploy (Phase 7-8)

### First Milestone
**Goal**: Display basic leaderboard with ranks  
**Time**: 2 weeks  
**Tasks**: Phase 1-3 (Database, API, UI)  

---

## 📝 Notes

- Inspired by Tekken's ranking system for proven engagement
- Sub-ranks provide frequent dopamine hits
- RPS-God tier creates aspirational long-term goal
- Reaching RPS-God X (690+ wins) is the ultimate achievement
- System is designed to be balanced yet rewarding
- Monitor metrics and adjust thresholds as needed

---

## 📞 Questions?

For questions about:
- **Requirements**: See [requirements.md](./requirements.md)
- **Technical Design**: See [design.md](./design.md)
- **Implementation**: See [tasks.md](./tasks.md)
- **Rank System**: See [RANK_SYSTEM.md](./RANK_SYSTEM.md)

---

**Last Updated**: December 7, 2025  
**Status**: Ready for Implementation  
**Estimated Effort**: 75 hours (6 weeks with 1-2 developers)

