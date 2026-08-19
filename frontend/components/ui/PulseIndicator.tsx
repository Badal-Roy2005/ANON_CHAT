import { cn } from "@/lib/cn";

export type ConnectionStatus = "connected" | "reconnecting" | "offline";

const STATUS_STYLES: Record<ConnectionStatus, { dot: string; label: string; animate?: string }> = {
  connected: { dot: "bg-radio-green", label: "Live", animate: "animate-pulse-soft" },
  reconnecting: { dot: "bg-signal-orange", label: "Sync", animate: "animate-pulse-fast" },
  offline: { dot: "bg-signal-red", label: "Offline" },
};

type PulseIndicatorProps = {
  status: ConnectionStatus;
  className?: string;
};

export function PulseIndicator({ status, className }: PulseIndicatorProps) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-text-muted",
        className
      )}
      role="status"
    >
      <span
        aria-hidden
        className={cn("h-2 w-2 rounded-full", style.dot, style.animate)}
      />
      {style.label}
    </span>
  );
}