# DESIGN.md — Visual & UX Direction

Goal: this must **not** look like a generic "vibe-coded" AI app — no default shadcn purple gradient hero, no generic rounded-card-with-emoji-icon layout, no Inter font + centered-everything template feel. It should feel intentional, a little raw/utilitarian, matching the product's nature: temporary, local, real, slightly anonymous/underground.

## Design Principles
1. **Utility over polish-for-polish's-sake.** This is a live, disposable, local chat — not a SaaS landing page. Avoid marketing-site tropes (hero sections, feature grids, testimonials, "Get Started Free" CTAs with gradient buttons).
2. **Feel present-tense and local.** Visual language should communicate "happening right now, right here" — think transit departure boards, walkie-talkie UI, community bulletin boards, CB radio — not "app store screenshot."
3. **Low visual noise for low-end devices.** Minimal images, no heavy illustrations, no animated gradients or blurred blob backgrounds. Every visual element should also serve the "low CPU/low bandwidth" requirement.
4. **Anonymity should feel intentional, not accidental.** Avatars/display names should look designed (e.g., monospace tags, badge-like name chips) rather than a generic default-avatar placeholder.

## Concrete Anti-Patterns to Avoid
- ❌ Purple/indigo gradient backgrounds
- ❌ Centered hero + subheading + big rounded CTA button pattern
- ❌ Generic SaaS font pairing (Inter for everything)
- ❌ Emoji as icons (🚀 ✨ 🔥) instead of a real icon set
- ❌ Glassmorphism / frosted blur cards used decoratively without purpose
- ❌ Rounded-everything, shadow-everything default Tailwind/shadcn look with zero customization
- ❌ Stock "3 feature cards with icon on top" sections

## Direction to Use Instead
- **Layout metaphor**: departure board / live feed. Messages stream in a fixed-width, left-aligned list, monospace or semi-mono typeface for message text, similar to a terminal or ticker feed — reinforces "real-time, local, ephemeral."
- **Typography**: pair a plain-spoken grotesque sans (e.g., "IBM Plex Sans" or "Space Grotesk") for UI chrome with a monospace face (e.g., "IBM Plex Mono" or "JetBrains Mono") for message content and metadata (timestamps, distance, user tags). This alone visually differentiates it from default AI-generated UIs.
- **Color**: a restrained, near-monochrome palette (off-black / off-white / one accent color, e.g., a signal-orange or a radio-green) rather than a gradient-heavy multi-color palette. Accent color used sparingly — for live indicators, send button, unread counts only.
- **Iconography**: a single consistent icon set (e.g., Lucide or Phosphor, but customized stroke-width), never emoji as functional icons.
- **Motion**: minimal — a subtle pulse on the "live" indicator, message slide-in of ~150ms max. No decorative animation, no auto-playing background effects (battery/CPU cost on low-end devices, also contributes to the generic AI-app feel).
- **Empty/loading states**: written in plain, local, slightly informal language ("No one's talking here yet — say something." / "Finding people nearby…") instead of generic spinner + "Loading..." text.

## Core Screens

### 1. Landing / Location Permission Screen
- No hero image. A short, direct line of copy explaining what happens ("This connects you to people within ~500m of you, right now. No account. Nothing is saved.")
- A single clear action to grant location and enter.
- Show precisely what data is used and why, inline — not buried in a link (reinforces trust/privacy positioning visually, not just legally).

### 2. Chat Room Screen
- Top bar: live user count in this cell (e.g., "14 nearby"), a live-pulse dot, and a subtle radius indicator.
- Message feed: left-aligned, monospace metadata (name-tag, time), normal-weight message text, no chat bubbles (bubbles read as generic messaging-app default — use flat dividers/rows instead, closer to a terminal log or a live comment feed).
- Composer: fixed bottom bar, single-line input, minimal send button (icon-only, accent color).
- Anonymous name tags rendered as small monospace badges (e.g., `[FALCON-42]`), consistent style, not colorful avatar circles.

### 3. Leaving / Session End
- No dramatic "Goodbye" screen. Simple, quiet confirmation that the session and its messages are gone: "You've left this room. Nothing was saved."

## Accessibility & Performance Notes
- Maintain WCAG AA contrast even with the restrained palette.
- All interactive elements sized for touch (min 44x44px tap targets) — important given the low-end-phone audience.
- No custom web fonts that require heavy download on slow networks — self-host a single weight/subset of each chosen font, or fall back to system fonts if bandwidth is a concern in a given region.

## Design Deliverables Expected From Any Agent/Contributor
- A defined color token list (not ad hoc hex codes scattered in components).
- A defined type scale (not arbitrary text-sm/text-lg mixing).
- Consistent spacing scale (Tailwind's default scale is fine, but used deliberately, not randomly).