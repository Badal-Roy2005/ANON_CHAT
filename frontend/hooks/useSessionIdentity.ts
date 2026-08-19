"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "anon_chat_session_id";

const CALLSIGNS = [
  "Falcon",
  "Ghost",
  "Signal",
  "Raven",
  "Echo",
  "Viper",
  "Nomad",
  "Harbor",
  "Pilot",
  "Nova",
];

function generateUUID(): string {
  if (typeof window !== "undefined" && typeof window.crypto?.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  // Fallback for non-secure contexts (e.g. http://<lan-ip>:3000 on a phone),
  // where crypto.randomUUID is unavailable.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const random = (Math.random() * 16) | 0;
    const value = c === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function generateDisplayName(sessionId: string): string {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i += 1) {
    hash = (hash * 31 + sessionId.charCodeAt(i)) % 100000;
  }
  const callsign = CALLSIGNS[hash % CALLSIGNS.length];
  const number = String(10 + (hash % 90));
  return `${callsign}-${number}`;
}

export function useSessionIdentity() {
  const [sessionId, setSessionId] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    let id: string | null = null;
    try {
      id = window.sessionStorage.getItem(SESSION_KEY);
    } catch {
      // storage unavailable (e.g. private browsing) — fall through to new UUID
    }
    if (!id) {
      id = generateUUID();
      try {
        window.sessionStorage.setItem(SESSION_KEY, id);
      } catch {
        // storage unavailable — keep in-memory id for this session
      }
    }
    setSessionId(id);
    setDisplayName(generateDisplayName(id));
  }, []);

  return { sessionId, displayName };
}