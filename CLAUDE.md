# Real-Time Chat Application — Project Plan

## Overview
A full-stack real-time chat application built with Next.js (App Router) + Tailwind CSS. WebSocket messaging runs via Socket.io on a custom Express server alongside Next.js. Users can create accounts, join chat rooms, initiate private conversations, and exchange messages in real-time.

---

## Tech Stack (All Free Tiers)

| Layer | Technology | Why / Free Tier |
|---|---|---|
| Framework | Next.js 16 (App Router) | Frontend + API routes in one project |
| Styling | Tailwind CSS v4 | Ships with Next.js 16 — CSS-based config, no tailwind.config.js |
| Custom Server | Express + Socket.io | Needed for persistent WebSocket on Next.js |
| Database | MongoDB Atlas | Free 512MB cluster |
| ODM | Mongoose | Schema + validation |
| Auth | NextAuth.js v5 (beta) | Free, built for Next.js, supports JWT — see note below |
| File Storage | Cloudinary | Free 25GB / 25k transforms |
| Hosting | Render.com | Full Node.js server (free 750 hrs/mo) — see spin-down note |
| State | Zustand | Lightweight client state |
| Validation | Zod | Runtime schema validation, replaces express-validator |

> **Why Render over Vercel?** Vercel runs serverless functions — persistent Socket.io connections are not supported there. Render runs a real Node.js process, so Socket.io works perfectly.

