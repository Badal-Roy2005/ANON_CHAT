"use client";

type DisconnectViewProps = {
  onReenter: () => void;
};

export default function DisconnectView({ onReenter }: DisconnectViewProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-6 py-10">
      <p className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
        ANON_CHAT
      </p>

      <h1 className="mt-6 text-2xl font-medium leading-snug text-text-main">
        Session ended. Messages and location dropped.
      </h1>

      <p className="mt-3 font-mono text-xs text-text-muted">
        Nothing was saved.
      </p>

      <button
        type="button"
        onClick={onReenter}
        className="mt-8 inline-flex min-h-11 items-center justify-center bg-signal-orange px-5 font-mono text-sm font-medium tracking-wide text-bg-dark transition-colors hover:bg-text-main"
      >
        [ RE-ENTER CELL ]
      </button>
    </main>
  );
}