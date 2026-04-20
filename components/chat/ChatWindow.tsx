"use client";

import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { getSocket } from "@/components/providers/ChatSocketProvider";
import { apiFetch, getImageUrl } from "@/services/api";
import { Send, Image as ImageIcon, Phone, Info, MoreVertical } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";

export default function ChatWindow() {
  const { activeChat, messages, setMessages, addMessage, isTyping, onlineUsers } = useChatStore();
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : null;
  const socket = getSocket();

  const otherParticipant = String(activeChat?.renterId?._id) === String(currentUser?.id) ? activeChat?.hostId : activeChat?.renterId;
  const isPeerOnline = onlineUsers.has(otherParticipant?._id);

  useEffect(() => {
    if (!activeChat) return;

    // 🔱 Thread Fetch: Load message history
    const loadMessages = async () => {
      try {
        const res = await apiFetch(`/chat/${activeChat._id}/messages`);
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);

        // Mark as seen
        apiFetch(`/chat/${activeChat._id}/message-seen`, { method: "PATCH" });
      } catch (error) {
        console.error("Historical Retrieval Failure", error);
        setMessages([]);
      }
    };

    loadMessages();
    socket?.emit("join-chat", activeChat._id);
  }, [activeChat?._id, socket, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeChat || !socket) return;

    const messageData = {
      chatId: activeChat._id,
      senderId: currentUser.id || currentUser._id,
      receiverId: otherParticipant._id,
      text: inputText.trim(),
      messageType: "text" as const
    };

    socket.emit("send-message", messageData);
    setInputText("");

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit("stop-typing", { chatId: activeChat._id, userId: currentUser.id || currentUser._id });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (activeChat && socket) {
      socket.emit("typing", { chatId: activeChat._id, userId: currentUser.id || currentUser._id });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop-typing", { chatId: activeChat._id, userId: currentUser.id || currentUser._id });
      }, 3000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50/50 p-10 text-center">
        <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center mb-6">
          <Send size={32} className="text-zinc-300 -rotate-12" />
        </div>
        <h3 className="text-xl font-black italic uppercase tracking-tighter text-black mb-2">Initialize Uplink</h3>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest max-w-[240px] italic">Select a tactical thread to initiate secure communications with host/renter.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* 🔱 Thread Header */}
      <div className="p-4 px-6 border-b border-zinc-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200">
              <Image src={getImageUrl(otherParticipant?.image) || "/placeholder-user.png"} alt="Peer" width={40} height={40} className="object-cover" />
            </div>
            {isPeerOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm" />
            )}
          </div>
          <div>
            <h3 className="text-[14px] font-black italic uppercase text-black leading-none mb-1">{otherParticipant?.name}</h3>
            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest italic leading-none">
              {isPeerOnline ? 'Signal Active // Online' : 'Signal Lost // Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2.5 rounded-xl hover:bg-zinc-50 text-zinc-400 transition-colors"><Phone size={18} /></button>
          <button className="p-2.5 rounded-xl hover:bg-zinc-50 text-zinc-400 transition-colors"><Info size={18} /></button>
          <button className="p-2.5 rounded-xl hover:bg-zinc-50 text-zinc-400 transition-colors"><MoreVertical size={18} /></button>
        </div>
      </div>

      {/* ── Message Vault ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#FAFAFA]/50">
        {messages.map((msg, index) => {
          const currentId = currentUser?.id || currentUser?._id;
          const isMe = String(msg.senderId) === String(currentId);
          return (
            <div key={msg._id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] space-y-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`px-4 py-3 rounded-[1.5rem] text-[13px] font-bold tracking-tight shadow-sm ${isMe ? 'bg-[#14532d] text-white rounded-tr-none' : 'bg-white text-black border border-zinc-100 rounded-tl-none'}`}>
                  {msg.text}
                </div>
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[8px] font-black text-zinc-400 uppercase italic opacity-40">
                    {format(new Date(msg.createdAt), 'HH:mm')}
                  </span>
                  {isMe && (
                    <span className={`text-[7px] font-black uppercase italic ${msg.isSeen ? 'text-[#14532d]' : 'text-zinc-300'}`}>
                      {msg.isSeen ? 'Seen' : 'Sent'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {isTyping[otherParticipant?._id] && (
          <div className="flex justify-start">
            <div className="bg-white border border-zinc-100 px-4 py-2 rounded-2xl flex gap-1 items-center shadow-sm">
              <div className="w-1 h-1 bg-zinc-300 rounded-full animate-bounce" />
              <div className="w-1 h-1 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1 h-1 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 🔱 Input Deck */}
      <div className="p-4 px-6 border-t border-zinc-100 bg-white">
        <form onSubmit={handleSend} className="flex items-center gap-4 bg-zinc-50 rounded-[1.5rem] border border-zinc-200/50 p-2 pl-6">
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="SYSTEM_MESSAGE_INPUT..."
            className="flex-1 bg-transparent border-none outline-none text-[13px] font-bold text-black placeholder:text-zinc-300 italic uppercase"
          />
          <div className="flex items-center gap-1">
            <button type="button" className="p-2.5 text-zinc-400 hover:text-[#14532d] transition-colors"><ImageIcon size={20} /></button>
            <button type="submit" disabled={!inputText.trim()} className="p-3 bg-[#14532d] text-white rounded-[1rem] hover:shadow-lg disabled:opacity-40 disabled:hover:shadow-none transition-all active:scale-95">
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
