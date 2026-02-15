# Raise the Crown - AI Literacy Workshop Platform

## Overview

A complete React-based delivery platform for an AI literacy video workshop targeting African American students, primarily at Morehouse College. The platform hosts 4 video modules and includes an interactive Du Bois chatbot.

## Project Structure

```
/home/user/Claude-Code/raise-the-crown/platform/
├── src/
│   ├── components/
│   │   ├── Layout.jsx/css          # App shell with navbar and footer
│   │   ├── VideoPlayer.jsx/css     # Custom video player with controls
│   │   └── DuBoisChat.jsx/css      # W.E.B. Du Bois chatbot panel
│   ├── pages/
│   │   ├── Landing.jsx/css         # Home page with hero and module preview
│   │   ├── Workshop.jsx/css        # Main workshop page with video player
│   │   └── Resources.jsx/css       # AI toolkit pricing tiers
│   ├── data/
│   │   ├── modules.js              # 4 workshop modules data
│   │   └── resources.js            # AI tools and pricing tiers
│   ├── App.jsx                     # Root router component
│   ├── main.jsx                    # App entry point with BrowserRouter
│   └── index.css                   # Global styles and theme variables
├── index.html                      # HTML shell with Google Fonts
└── package.json                    # Dependencies (React, React Router, Lucide)
```

## Visual Design System

### Color Palette
- **Backgrounds**:
  - Primary: `#0a0a14`
  - Surface: `#1a1a2e`
  - Surface Light: `#242440`
- **Accents**:
  - Gold: `#CFB53B` (primary accent)
  - Amber: `#E8A317` (hover states)
- **Text**:
  - Primary: `#f0f0f0`
  - Muted: `#a0a0b0`
- **Border**: `#2a2a44`

### Typography
- **Body**: Inter (from Google Fonts)
- **Display/Headings**: Playfair Display (from Google Fonts)
- All headings use Playfair Display in gold
- Clean, high-contrast, cinematic aesthetic

### Design Philosophy
Premium, cinematic, minimalist tech feel inspired by Trent Reznor/Atticus Ross movie title sequences. Dark mode only, with bold typography and intentional use of breathing room.

## Key Features

### 1. Landing Page (`/`)
- Hero section with "RAISE THE CROWN" title
- Howard Thurman quote
- Workshop description
- 4 module preview cards
- "Enter the Workshop" CTA button

### 2. Workshop Page (`/workshop/:moduleId`)
- Module selector sidebar (desktop) / dropdown (mobile)
- Video player with custom controls:
  - Play/pause
  - Seekable progress bar
  - Speed selector (0.5x, 1x, 1.25x, 1.5x, 2x)
  - Fullscreen toggle
  - Placeholder state when no video URL
- Module information display
- Previous/Next module navigation
- Du Bois chatbot toggle button (fixed bottom-right)

### 3. Resources Page (`/resources`)
- 4-tier AI toolkit pricing structure:
  - Free Tier ($0/month)
  - Student Essentials ($20-30/month) ⭐ Recommended
  - Power User ($50-75/month)
  - Full Stack ($100+/month)
- Student discount paths section
- Tool cards with categories and notes

### 4. Du Bois Chatbot
- Slide-out panel from right
- W.E.B. Du Bois AI persona
- Pre-loaded welcome message
- Chat interface with message history
- Placeholder responses (ready for AI API integration)
- Mobile responsive (full-width on mobile)

## Workshop Modules

### Module 1: The Setup (4-5 min)
Establishes the avatar, proves AI advancement, introduces the "distance" concept.

### Module 2: The Protocols (12-15 min)
Four academic protocols: rubric engineering, research synthesis, pre-class prep, exam systems.

### Module 3: Products in Practice (12-15 min)
Live demonstrations of AI tools in action.

### Module 4: The Horizon (5-6 min)
The future of agentic AI and Howard Thurman close.

## Development

### Running the App
```bash
# Development server
npm run dev
# Visit http://localhost:5173

# Production build
npm run build

# Preview production build
npm run preview
```

### Key Dependencies
- React 19.2.0
- React Router DOM 7.13.0
- Lucide React 0.564.0 (icons)
- Vite 7.3.1 (build tool)

## Implementation Notes

### Video Integration
- All modules currently have `videoUrl: null`
- VideoPlayer component displays placeholder with module info when no URL
- Ready to accept video URLs after HeyGen production
- Custom HTML5 video player with full control implementation

### Chatbot Integration
- UI shell is complete
- TODO comment marks API integration point in `DuBoisChat.jsx`
- Currently returns placeholder response
- Message state management in place
- Ready for OpenAI/Anthropic/etc. API connection

### Responsive Design
- Mobile-first approach
- Breakpoints:
  - Mobile: < 640px
  - Tablet: 640px - 1023px
  - Desktop: ≥ 1024px
- Module selector switches from sidebar to dropdown on mobile
- Chat panel goes full-width on mobile

### Navigation
- React Router handles all routing
- URL structure: `/`, `/workshop`, `/workshop/:moduleId`, `/resources`
- Default redirects to Module 1 if no moduleId specified
- Previous/Next navigation with proper bounds checking

## Build Output

The production build creates optimized static files in `dist/`:
- Total size: ~276 KB (26 KB CSS, 249 KB JS)
- Gzipped: ~85 KB total
- Ready for static hosting (Netlify, Vercel, etc.)

## Future Enhancements

1. **Video Integration**: Add HeyGen-produced video URLs to modules.js
2. **AI Chatbot**: Connect Du Bois persona to AI API (marked with TODO in code)
3. **Analytics**: Track module completion and engagement
4. **User Accounts**: Save progress and chat history
5. **Certificates**: Generate completion certificates

## Accessibility

- Semantic HTML structure
- Focus states on all interactive elements
- Keyboard navigation support
- ARIA labels where appropriate
- High contrast color scheme
- Scalable text using clamp()

## Browser Support

Modern browsers supporting:
- CSS Grid
- CSS Custom Properties
- ES6+ JavaScript
- Fullscreen API
- Video API

---

**Built for EdSolutions**
*"Hold the crown above their heads and dare them to grow into it." — Howard Thurman*
