# Avatar-Led Interactive Workshop System

A full-stack TypeScript application for creating and delivering AI avatar-led educational workshops with interactive Q&A capabilities.

## Overview

This system enables educators to create self-paced video workshops presented by AI avatars, with real-time question-and-answer functionality powered by RAG (Retrieval-Augmented Generation).

### Key Features

- **AI Avatar Presentations**: Generate video content using D-ID or HeyGen avatars
- **Interactive Q&A**: Students can ask questions anytime and receive spoken answers from the avatar
- **Knowledge Base Management**: Upload documents to create grounded, accurate Q&A responses
- **Self-Paced Learning**: Pause, rewind, and adjust playback speed
- **Progress Tracking**: Monitor student progress and engagement
- **Workshop Analytics**: Track common questions and completion rates

## Architecture

```
packages/
├── shared/      # TypeScript types and utilities
├── server/      # Express.js backend with WebSocket support
└── client/      # React frontend with Tailwind CSS
```

### Tech Stack

- **Backend**: Node.js, Express, WebSocket
- **Frontend**: React, Vite, Tailwind CSS, Zustand
- **AI/ML**: OpenAI (embeddings, chat), D-ID/HeyGen (avatars)
- **Vector DB**: Pinecone (knowledge base storage)
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- API keys for at least one avatar provider (D-ID or HeyGen)
- OpenAI API key (for embeddings and chat)
- Pinecone account (free tier works)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/avatar-workshop-system.git
cd avatar-workshop-system
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. Start development servers:
```bash
npm run dev
```

The client will be available at `http://localhost:3000` and the API at `http://localhost:3001`.

## Configuration

### Avatar Providers

#### D-ID (Recommended for Q&A)
- Plans start at $5.90/month
- Advanced plan ($108/month) includes AI Agents for interactive Q&A
- Excellent lip-sync and natural expressions
- [Get API Key](https://www.d-id.com/)

#### HeyGen
- Creator plan at $29/month with unlimited video
- LiveAvatar Pro at $99/month for interactive sessions
- 500+ stock avatars, voice cloning available
- [Get API Key](https://www.heygen.com/)

### Knowledge Base Setup

1. Create a knowledge base via the admin dashboard
2. Upload documents (PDF, TXT, PPTX)
3. Documents are automatically chunked and indexed
4. Configure response style (conversational, academic, concise)

## API Endpoints

### Workshops
- `GET /api/workshops` - List all workshops
- `POST /api/workshops` - Create a new workshop
- `GET /api/workshops/:id` - Get workshop details
- `POST /api/workshops/:id/segments` - Add a segment
- `POST /api/workshops/:id/generate-all` - Generate all videos
- `POST /api/workshops/:id/publish` - Publish workshop

### Sessions
- `POST /api/sessions` - Start a new session
- `POST /api/sessions/:id/questions` - Ask a question
- `PATCH /api/sessions/:id/progress` - Update progress

### Knowledge Bases
- `POST /api/knowledge-bases` - Create knowledge base
- `POST /api/knowledge-bases/:id/documents` - Add document
- `POST /api/knowledge-bases/:id/query` - Query (RAG search)
- `POST /api/knowledge-bases/:id/answer` - Generate answer

## WebSocket Events

Connect to `/ws?sessionId=<session_id>` for real-time features:

### Client → Server
- `question` - Ask a question
- `progress_update` - Update video position
- `start_avatar_session` - Begin interactive avatar session

### Server → Client
- `answer_start` - Processing question
- `answer_complete` - Answer ready
- `avatar_speaking` - Avatar is responding
- `error` - Error occurred

## Workflow

### Creating a Workshop

1. **Content Planning**: Outline your workshop into 10-15 minute segments
2. **Script Writing**: Write conversational scripts for each segment
3. **Knowledge Base**: Upload source documents for Q&A grounding
4. **Avatar Selection**: Choose or create your presenter avatar
5. **Video Generation**: Generate videos for each segment
6. **Testing**: Review videos and test Q&A responses
7. **Publishing**: Make the workshop available to students

### Student Experience

1. Browse available workshops
2. Start a session (creates unique participant ID)
3. Watch avatar-presented video content
4. Pause anytime to ask questions
5. Receive spoken answers from the avatar
6. Track progress through segments
7. Review question history

## Cost Estimates

For a 90-minute workshop:

| Component | Option | Monthly Cost |
|-----------|--------|--------------|
| Avatar Video | D-ID Advanced | $108 |
| Avatar Video | HeyGen Creator | $29 |
| Interactive Q&A | D-ID Agents | (included in Advanced) |
| Interactive Q&A | HeyGen LiveAvatar | $99 |
| LLM (OpenAI) | GPT-4 Turbo | ~$20-50 |
| Vector DB | Pinecone Free | $0 |

**Recommended Budget**: $150-200/month for full functionality

## Development

### Project Structure

```
packages/server/src/
├── config/         # Environment configuration
├── middleware/     # Express middleware
├── routes/         # API route handlers
├── services/       # Business logic
│   ├── avatar/     # D-ID and HeyGen integrations
│   ├── knowledge-base.service.ts
│   └── workshop.service.ts
├── utils/          # Helpers
└── websocket/      # Real-time communication

packages/client/src/
├── components/     # React components
├── hooks/          # Custom hooks
├── pages/          # Page components
└── store/          # Zustand state management
```

### Building for Production

```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details.
