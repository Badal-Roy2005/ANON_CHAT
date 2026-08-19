# PROMPT.md — Block-by-Block Prompts for Anon_Chat Build

This file contains step-by-step, block-by-block prompts designed to build the complete **Anon_Chat** hyperlocal anonymous chat platform from scratch without errors.

Execute these prompts sequentially in order. Do not skip blocks.

---

## Overview of Development Blocks

- **Block 1**: Project Setup & Infrastructure Scaffolding
- **Block 2**: Backend Utilities, Redis Client & Security/Profanity Engine
- **Block 3**: Socket.io Real-Time Server & Geohash Room Controller
- **Block 4**: Frontend Design System, Typography & Utilitarian UI Components
- **Block 5**: Client Custom Hooks (`useGeolocation`, `useSessionIdentity`, `useSocket`)
- **Block 6**: Core Web App Views (Landing Screen, Live Chat & Disconnect Flow)
- **Block 7**: Server Keep-Alive Ping (`/health`), Production CORS & E2E Sanity Testing

---

## Block 1: Project Setup & Infrastructure Scaffolding

### Objective
Initialize both the Next.js 14+ App Router frontend and the standalone Express + Socket.io backend server directory structure with all required free-tier configurations, packages, and environment variable templates.

### Files to Create / Modify
- `package.json` (Root / Monorepo or dual folder structure `frontend/` and `backend/`)
- `frontend/package.json`
- `frontend/.env.example`
- `backend/package.json`
- `backend/.env.example`
- `backend/server.js`

### Copy-Paste AI Prompt for Block 1

```text
PROMPT FOR BLOCK 1:
Initialize the repository for "Anon_Chat" with a clean dual-folder structure: `frontend` (Next.js 14+ App Router with TailwindCSS) and `backend` (Node.js Express + Socket.io server).

1. In `frontend`:
   - Initialize Next.js 14 App Router project with TypeScript and TailwindCSS.
   - Install dependencies: `socket.io-client`, `ngeohash`, `lucide-react`, `clsx`, `tailwind-merge`.
   - Create `.env.example` with variable:
     `NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:4000`

2. In `backend`:
   - Initialize standard Node.js project (`npm init -y`) with `"type": "module"`.
   - Install production dependencies: `express`, `socket.io`, `@upstash/redis`, `@upstash/ratelimit`, `ngeohash`, `bad-words`, `dotenv`, `cors`, `helmet`.
   - Install dev dependency: `nodemon`.
   - Create `.env.example` with variables:
     `PORT=4000`
     `UPSTASH_REDIS_REST_URL=https://your-upstash-url.upstash.io`
     `UPSTASH_REDIS_REST_TOKEN=your-upstash-token`
     `IP_HASH_SALT=your-random-secret-salt-key`
     `CLIENT_ORIGIN=http://localhost:3000`
   - Create entry point `backend/server.js` with express setup, CORS middleware using `CLIENT_ORIGIN`, `helmet()` security headers, and a basic `/health` GET endpoint returning `{"status": "ok", "timestamp": "..."}`.

3. Ensure no build errors occur and scripts for `npm run dev` are configured in both package.json files.
```

### Verification Criteria
- `frontend` and `backend` dependencies install cleanly.
- Backend server starts on port 4000 and responds with 200 OK on `http://localhost:4000/health`.

---

## Block 2: Backend Utilities, Redis Client & Security Engine

### Objective
Create core server utilities: Upstash Redis connection client, salted SHA-256 IP hashing helper, profanity/spam text sanitizer, and `@upstash/ratelimit` rate-limiting helper.

### Files to Create / Modify
- `backend/src/config/redis.js`
- `backend/src/utils/security.js`
- `backend/src/utils/geohash.js`
- `backend/src/utils/moderation.js`
- `backend/src/middleware/rateLimiter.js`

### Copy-Paste AI Prompt for Block 2

