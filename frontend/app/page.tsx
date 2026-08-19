"use client";

import { useEffect, useState } from "react";
import { useSessionIdentity } from "@/hooks/useSessionIdentity";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useSocket } from "@/hooks/useSocket";
import LandingView from "@/components/views/LandingView";
import ChatView from "@/components/views/ChatView";
import DisconnectView from "@/components/views/DisconnectView";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ||
  "https://anon-chat-gl8u.onrender.com";

type Phase = "landing" | "chat" | "disconnect";

export default function Home() {
  const { sessionId, displayName } = useSessionIdentity();
  const { geohash, status, error, insecureContext, requestLocation } =
    useGeolocation();
  const [phase, setPhase] = useState<Phase>("landing");

  const activeGeohash = phase === "chat" ? geohash : null;

  const { isConnected, messages, userCount, rateLimited, sendMessage } =
    useSocket({
      socketUrl: SOCKET_URL,
      geohash: activeGeohash ?? "",
      sessionId,
      displayName,
    });

  useEffect(() => {
    if (status === "granted" && geohash && phase === "landing") {
      setPhase("chat");
    }
  }, [status, geohash, phase]);

  function handleLeave() {
    setPhase("disconnect");
  }

  function handleReenter() {
    setPhase("chat");
  }

  if (phase === "disconnect") {
    return <DisconnectView onReenter={handleReenter} />;
  }

  if (phase === "chat" && geohash) {
    return (
      <ChatView
        geohash={geohash}
        userCount={userCount}
        status={isConnected ? "connected" : "reconnecting"}
        messages={messages}
        rateLimited={rateLimited}
        onLeave={handleLeave}
        onSend={sendMessage}
      />
    );
  }

  return (
    <LandingView
      status={status}
      error={error}
      insecureContext={insecureContext}
      onRequestLocation={requestLocation}
    />
  );
}