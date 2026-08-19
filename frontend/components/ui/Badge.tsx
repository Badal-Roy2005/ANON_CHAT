import { cn } from "@/lib/cn";

type BadgeAccent = "signal" | "green" | "muted";

const ACCENT_BORDER: Record<BadgeAccent, string> = {
  signal: "border-l-signal-orange",
  green: "border-l-radio-green",
  muted: "border-l-text-muted",
};

function pickAccent(label: string): BadgeAccent {
  let hash = 0;
  for (let i = 0; i < label.length; i += 1) {
    hash = (hash * 31 + label.charCodeAt(i)) % 1000;
  }
  const accents: BadgeAccent[] = ["signal", "green", "muted"];
  return accents[hash % accents.length];
}

type BadgeProps = {
  children: React.ReactNode;
  accent?: BadgeAccent;
  className?: string;
};

export function Badge({ children, accent, className }: BadgeProps) {
  const resolvedAccent =
    accent ?? pickAccent(typeof children === "string" ? children : "");
  return (
    <span
      className={cn(
        "inline-flex items-center border-l-2 pl-1.5 font-mono text-[11px] uppercase tracking-wider text-text-main",
        ACCENT_BORDER[resolvedAccent],
        className
      )}
    >
      [{children}]
    </span>
  );
}