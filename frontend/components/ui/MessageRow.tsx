import { Badge } from "./Badge";

export type ChatMessage = {
  id: string;
  text: string;
  displayName: string;
  timestamp: number;
  geohash: string;
};

function formatTimestamp(timestamp: number) {
  const date = new Date(timestamp);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

type MessageRowProps = {
  message: ChatMessage;
};

export function MessageRow({ message }: MessageRowProps) {
  return (
    <li className="animate-slide-in border-b border-border-dark/60 px-4 py-3">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[11px] tabular-nums text-text-muted">
          [{formatTimestamp(message.timestamp)}]
        </span>
        <Badge>{message.displayName}</Badge>
      </div>
      <p className="mt-1.5 font-mono text-sm leading-relaxed break-words text-text-main">
        {message.text}
      </p>
    </li>
  );
}