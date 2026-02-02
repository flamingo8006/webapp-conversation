# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js conversational web app template that integrates with the Dify platform. It provides a chat interface with support for workflows, file uploads, streaming responses, and multi-language support.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run fix      # Auto-fix ESLint issues
```

## Environment Setup

Create `.env.local` with:
```
NEXT_PUBLIC_APP_ID=      # Dify app ID from URL
NEXT_PUBLIC_APP_KEY=     # API key from app's "API Access" page
NEXT_PUBLIC_API_URL=     # API base URL (e.g., https://api.dify.ai/v1)
```

Additional configuration in `config/index.ts` (title, default language, etc.).

## Architecture

### Key Entry Points
- `app/layout.tsx` - Root layout with i18n locale resolution
- `app/page.tsx` - Renders main chat component
- `app/components/index.tsx` - Main component with conversation management, chat flow, file upload logic
- `service/base.ts` - HTTP utilities (get/post/put/del) and SSE streaming
- `service/index.ts` - Domain functions (sendChatMessage, fetchConversations, etc.)
- `hooks/use-conversation.ts` - Conversation state management

### API Communication
- Use domain functions in `service/index.ts` for features
- HTTP helpers in `service/base.ts` auto-handle JSON serialization, timeouts, and error toasts
- For streaming responses, use `ssePost` with callbacks: `onData`, `onCompleted`, `onThought`, `onFile`, `onMessageEnd`, `onWorkflowStarted`, `onNodeStarted`, `onNodeFinished`, `onWorkflowFinished`, `onError`

### Component Organization
- `app/components/base/` - UI primitives (button, toast, icons, uploader)
- `app/components/chat/` - Chat UI (questions, answers, thinking indicators)
- `app/components/workflow/` - Workflow visualization
- Use `app/components/base/toast` for notifications

### i18n
- Server: `getLocaleOnServer()` in `i18n/server.ts` (cookie or header negotiation)
- Client: `getLocaleOnClient()` / `setLocaleOnClient()` in `i18n/client.ts`
- Translations in `i18n/lang/**` - keep keys synchronized across locales
- Supported: en, es, zh-Hans, ja, fr

## Code Conventions

- **TypeScript**: Strict mode enabled. Avoid `any`. Use explicit function signatures for exports.
- **Imports**: Use `@/*` alias for absolute imports (configured in tsconfig)
- **React**: Function components. Server components by default; mark client components with `'use client'`
- **Styling**: Tailwind-first; SCSS modules only where necessary
- **Control flow**: Early returns, handle edge cases first, avoid deep nesting
- **Route handlers**: Place in `app/api/**/route.ts`
- **ESLint**: Uses `@antfu/eslint-config` - single quotes, 2-space indent, no semicolons

## Tailwind Breakpoints

```
mobile: 100px
tablet: 640px
pc: 769px
```

## Docker

```bash
docker build . -t <DOCKER_HUB_REPO>/webapp-conversation:latest
docker run -p 3000:3000 <DOCKER_HUB_REPO>/webapp-conversation:latest
```