```text
PROMPT FOR BLOCK 2:
Implement the core backend security, Redis client, geohashing, and moderation utilities in `backend/src/`.

1. `backend/src/config/redis.js`:
   - Initialize and export Upstash Redis client using `@upstash/redis` `Redis.fromEnv()`. Include fallback in-memory mock store if env vars are missing for local offline dev testing.

2. `backend/src/utils/security.js`:
   - Export function `hashIP(ip)`: returns SHA-256 hash using `crypto.createHash('sha256')` with `ip + process.env.IP_HASH_SALT`. Never log raw IP addresses.

3. `backend/src/utils/geohash.js`:
   - Export `getGeohashCell(lat, lng, precision = 6)`: encodes lat/lng using `ngeohash.encode`. Default precision 6 (~600m cell).
   - Export `getNeighborCells(geohash)`: returns array containing primary geohash + 8 surrounding neighbor cells using `ngeohash.neighbors(geohash)`.

4. `backend/src/utils/moderation.js`:
   - Export `sanitizeMessage(rawText)`:
     a) Trim whitespace, enforce max length of 280 characters.
     b) Filter profanity/spam using `bad-words` or custom regex fallback.
     c) Escape HTML tags to protect against XSS.
     d) Return sanitized clean text string or throw error if invalid/empty.

5. `backend/src/middleware/rateLimiter.js`:
   - Configure `@upstash/ratelimit` sliding window: 5 requests per 10 seconds per session ID, and 30 requests per minute per hashed IP.
   - Export function `checkRateLimit(sessionId, hashedIp)` returning boolean `{ allowed: boolean, remaining: number }`.
```

### Verification Criteria
- `hashIP()` consistently generates 64-char hex string from sample IP.
- `sanitizeMessage()` strips profanity, limits string length to 280 chars, and sanitizes HTML.
- Geohash functions correctly calculate geohash-6 and 8 neighbors.

---

## Block 3: Socket.io Real-Time Server & Geohash Room Controller

### Objective
Build the real-time Socket.io server connection handlers to manage joining geohash rooms (primary + neighbors), active user counts, broadcasting sanitized messages, and managing short TTL message buffers in Redis.

### Files to Create / Modify
- `backend/src/controllers/roomController.js`
- `backend/src/sockets/chatHandler.js`
- `backend/server.js`

### Copy-Paste AI Prompt for Block 3

```text
PROMPT FOR BLOCK 3:
Build the Socket.io real-time chat handler and geohash room management logic in `backend/src/sockets/chatHandler.js` and `backend/src/controllers/roomController.js`.

1. `backend/src/controllers/roomController.js`:
   - Implement `addSocketToRoom(geohash, socketId)` and `removeSocketFromRoom(geohash, socketId)` using Redis SETs with 1-hour TTL.
   - Implement `getRoomUserCount(geohash)`: retrieves count of unique active sockets in primary cell.
   - Implement `storeMessageInBuffer(geohash, messageObject)`: pushes message to Redis List `room:msg:<geohash>`, caps list at 50 messages, and sets key TTL to 3600 seconds (1 hour).
   - Implement `getRecentMessages(geohash)`: returns recent messages for room room:msg:<geohash>.

2. `backend/src/sockets/chatHandler.js`:
   - Listen for Socket.io events:
     - `join_room`: Payload `{ geohash, sessionId, displayName }`.
       - Compute primary geohash + 8 neighbor geohashes.
       - Join socket to socket rooms for all 9 geohashes.
       - Store membership in Redis.
       - Fetch recent messages for primary geohash and emit `room_history` to socket.
       - Emit `user_count_update` with active user count to primary room.
     - `send_message`: Payload `{ geohash, sessionId, displayName, text }`.
       - Check rate limit via `checkRateLimit(sessionId, hashedIp)`. If blocked, emit `rate_limit_exceeded` event to sender socket.
       - Sanitize message text using `sanitizeMessage(text)`.
       - Construct message object: `{ id: randomUUID(), text, displayName, timestamp: Date.now(), geohash }`.
       - Store in Redis message buffer.
       - Broadcast `new_message` event to primary geohash room.
     - `disconnect`:
       - Remove socket membership from Redis rooms.
       - Emit updated user count to affected rooms.

3. Update `backend/server.js` to attach Socket.io instance to Express HTTP server and wire up `chatHandler`.
```

### Verification Criteria
- Socket client connects, successfully joins primary geohash room + 8 neighbors.
- Sending message broadcasts `new_message` to clients in the same geohash room.
- Exceeding rate limit emits `rate_limit_exceeded` without crashing server.

---

## Block 4: Frontend Design System, Typography & Utilitarian UI Components

### Objective
Set up the frontend visual design system adhering strictly to `design.md`: near-monochrome aesthetic (off-black `#0A0A0C`, off-white `#F4F4F6`, signal orange accent `#FF5500` or radio green `#00FF66`), terminal/departure board feel, monospace metadata tags, and flat row layouts.

