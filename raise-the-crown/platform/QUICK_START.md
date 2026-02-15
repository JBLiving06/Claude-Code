# Raise the Crown - Quick Start Guide

## Getting Started

The platform is ready to run! Follow these steps:

### 1. Start the Development Server

```bash
cd /home/user/Claude-Code/raise-the-crown/platform
npm run dev
```

Visit **http://localhost:5173** in your browser.

### 2. Navigate the Platform

- **Landing Page**: Root URL displays the hero section and module previews
- **Workshop**: Click "Enter the Workshop" or navigate to `/workshop`
- **Resources**: Click "Resources" in the nav bar or visit `/resources`

### 3. Test Key Features

#### Workshop Navigation
- Module selector sidebar (desktop) or dropdown (mobile)
- Click any module to load it
- Use Previous/Next buttons to navigate sequentially
- Module 1 loads by default

#### Video Player
- Since no videos are uploaded yet, you'll see placeholder screens
- Each placeholder shows:
  - Module title and description
  - Topics covered
  - Note about HeyGen production

#### Du Bois Chatbot
- Click "Office Hours with Brother Du Bois" button (bottom-right)
- Chat panel slides in from the right
- Type a message and press Enter or click Send
- Chatbot returns placeholder response (AI integration ready)
- Click X or overlay to close

### 4. Production Build

```bash
npm run build
```

Creates optimized static files in `dist/` directory:
- Total size: ~276 KB
- Gzipped: ~85 KB
- Ready for deployment to Netlify, Vercel, or any static host

## File Locations

### Add Video URLs
Edit `/home/user/Claude-Code/raise-the-crown/platform/src/data/modules.js`

Replace `videoUrl: null` with actual URLs:
```javascript
{
  id: 1,
  title: 'The Setup',
  videoUrl: 'https://your-video-url.mp4', // Add URL here
  // ... rest of module data
}
```

### Connect AI Chatbot
Edit `/home/user/Claude-Code/raise-the-crown/platform/src/components/DuBoisChat.jsx`

Find the TODO comment around line 35:
```javascript
// TODO: API integration point
// Replace the setTimeout block with your AI API call
```

Example integration:
```javascript
const response = await fetch('YOUR_AI_API_ENDPOINT', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: inputValue }),
})
const data = await response.json()
const duboisResponse = {
  id: messages.length + 2,
  sender: 'dubois',
  text: data.response,
}
setMessages((prev) => [...prev, duboisResponse])
```

### Update Resource Toolkit
Edit `/home/user/Claude-Code/raise-the-crown/platform/src/data/resources.js`

Add/remove tools or update pricing in the `tiers` array.

## Visual Design

### Colors (CSS Variables in index.css)
- `--bg-primary: #0a0a14` - Main background
- `--bg-surface: #1a1a2e` - Card backgrounds
- `--accent-gold: #CFB53B` - Primary accent (buttons, headings)
- `--accent-amber: #E8A317` - Hover states
- `--text-primary: #f0f0f0` - Main text
- `--text-muted: #a0a0b0` - Secondary text

### Fonts
Loaded via Google Fonts in `index.html`:
- **Inter**: Body text (400-900 weights)
- **Playfair Display**: Headings (700-900 weights)

## Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1023px
- **Desktop**: ≥ 1024px

Module selector switches to dropdown on mobile.
Chat panel goes full-width on mobile.

## Routes

- `/` - Landing page
- `/workshop` - Redirects to `/workshop/1`
- `/workshop/1` - Module 1 (The Setup)
- `/workshop/2` - Module 2 (The Protocols)
- `/workshop/3` - Module 3 (Products in Practice)
- `/workshop/4` - Module 4 (The Horizon)
- `/resources` - AI Toolkit pricing tiers

## Tech Stack

- **React** 19.2.0
- **React Router DOM** 7.13.0
- **Vite** 7.3.1
- **Lucide React** 0.564.0 (icons)

## Total Code

- **2,192 lines** of custom code
- **18 files** created/modified
- **3 main pages** (Landing, Workshop, Resources)
- **3 components** (Layout, VideoPlayer, DuBoisChat)
- **2 data files** (modules, resources)

## Next Steps

1. **Add Videos**: Upload to hosting (Vimeo, YouTube, S3) and add URLs to `modules.js`
2. **Connect AI**: Integrate OpenAI, Anthropic, or custom API in `DuBoisChat.jsx`
3. **Deploy**: Build and deploy to your hosting platform
4. **Customize**: Update module content, resources, or styling as needed

## Support

All components are fully documented with comments. The codebase follows React best practices and is structured for easy maintenance and updates.

---

**Ready to raise the crown!** 👑
