import { LogOut } from "lucide-react";
import { PulseIndicator, type ConnectionStatus } from "./PulseIndicator";

type HeaderProps = {
  geohash: string;
  userCount: number;
  status: ConnectionStatus;
  onLeave: () => void;
};

export function Header({ geohash, userCount, status, onLeave }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-bg-dark">
      <div className="flex items-center justify-between gap-3 border-b border-border-dark px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <PulseIndicator status={status} />
          <span className="hidden font-mono text-[11px] tracking-widest text-text-muted sm:inline">
            ANON_CHAT
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="font-mono text-[11px] tracking-widest">
            <span className="text-text-muted">CELL:</span>{" "}
            <span className="font-semibold text-signal-orange">{geohash}</span>
          </div>
          <div className="font-mono text-[11px] tracking-widest">
            <span className="text-text-main">{userCount}</span>{" "}
            <span className="text-text-muted">NEARBY</span>
          </div>
          <button
            type="button"
            onClick={onLeave}
            aria-label="Leave room"
            title="Leave room"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-border-dark text-text-muted transition-colors hover:border-signal-orange hover:text-signal-orange"
          >
            <LogOut size={18} strokeWidth={2} />
          </button>
        </div>
      </div>
      <div aria-hidden className="h-0.5 w-full bg-signal-orange" />
    </header>
  );
}