### Files to Create / Modify
- `frontend/tailwind.config.js`
- `frontend/app/globals.css`
- `frontend/app/layout.tsx`
- `frontend/components/ui/Header.tsx`
- `frontend/components/ui/Badge.tsx`
- `frontend/components/ui/PulseIndicator.tsx`
- `frontend/components/ui/MessageRow.tsx`
- `frontend/components/ui/ChatInput.tsx`

### Copy-Paste AI Prompt for Block 4

```text
PROMPT FOR BLOCK 4:
Configure the frontend styling and implement utilitarian UI components following `design.md`.

1. `frontend/tailwind.config.js` & `frontend/app/globals.css`:
   - Extend Tailwind colors:
     - `bg-dark`: `#0D0E11`
     - `card-dark`: `#16181D`
     - `border-dark`: `#262931`
     - `signal-orange`: `#FF5500`
     - `radio-green`: `#00FF66`
     - `text-main`: `#E6E8EE`
     - `text-muted`: `#8A8F9E`
   - Import Google Fonts `Space Grotesk` (UI chrome) and `JetBrains Mono` / `IBM Plex Mono` (metadata & messages).
   - Configure global reset: off-black background, crisp contrast, no glossy gradients, no default rounded shadcn look.

2. Create UI Components:
   - `frontend/components/ui/Header.tsx`: Departure-board style header with signal-orange accent, live user count, current geohash cell ID display, and exit session button.
   - `frontend/components/ui/Badge.tsx`: Monospace badge for user handle chips (e.g. `[FALCON-42]`) with discrete color accents.
   - `frontend/components/ui/PulseIndicator.tsx`: Subtle pulsing dot (radio-green for connected, signal-orange for reconnecting, red for offline).
   - `frontend/components/ui/MessageRow.tsx`: Flat terminal-style feed item. Monospace metadata `[HH:MM:SS] [FALCON-42]`, followed by sanitized message body text. Flat subtle divider line, no rounded chat bubbles.
   - `frontend/components/ui/ChatInput.tsx`: Fixed bottom bar composer with single line text input, char count indicator (`24/280`), touch-friendly send button (min 44x44px target).
```

### Verification Criteria
- Typography renders correctly with Space Grotesk UI and Monospace metadata.
- Components use design tokens without arbitrary ad-hoc hex values.
- Buttons meet touch target minimum size (44x44px).

---

## Block 5: Client Custom Hooks (`useGeolocation`, `useSessionIdentity`, `useSocket`)

### Objective
Create modular client hooks to manage state: location acquisition & geohashing, anonymous session identity generation in `sessionStorage`, and Socket.io client connection lifecycle.

### Files to Create / Modify
- `frontend/hooks/useSessionIdentity.ts`
- `frontend/hooks/useGeolocation.ts`
- `frontend/hooks/useSocket.ts`

### Copy-Paste AI Prompt for Block 5

```text
PROMPT FOR BLOCK 5:
Build client custom hooks in `frontend/hooks/`.

1. `frontend/hooks/useSessionIdentity.ts`:
   - Reads `sessionId` from `sessionStorage`. If missing, generates a new UUID using `crypto.randomUUID()` and saves it.
   - Generates an auto-assigned anonymous display name from a preset list of animals/callsigns + 2-digit number (e.g. `Falcon-42`, `Ghost-19`, `Signal-88`).
   - Returns `{ sessionId, displayName }`.

2. `frontend/hooks/useGeolocation.ts`:
   - Requests browser navigator.geolocation.getCurrentPosition / watchPosition.
   - Converts lat/lng into 6-character geohash using `ngeohash.encode(lat, lng, 6)`.
   - Handles permission states: `'prompt'`, `'granted'`, `'denied'`, `'unsupported'`.
   - Returns `{ geohash, lat, lng, status, error, requestLocation }`.
   - **PRIVACY RULE:** Raw lat/lng must NOT be saved or logged; returned only to compute geohash.

3. `frontend/hooks/useSocket.ts`:
   - Accepts `{ socketUrl, geohash, sessionId, displayName }`.
   - Initializes `socket.io-client` connection to `NEXT_PUBLIC_SOCKET_SERVER_URL`.
   - Listens for socket events: `connect`, `disconnect`, `room_history`, `new_message`, `user_count_update`, `rate_limit_exceeded`.
   - Provides helper function `sendMessage(text)`.
   - Returns `{ isConnected, messages, userCount, rateLimited, sendMessage }`.
   - Cleans up socket connection on unmount or when `geohash` changes.
