"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { ChatMessage } from "@/components/ui/MessageRow";

const RATE_LIMIT_RESET_MS = 10_000;

type UseSocketOptions = {
  socketUrl: string;
  geohash: string;
  sessionId: string;
  displayName: string;
};

export function useSocket({
  socketUrl,
  geohash,
  sessionId,
  displayName,
}: UseSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [rateLimited, setRateLimited] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const rateLimitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!socketUrl || !geohash || !sessionId || !displayName) return;

    const socket = io(socketUrl, {
      transports: ["websocket"],
      reconnection: true,
    });
    socketRef.current = socket;

    setMessages([]);
    setUserCount(0);
    setRateLimited(false);

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join_room", { geohash, sessionId, displayName });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("room_history", (history: ChatMessage[]) => {
      setMessages(history);
    });

    socket.on("new_message", (message: ChatMessage) => {
      setMessages((previous) => [...previous, message]);
    });

    socket.on("user_count_update", ({ geohash: cell, count }) => {
      if (cell === geohash) setUserCount(count);
    });

    socket.on("rate_limit_exceeded", () => {
      setRateLimited(true);
      if (rateLimitTimerRef.current) clearTimeout(rateLimitTimerRef.current);
      rateLimitTimerRef.current = setTimeout(() => {
        setRateLimited(false);
      }, RATE_LIMIT_RESET_MS);
    });

    return () => {
      if (rateLimitTimerRef.current) clearTimeout(rateLimitTimerRef.current);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [socketUrl, geohash, sessionId, displayName]);

  const sendMessage = useCallback(
    (text: string) => {
      const socket = socketRef.current;
      if (!socket) return;
      socket.emit("send_message", {
        geohash,
        sessionId,
        displayName,
        text,
      });
    },
    [geohash, sessionId, displayName]
  );

  return { isConnected, messages, userCount, rateLimited, sendMessage };
}