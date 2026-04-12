"use client";

import { useEffect, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useChatStore } from "@/store/chatStore";

let socket: Socket;

export const ChatSocketProvider = ({ children }: { children: ReactNode }) => {
  const { addMessage, updateOnlineUsers, setTyping, updateChatLastMessage, activeChat } = useChatStore();

  useEffect(() => {
    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : null;
    if (!user?.id) return;

    // 🛰️ Establish Tactical Uplink
    const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";
    socket = io(API_URL, { transports: ["websocket"] });

    socket.on("connect", () => {
      console.log("🛰️ Neural Link Established");
      socket.emit("register-user", user.id);
    });

    socket.on("receive-message", (message) => {
      if (activeChat?._id === message.chatId) {
        addMessage(message);
      }
      updateChatLastMessage(message.chatId, message.text || "[Image]", message.createdAt);
    });

    socket.on("user-status-change", ({ userId, status }) => {
      updateOnlineUsers(userId, status);
    });

    socket.on("user-typing", ({ userId }) => {
      setTyping(userId, true);
    });

    socket.on("user-stop-typing", ({ userId }) => {
      setTyping(userId, false);
    });

    return () => {
      socket.disconnect();
    };
  }, [activeChat?._id, addMessage, updateOnlineUsers, setTyping, updateChatLastMessage]);

  return <>{children}</>;
};

export const getSocket = () => socket;
