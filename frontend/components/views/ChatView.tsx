"use client";

import { useEffect, useRef } from "react";
import { Header } from "@/components/ui/Header";
import { ChatInput } from "@/components/ui/ChatInput";
import { MessageRow, type ChatMessage } from "@/components/ui/MessageRow";
import type { ConnectionStatus } from "@/components/ui/PulseIndicator";

type ChatViewProps = {
  geohash: string;
  userCount: number;
  status: ConnectionStatus;
  messages: ChatMessage[];
  rateLimited: boolean;
  onLeave: () => void;
  onSend: (text: string) => void;
};

export default function ChatView({
  geohash,
  userCount,
  status,
  messages,
  rateLimited,
  onLeave,
  onSend,
}: ChatViewProps) {
  const feedRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const element = feedRef.current;
    if (!element) return;
    const nearBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight < 120;
    if (nearBottom || messages.length <= 1) {
      element.scrollTop = element.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex h-dvh flex-col">
      <Header
        geohash={geohash}
        userCount={userCount}
        status={status}
        onLeave={onLeave}
      />

      {rateLimited && (
        <div
          role="alert"
          className="border-b border-signal-orange/40 bg-signal-orange/10 px-4 py-2 text-center font-mono text-xs text-signal-orange"
        >
          Rate limit reached. Please wait 10s.
        </div>
      )}

      {messages.length === 0 ? (
        <div className="flex flex-1 items-start justify-start px-4 py-6">
          <p className="font-mono text-xs text-text-muted">
            No one&apos;s talking here yet &mdash; say something.
          </p>
        </div>
      ) : (
        <ol
          ref={feedRef}
          className="flex-1 overflow-y-auto"
          aria-label="Live messages"
        >
          {messages.map((message) => (
            <MessageRow key={message.id} message={message} />
          ))}
        </ol>
      )}

      <ChatInput onSend={onSend} disabled={status !== "connected"} />
    </div>
  );
}