```

### Verification Criteria
- `useSessionIdentity` persists identical `sessionId` on page refresh, clears on new tab/browser close.
- `useGeolocation` successfully encodes coordinates to geohash-6 string.
- `useSocket` auto-reconnects when connection drops.

---

## Block 6: Core Web App Views (Landing Screen, Live Chat & Disconnect Flow)

### Objective
Assemble the main application views: location request landing view, live chat feed view, and graceful disconnect/session termination state.

### Files to Create / Modify
- `frontend/app/page.tsx`
- `frontend/app/chat/page.tsx` (or single dynamic page `app/page.tsx` with view state machine)
- `frontend/components/views/LandingView.tsx`
- `frontend/components/views/ChatView.tsx`
- `frontend/components/views/DisconnectView.tsx`

### Copy-Paste AI Prompt for Block 6

```text
PROMPT FOR BLOCK 6:
Assemble the main application views using a clean state machine in `frontend/app/page.tsx` and component views in `frontend/components/views/`.

1. `frontend/components/views/LandingView.tsx`:
   - Utilitarian, direct design (no hero marketing gradients).
   - Clear explanatory text: "Connect to people within ~600m right now. No account. Nothing saved."
   - Inline privacy summary box showing exactly what data is used (Geohash cell only, no raw GPS stored, auto-expiry).
   - Primary action button: `[ GRANT LOCATION & ENTER CELL ]` (min 44x44px).
   - Handles denied/unsupported browser location permissions gracefully with clear instructions.

2. `frontend/components/views/ChatView.tsx`:
   - Uses `Header` at top showing active room geohash (e.g. `CELL: tdr4v7`), live user count (e.g. `14 nearby`), pulse indicator, and leave button.
   - Live scrollable message feed displaying `MessageRow` list.
   - Auto-scrolls to bottom when new messages arrive unless user scrolled up.
   - Fixed bottom composer using `ChatInput`.
   - Toast alert banner for rate limit warnings (`Rate limit reached. Please wait 10s`).

3. `frontend/components/views/DisconnectView.tsx`:
   - Clean, quiet confirmation screen when leaving room: "Session ended. Messages and location dropped."
   - Button to reconnect or re-enter cell.

4. `frontend/app/page.tsx`:
   - Orchestrates hooks (`useSessionIdentity`, `useGeolocation`, `useSocket`).
   - Displays `LandingView` when location is not yet granted.
   - Transitions seamlessly to `ChatView` once geohash is obtained and socket connects.
   - Transitions to `DisconnectView` if user clicks "Leave Room".
```

### Verification Criteria
- User can grant location, join room, send message, see message appear instantly in feed.
- Rate limit toast appears if user sends messages too rapidly.
- Clicking "Leave" closes socket connection and clears room state.

---

## Block 7: Server Keep-Alive Ping (`/health`), Production CORS & E2E Sanity Testing

### Objective
Finalize production deployment readiness: ping route for UptimeRobot, CORS configurations, rate-limiting headers, and perform end-to-end integration verification.

### Files to Create / Modify
- `backend/server.js`
- `backend/render.yaml` (Render deployment config)
- `frontend/vercel.json` (Vercel header/route config)
- `README.md`

### Copy-Paste AI Prompt for Block 7

```text
PROMPT FOR BLOCK 7:
Finalize production readiness, keep-awake endpoint, CORS configuration, and documentation.

1. `backend/server.js`:
   - Ensure `/health` endpoint is lightweight and responds instantly:
     `app.get('/health', (req, res) => res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() }));`
   - Set up CORS options to accept production Vercel frontend URL as well as localhost dev environment.
   - Add graceful shutdown handling (`SIGTERM`, `SIGINT`) to close Redis and Socket connections cleanly.

2. Create `backend/render.yaml`:
   - Define Render Web Service spec for free tier:
     - Environment: `node`
     - Build Command: `npm install`
     - Start Command: `node server.js`
     - Health Check Path: `/health`

3. Create deployment documentation in `README.md`:
   - Provide step-by-step instructions for deploying frontend to Vercel and backend to Render.
   - Detail UptimeRobot setup (ping `/health` every 5 minutes to prevent Render free-tier sleep).
   - Document environment variables setup for both platforms.

4. Run end-to-end verification checklist to ensure 100% test pass rate with zero console errors.
```

### Verification Criteria
- `/health` endpoint responds with 200 OK and uptime JSON payload.
- CORS allows frontend to connect without cross-origin blocked errors.
- Monorepo/dual repository builds cleanly without TypeScript or ESLint errors.
