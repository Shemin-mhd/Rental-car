"use client";

import { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { apiFetch } from "@/services/api";
import ChatList from "@/components/chat/ChatList";
import ChatWindow from "@/components/chat/ChatWindow";
import { motion } from "framer-motion";
import { MessageSquare, LayoutDashboard, ChevronLeft } from "lucide-react";
import Link from "next/link";

import { useSearchParams } from "next/navigation";

export default function ChatDashboardPage() {
  const searchParams = useSearchParams();
  const chatIdFromUrl = searchParams.get("id");
  const { setChats, setActiveChat, chats } = useChatStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : null;
    const isAdmin = user?.role === "admin";

    // 🔱 Initial Sync: Load all authorized tactical threads
    const fetchChats = async () => {
      try {
        const endpoint = isAdmin ? "/chat/admin/all-chats" : "/chat/user-chats";
        const res = await apiFetch(endpoint);
        const data = await res.json();
        setChats(data);

        // 🎯 Auto-Select Thread if parameter exists
        if (chatIdFromUrl) {
          const target = data.find((c: any) => c._id === chatIdFromUrl);
          if (target) setActiveChat(target);
        }
      } catch (error) {
        console.error("Link Sync Failure", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [setChats, chatIdFromUrl, setActiveChat]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#14532d] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white text-black overflow-hidden">
      {/* 🔱 Peripheral Navigation Bar */}
      <nav className="h-16 px-6 border-b border-zinc-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
            <Link href="/dashboard/customer" className="p-2 hover:bg-zinc-50 rounded-xl transition-colors text-zinc-400">
                <ChevronLeft size={20} />
            </Link>
            <div className="flex items-center gap-3">
                <div className="p-2 bg-[#14532d]/5 rounded-xl">
                    <MessageSquare size={18} className="text-[#14532d]" />
                </div>
                <div>
                    <h2 className="text-[14px] font-black italic uppercase tracking-tighter leading-none">Intelligence Hub</h2>
                    <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest mt-0.5 italic">Encrypted Fleet Communications</p>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-[8px] font-black uppercase text-[#14532d] bg-[#14532d]/10 px-3 py-1 rounded-full italic tracking-widest animate-pulse">Signals Active</span>
        </div>
      </nav>

      {/* 🔱 Core Interface Grid */}
      <main className="flex-1 flex overflow-hidden">
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 flex overflow-hidden lg:max-w-[1440px] lg:mx-auto lg:w-full lg:border-x lg:border-zinc-100 shadow-[20px_0_60px_rgba(0,0,0,0.02)]"
        >
            <ChatList />
            <ChatWindow />
        </motion.div>
      </main>
    </div>
  );
}
