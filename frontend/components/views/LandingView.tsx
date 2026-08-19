"use client";

import type { GeolocationStatus } from "@/hooks/useGeolocation";

type LandingViewProps = {
  status: GeolocationStatus;
  error: string | null;
  insecureContext: boolean;
  onRequestLocation: () => void;
};

export default function LandingView({
  status,
  error,
  insecureContext,
  onRequestLocation,
}: LandingViewProps) {
  const denied = status === "denied";
  const unsupported = status === "unsupported";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-6 py-10">
      <p className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
        ANON_CHAT
      </p>

      <h1 className="mt-6 text-2xl font-medium leading-snug text-text-main">
        Connect to people within ~600m right now. No account. Nothing saved.
      </h1>

      <div className="mt-6 border border-border-dark bg-card-dark p-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
          What is used
        </p>
        <ul className="mt-2 space-y-1 font-mono text-xs text-text-main">
          <li>&middot; Geohash cell only (~600m area)</li>
          <li>&middot; No raw GPS is stored or sent</li>
          <li>&middot; Sessions &amp; messages auto-expire</li>
        </ul>
      </div>

      {insecureContext && (
        <p className="mt-4 border border-signal-orange/40 p-3 font-mono text-xs leading-relaxed text-text-main">
          Location is blocked because this page is not served over HTTPS — the
          browser requires a secure connection for geolocation. Open the
          deployed Vercel link, or use an HTTPS tunnel (ngrok / cloudflared) to
          test from your phone.
        </p>
      )}

      {denied && !insecureContext && (
        <p className="mt-4 border border-signal-red/40 p-3 font-mono text-xs leading-relaxed text-text-main">
          Location access was denied. Enable location for this site in your
          browser settings, then try again.
        </p>
      )}
      {unsupported && (
        <p className="mt-4 border border-signal-red/40 p-3 font-mono text-xs leading-relaxed text-text-main">
          {error || "This browser does not support geolocation."}
        </p>
      )}

      <button
        type="button"
        onClick={onRequestLocation}
        disabled={unsupported || insecureContext}
        className="mt-8 inline-flex min-h-11 items-center justify-center bg-signal-orange px-5 font-mono text-sm font-medium tracking-wide text-bg-dark transition-colors hover:bg-text-main disabled:cursor-not-allowed disabled:opacity-40"
      >
        [ GRANT LOCATION &amp; ENTER CELL ]
      </button>

      <p className="mt-3 font-mono text-[11px] text-text-muted">
        No signup. No account. Your location is not saved.
      </p>
    </main>
  );
}