> **Render free tier spin-down warning:** Free web services on Render spin down after 15 minutes of inactivity and take ~60 seconds to restart. All Socket.io connections drop during sleep. Fix: use [UptimeRobot](https://uptimerobot.com) (free) to ping `https://your-app.onrender.com/api/health` every 5 minutes, keeping the instance alive. Add this task to Phase 7.

> **NextAuth v5 beta note:** NextAuth v5 has never had a stable release and remains in beta (widely used in production but API details may change). Pin the exact version: `"next-auth": "5.0.0-beta.25"`. The `next-auth/middleware` import changed in v5 — use the `auth` export from `lib/auth.js` as middleware instead.

> **Critical — Edge Runtime / MongoDB trap:** Next.js middleware runs on Edge Runtime, which has no Node.js `stream` module. The MongoDB driver (and therefore `@auth/mongodb-adapter`) requires `stream` and will fail to bundle in middleware with errors like `Can't resolve 'kerberos'` or `Dynamic Code Evaluation not allowed`. Fix: split auth config into two files — `lib/auth.config.js` (no adapter, no DB imports — edge-safe, imported by middleware) and `lib/auth.js` (full config with adapter — imported only in API routes and server components). Middleware must only import from `auth.config.js`, never from `auth.js`.

> **Next.js 16 proxy — CONFIRMED:** Next.js 16 deprecated `middleware.js` in favour of `proxy.js`, and also renamed the exported function from `middleware` to `proxy`. Export as `export { auth as proxy }`. Both confirmed during actual build on Next.js 16.2.6.

> **Tailwind CSS v4 config change:** Tailwind v4 (ships with Next.js 16 via `create-next-app`) uses a CSS-based config — no `tailwind.config.js`, no `postcss.config.js`, no `autoprefixer`. Configuration lives in `app/globals.css` using `@import "tailwindcss"` and `@theme` blocks. Do not follow v3 setup guides.

> **File upload — multer not compatible with Next.js Route Handlers:** Multer is Express middleware and requires Express `req`/`res`. Next.js Route Handlers use the Web API `Request` object — multer will not run. For `app/api/upload/route.js`: use `await request.formData()` to extract the file, convert to a buffer, then upload via `cloudinary.uploader.upload_stream()`. No multer needed in Route Handlers.

---

## Project Structure

```
chat-app/
├── CLAUDE.md
├── server.js                          # Custom Express + Socket.io server (entry point)
├── proxy.js                           # Auth route protection (Next.js 16: proxy.js replaces middleware.js)
├── next.config.mjs
├── .env.local
├── .env.example
├── .gitignore
├── package.json
│
├── app/                               # Next.js App Router
│   ├── layout.jsx                     # Root layout (fonts, providers)
│   ├── page.jsx                       # Redirect to /chat or /login
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.jsx
│   │   └── register/
│   │       └── page.jsx
│   ├── chat/
│   │   ├── layout.jsx                 # Chat shell (sidebar + main area)
│   │   ├── page.jsx                   # Default: pick a room
│   │   ├── room/
│   │   │   └── [roomId]/
│   │   │       └── page.jsx           # Group chat room
│   │   └── dm/
│   │       └── [conversationId]/
│   │           └── page.jsx           # Private DM
│   └── api/                           # Next.js Route Handlers
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.js           # NextAuth handler
│       ├── users/
│       │   ├── route.js               # POST /api/users (register)
│       │   └── [id]/
│       │       └── route.js           # GET/PUT user profile
│       ├── rooms/
│       │   ├── route.js               # GET list / POST create
│       │   └── [id]/
│       │       ├── route.js           # GET details
│       │       ├── join/route.js
│       │       └── leave/route.js
│       ├── conversations/
│       │   └── route.js               # GET list / POST start DM
│       ├── messages/
│       │   ├── room/
│       │   │   └── [roomId]/route.js  # GET paginated history
│       │   └── conversation/
│       │       └── [convId]/route.js
│       └── upload/
│           └── route.js               # POST → Cloudinary
│
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   └── RegisterForm.jsx
│   ├── chat/
│   │   ├── ChatWindow.jsx
│   │   ├── MessageBubble.jsx
│   │   ├── MessageInput.jsx
│   │   ├── TypingIndicator.jsx
│   │   └── FileUpload.jsx
│   ├── sidebar/
│   │   ├── Sidebar.jsx
│   │   ├── RoomList.jsx
│   │   ├── UserList.jsx
│   │   ├── PresenceDot.jsx
│   │   └── CreateRoomModal.jsx
│   └── shared/
│       ├── Avatar.jsx
│       ├── Modal.jsx
│       └── EmojiPicker.jsx
│
├── context/
│   └── SocketContext.jsx              # Socket.io client provider
│
├── hooks/
│   ├── useSocket.js
│   ├── useMessages.js
│   └── usePresence.js
│
├── lib/
│   ├── db.js                          # MongoDB Atlas connection (singleton)
│   ├── cloudinary.js                  # Cloudinary SDK config
│   ├── auth.config.js                 # NextAuth config WITHOUT adapter (edge-safe, used by middleware)
│   ├── auth.js                        # NextAuth config WITH @auth/mongodb-adapter (Node.js only)
│   └── socket.js                      # Socket.io server singleton
│
├── models/
│   ├── User.js
│   ├── Room.js
│   ├── Conversation.js
│   └── Message.js
│
├── socket/
│   ├── index.js                       # Register all socket namespaces
│   ├── chatEvents.js                  # send/receive message handlers
│   ├── presenceEvents.js              # online/offline/typing handlers
│   └── notificationEvents.js
│
└── utils/
    ├── formatTime.js
    ├── sanitize.js
    └── constants.js
```

---

## How the Custom Server Works

`server.js` is the entry point instead of `next start`:

```
node server.js
  ├── Creates Express app
  ├── Attaches Socket.io to the HTTP server
  ├── Passes all other requests to Next.js request handler
  └── Listens on PORT (default 3000)
```

Next.js API routes handle REST. Socket.io (attached to the same port) handles real-time events.

---

## Database Models

### User
```
_id, name, email, password (hashed), image (Cloudinary URL),
status (online | offline | away), lastSeen, createdAt
```

### Room (Group Chat)
```
_id, name, description, image, members [userId], admin userId,
isPrivate (bool), createdAt
```

### Conversation (Private DM)
```
_id, participants [userId, userId], lastMessage (ref), updatedAt
```

### Message
```
_id, sender (userId ref), room (ref) | conversation (ref),
content (text), type (text | image | file),
fileUrl, fileName, readBy [userId], createdAt
```

---

## Socket.io Events

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `join_room` | `{ roomId }` | Subscribe to room events |
| `leave_room` | `{ roomId }` | Unsubscribe from room |
| `send_message` | `{ targetId, targetType, content, type }` | Send text or file message |
| `typing_start` | `{ targetId }` | User started typing |
| `typing_stop` | `{ targetId }` | User stopped typing |
| `mark_read` | `{ messageId }` | Mark message as read |

### Server → Client
| Event | Payload | Description |
|---|---|---|
| `receive_message` | `{ message }` | New message broadcast |
| `user_typing` | `{ userId, name }` | Typing indicator |
| `user_stop_typing` | `{ userId }` | Stop typing |
| `user_online` | `{ userId }` | Presence: came online |
| `user_offline` | `{ userId, lastSeen }` | Presence: went offline |
| `message_read` | `{ messageId, userId }` | Read receipt |
| `notification` | `{ type, title, body }` | In-app notification |

---

## REST API Endpoints (Next.js Route Handlers)

### Users / Auth
- `POST /api/users` — register new account
- `GET/POST /api/auth/[...nextauth]` — NextAuth login/session
- `GET  /api/users/:id` — get user profile
- `PUT  /api/users/:id` — update name / avatar

### Rooms
- `GET  /api/rooms` — list public rooms
- `POST /api/rooms` — create room
- `GET  /api/rooms/:id` — room detail + members
- `POST /api/rooms/:id/join` — join room
- `POST /api/rooms/:id/leave` — leave room

### Messages (Chat History)
- `GET  /api/messages/room/:roomId?page=1&limit=30` — paginated history
- `GET  /api/messages/conversation/:convId?page=1&limit=30` — DM history

### Conversations (Private DMs)
- `GET  /api/conversations` — list my DMs
- `POST /api/conversations` — start DM `{ recipientId }`

### Upload
- `POST /api/upload` — multipart → Cloudinary, returns `{ url, publicId }`

---

## Implementation Phases

### Phase 1 — Project Setup
- [ ] `npx create-next-app@latest` with Tailwind CSS, App Router, ESLint (scaffolds Tailwind v4 automatically)
- [ ] Install all additional dependencies (see Key Dependencies)
- [ ] Create custom `server.js` with Express + Socket.io + Next.js handler
- [ ] Connect MongoDB Atlas in `lib/db.js` (singleton pattern)
- [ ] Configure `.env.local` — use `AUTH_SECRET` / `AUTH_URL` (not NEXTAUTH_ prefixes)
- [ ] Add `GET /api/health` route (needed for UptimeRobot in production)

### Phase 2 — Auth
- [ ] User model (Mongoose) with bcrypt password hashing
- [ ] `POST /api/users` register route
- [ ] `lib/auth.config.js` — NextAuth Credentials provider config, no DB imports (edge-safe)
- [ ] `lib/auth.js` — extends auth.config, adds `@auth/mongodb-adapter` (Node.js only)
- [ ] `proxy.js` — imports `auth` from `lib/auth.config.js` only, never from `lib/auth.js`
- [ ] Login / Register pages with Tailwind forms

### Phase 3 — Core Messaging (Backend)
- [ ] Room + Message + Conversation models
- [ ] Room CRUD API routes
- [ ] Socket.io chat events: `send_message` → save to DB → broadcast `receive_message`
- [ ] Paginated message history route

### Phase 4 — Frontend Chat UI
- [ ] Chat layout: sidebar + main window (Tailwind grid)
- [ ] `SocketContext` — connect after session, auto-reconnect
- [ ] Room list in sidebar, click to navigate
- [ ] `ChatWindow` — load history + stream new messages
- [ ] `MessageInput` — text + send button
- [ ] `MessageBubble` — sent vs received styling

### Phase 5 — Private DMs + Presence
- [ ] Start DM from user list
- [ ] DM conversation page
- [ ] `presenceEvents.js` — emit `user_online/offline` on socket connect/disconnect
- [ ] `PresenceDot` component (green/grey)
- [ ] Typing indicator (debounced 500ms)

### Phase 6 — Optional Features
- [ ] Read receipts (double tick)
- [ ] File/image upload → Cloudinary → display inline
- [ ] Emoji picker (emoji-mart v5 — headless API, requires manual positioning and custom trigger button; does NOT render a pre-built button like v4)
- [ ] Browser Notification API (no extra service)
- [ ] Create room modal
- [ ] Dark mode (Tailwind `dark:` classes)

### Phase 7 — Deploy
- [ ] Push to GitHub
- [ ] Deploy to **Render.com** as Node.js web service (`node server.js`)
- [ ] Set all environment variables in Render dashboard
- [ ] Add `GET /api/health` route returning `200 OK` (for uptime ping)
- [ ] Set up **UptimeRobot** (free) to ping `/api/health` every 5 minutes — prevents Render free tier spin-down and Socket.io disconnections
- [ ] Verify WebSocket connections work in production

---

## Environment Variables (.env.local)

```
# NextAuth v5 (note: v5 uses AUTH_SECRET / AUTH_URL, NOT NEXTAUTH_SECRET / NEXTAUTH_URL)
AUTH_SECRET=generate_with_openssl_rand_base64_32
AUTH_URL=http://localhost:3000

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/chatapp

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=

# Socket (public so client can connect)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

---

## Key Dependencies

```json
{
  "dependencies": {
    "next": "^16",
    "react": "^19",
    "react-dom": "^19",
    "tailwindcss": "^4",
    "express": "^4.18",
    "socket.io": "^4.7",
    "socket.io-client": "^4.7",
    "mongoose": "^8",
    "mongodb": "^6",
    "next-auth": "5.0.0-beta.25",
    "@auth/mongodb-adapter": "^3",
    "bcryptjs": "^2.4",
    "zod": "^3",
    "cloudinary": "^2",
    "zustand": "^4",
    "axios": "^1.6",
    "date-fns": "^3",
    "react-hot-toast": "^2",
    "express-rate-limit": "^7",
    "emoji-mart": "^5"
  },
  "devDependencies": {
    "nodemon": "^3",
    "eslint": "^8",
    "eslint-config-next": "^16"
  }
}
```

---

## Free Service Setup Checklist

- [ ] **MongoDB Atlas** — free M0 cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
- [ ] **Cloudinary** — sign up at [cloudinary.com](https://cloudinary.com) (25GB free)
- [ ] **Render.com** — connect GitHub for auto-deploy as Node.js service
- [ ] **GitHub** — host source code (private repo free)

---

## Security Notes
- Passwords hashed with bcrypt (rounds: 12)
- Sessions managed by NextAuth (secure httpOnly cookies)
- API routes protected with `auth()` check (NextAuth v5 pattern, not the v4 `getServerSession`)
- Input validated with Zod schemas on all API routes
- CORS restricted to app origin in Socket.io options
- Rate limiting on auth routes (express-rate-limit)
- File uploads: whitelist MIME types, 5MB max size

---

## Dev Commands

```bash
# Install deps
npm install

# Run dev (custom server with hot reload via nodemon)
npm run dev

# Production start
npm run build
node server.js
```

### package.json scripts
```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "build": "next build",
    "start": "node server.js"
  }
}
```
