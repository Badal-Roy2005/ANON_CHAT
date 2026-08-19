"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/cn";

export const MAX_MESSAGE_LENGTH = 280;

type ChatInputProps = {
  onSend: (text: string) => void;
  disabled?: boolean;
};

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState("");
  const length = value.length;
  const nearLimit = length >= MAX_MESSAGE_LENGTH - 30;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-border-dark bg-bg-dark px-4 py-3"
    >
      <div className="mx-auto flex w-full max-w-2xl items-end gap-2">
        <input
          type="text"
          value={value}
          onChange={(event) =>
            setValue(event.target.value.slice(0, MAX_MESSAGE_LENGTH))
          }
          placeholder="Say something nearby…"
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={disabled}
          aria-label="Message"
          className="h-11 w-full bg-transparent px-1 font-mono text-sm text-text-main placeholder:text-text-muted/60 outline-none disabled:opacity-50"
        />
        <span
          className={cn(
            "font-mono text-[11px] tabular-nums",
            nearLimit ? "text-signal-orange" : "text-text-muted"
          )}
          aria-live="polite"
        >
          {length}/{MAX_MESSAGE_LENGTH}
        </span>
        <button
          type="submit"
          disabled={disabled || length === 0}
          aria-label="Send message"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center bg-signal-orange text-bg-dark transition-colors hover:bg-text-main disabled:opacity-40"
        >
          <Send size={18} strokeWidth={2} />
        </button>
      </div>
    </form>
  );
}