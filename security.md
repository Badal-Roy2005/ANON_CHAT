# SECURITY.md — Privacy & Security Specification

This document details the security model, privacy non-negotiables, data lifecycle, abuse protection mechanisms, and threat mitigation strategies for **Anon_Chat**.

---

## 1. Core Security & Privacy Principles

1. **Zero PII (Personally Identifiable Information) Collection**
   - The application does not collect, prompt for, or store names, email addresses, phone numbers, hardware IDs, or account credentials.
   - User identity is ephemeral, client-generated, and exists only for the duration of a browser session.

2. **Strict Ephemerality**
   - No data is permanently stored in any relational or non-relational database.
   - All state resides in-memory (Socket.io) or in volatile Redis keys configured with strict Time-To-Live (TTL) expiration (1–2 hours maximum).
   - Session identifiers are retained exclusively in `sessionStorage` and destroyed upon closing the browser tab.

3. **Location Privacy**
   - Precise latitude and longitude coordinates are processed **only on the client side**.
   - Raw GPS coordinates are **never transmitted** to the backend server or logged.
   - Client computes a standard 6-character geohash (~600m × 600m region) using `ngeohash` and transmits only the geohash cell ID to join a chat room.

4. **Zero Raw IP Persistence**
   - IP addresses are processed in memory solely for network routing and rate limiting.
   - Raw IP addresses are **never written to disk or persistent storage**.
   - For rate limiting and flood tracking, IPs are anonymized via standard cryptographic hashing:
     $$\text{Hashed IP} = \text{SHA-256}(\text{Client IP} + \text{IP\_HASH\_SALT})$$

---

## 2. Data Lifecycle & Expiry Matrix

| Data Type | Storage Location | Retention / TTL | Encryption / Protection |
| :--- | :--- | :--- | :--- |
| **Session ID (`UUIDv4`)** | Client `sessionStorage` | Session lifetime (destroyed on tab close) | HTTPS in transit |
| **Raw GPS Coordinates** | Client RAM only | Transient (discarded post-geohashing) | Never transmitted |
| **Room Identifier (Geohash)** | Server RAM & Upstash Redis | Expire on socket disconnect / 2 hr max TTL | Plaintext string (e.g. `tdr4v7`) |
| **Active Messages** | Upstash Redis List | Max 1–2 hours TTL (`EXPIRE`) | Sanitized text, standard TLS |
| **Rate Limit Counters** | Upstash Redis (`@upstash/ratelimit`) | Sliding window (10s to 1 min window) | Hashed key reference |
| **IP Address** | In-memory stream / Redis key | Hashed representation only (15-min TTL) | SHA-256 + secret salt |

---

## 3. Abuse Prevention & Spam Moderation

To ensure platform safety on ₹0 infrastructure without user accounts, a multi-layered defense model is enforced:

### A. Rate Limiting (`@upstash/ratelimit`)
- **Message Frequency Limit:** Maximum 5 messages per 10-second sliding window per session ID.
- **Global IP Rate Limit:** Maximum 30 connection/event attempts per minute per hashed IP.
- **Breach Penalty:** Temporary socket mute (300 seconds) and client event rejection.

### B. Auto-Mute & Flood Protection
- Rapid message bursts (>3 messages in 2 seconds) immediately trigger an automated temporary block.
- Mute status is stored in Redis under `mute:<hashed_ip>` with a 5-minute expiration.

### C. Content Sanitization & Filtering
- **Length Constraint:** Hard limit of 280 characters per message enforced both on client and server.
- **Profanity & Spam Filter:** Server passes all message content through `bad-words` / custom regex filter prior to WebSocket broadcast. Obscene or abusive payloads are quietly dropped or masked.
- **Input Sanitization:** HTML entities, control characters, and script tags are stripped/escaped to prevent Cross-Site Scripting (XSS).

---

## 4. Infrastructure Security & Network Rules

1. **Transport Layer Security (TLS/HTTPS)**
   - All HTTP and WebSocket connections must enforce TLS 1.2/1.3 (`wss://` for WebSockets, `https://` for Next.js).
   - Insecure `http://` or `ws://` connections are automatically upgraded or refused in production.

2. **Cross-Origin Resource Sharing (CORS)**
   - Express/Socket.io backend restricts allowed CORS origins strictly to the Next.js frontend domain (`NEXT_PUBLIC_SOCKET_SERVER_URL`).
   - Wildcard (`*`) origin policies are strictly prohibited in production socket options.

3. **HTTP Hardening (Helmet.js)**
   - Express server implements `helmet()` to enforce secure headers:
     - `X-Content-Type-Options: nosniff`
     - `X-Frame-Options: DENY`
     - `X-XSS-Protection: 0` (modern standard)
     - Strict Content-Security-Policy (CSP) headers.

4. **Secrets Management**
   - Secret keys (`IP_HASH_SALT`, `UPSTASH_REDIS_REST_TOKEN`) are loaded via server environment variables only.
   - Secrets must never be prefixed with `NEXT_PUBLIC_` or exposed to the client bundle.

---

## 5. Threat Model & Mitigation Summary

| Threat Vector | Risk Level | Mitigation Strategy |
| :--- | :--- | :--- |
| **Location Tracking / Stalking** | High | Raw GPS stays on client. Only 6-char geohashes (~600m precision) are sent. Geohashes cover broad areas containing hundreds of physical occupants. |
| **Cross-Site Scripting (XSS)** | High | Input sanitized on server. React automatically escapes strings during DOM rendering. Content Security Policy headers active. |
| **Spam / Bot Flooding** | High | `@upstash/ratelimit` on socket events + SHA-256 salted IP rate limiting + auto-mute cooldowns. |
| **Database Data Leak / Subpoena** | Low | No persistent database exists. All messages auto-expire from Redis within 1–2 hours. |
| **Location Spoofing (Mock Location)** | Medium | Accepted constraint for MVP v1. Mitigation: rate limits prevent automated multi-geohash scraping across broad regions. |
| **DDoS on Free Tier** | Medium | Render and Vercel edge protections + Redis rate limiting + ping `/health` endpoint rate limiting. |

---

## 6. Security Audit Checklist for Developers & AI Agents

- [ ] Is raw GPS (lat/lng) sent over WebSocket or HTTP? **(Must be NO)**
- [ ] Is raw IP logged or saved to Redis? **(Must be NO)**
- [ ] Are messages saved in any SQL/NoSQL DB? **(Must be NO)**
- [ ] Does Redis key setting include explicit TTL expiry (`EXPIRE`)? **(Must be YES)**
- [ ] Are input strings validated and length-checked on server? **(Must be YES)**
- [ ] Are environment secrets safe from client-side bundles? **(Must be YES)**
