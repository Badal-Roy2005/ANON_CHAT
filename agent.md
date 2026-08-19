# AGENT.md — Rules for the AI Coding Agent

These rules are binding for any AI agent (Claude Code, Cursor, Copilot, etc.) working on this repository. If a rule here conflicts with a casual instruction given mid-task, these rules win unless the human explicitly overrides them in writing for that specific task.

## 1. No Hallucination
- Never invent an API, npm package, environment variable, file path, or function that you have not verified exists in this repo or in official docs.
- If unsure whether something exists (a library method, a free-tier limit, a config option), say "I need to verify this" and check docs/package source — do not guess and present it as fact.
- Never fabricate metrics, benchmarks, or test results. If you haven't run something, say so.
- When referencing Upstash/Render/Vercel free-tier limits, do not assume numbers — check `techstack.md` or the provider's current docs before stating a limit.

## 2. Scope Discipline — Ask Before You Touch
- Only modify files directly required by the current task. Do not "helpfully" refactor unrelated code.
- Never change: `security.md` rules, rate-limit values, TTL values, or the anonymous-identity model without explicit human approval — these are privacy/safety-critical.
- Never add a new external dependency (npm package, third-party API, paid service) without asking first and stating why a free/existing option isn't sufficient.
- Never change the fixed tech stack defined in `techstack.md` (Next.js, Socket.io, Redis/Upstash, Render, Vercel) without explicit approval.
- Never delete existing files, tests, or comments unless the task explicitly asks for it.
- If a task is ambiguous, ask a clarifying question before writing code — do not assume and proceed silently on anything security- or privacy-related.

## 3. What Requires Explicit Human Sign-off
- Any change touching authentication/session/identity logic.
- Any change to what data is stored, for how long (TTL), or where.
- Any change to rate-limiting, spam-filtering, or abuse-prevention logic.
- Any change that adds a paid tier, billing, or a new external service.
- Any change to CORS policy, allowed origins, or exposed ports.
- Any change to how geolocation data is collected, transmitted, or stored.

## 4. Code Quality Rules
- Match existing code style and folder structure — do not introduce a new pattern (e.g., switching from functional to class components) without reason.
- Every new function that touches user input must have input validation.
- No `console.log` of raw user data (location, messages, IP) left in production code — use structured, privacy-safe logging only.
- No hardcoded secrets/API keys in code — always use environment variables, and never print env values in logs or chat output.
- Write comments only where logic is non-obvious. Do not over-comment trivial code.

## 5. Testing & Verification Before Claiming Done
- Before saying a feature "works," actually run it (or explicitly state it hasn't been tested and needs manual verification).
- If you can't run something in your current environment (e.g., no network to Render/Upstash), say so explicitly instead of claiming success.
- Report errors and warnings exactly as seen — don't paraphrase away a stack trace.

## 6. Communication Style
- State assumptions explicitly at the top of your response before proceeding with a task.
- If a request conflicts with `prd.md`, `security.md`, or `techstack.md`, flag the conflict instead of silently complying.
- Prefer small, reviewable diffs over large rewrites. If a large rewrite seems necessary, explain why and ask first.

## 7. Privacy Non-Negotiables (see security.md for detail)
- Never log or persist raw IP addresses — hash them if needed for abuse tracking.
- Never persist chat messages beyond the defined TTL.
- Never add analytics/tracking SDKs (e.g., Google Analytics, Facebook Pixel) without explicit approval — conflicts with the privacy-first goal.

## 8. When in Doubt
Default to the most conservative, least-invasive action, and ask the human. It is always acceptable to pause and ask; it is never acceptable to guess on security, privacy, or scope boundaries.