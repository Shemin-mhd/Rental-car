"use client";

import { useChatStore } from "@/store/chatStore";
import { getImageUrl } from "@/services/api";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

export default function ChatList() {
  const { chats, setActiveChat, activeChat, onlineUsers } = useChatStore();
  const currentUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : null;

  return (
    <div className="flex flex-col h-full bg-white border-r border-zinc-100 w-full md:w-80 lg:w-96">
      <div className="p-6 border-b border-zinc-100">
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-black">Uplink Registry</h2>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1 italic">Active Tactical Threads</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => {
          const isUserRenter = String(chat.renterId?._id) === String(currentUser?.id);
          const otherParticipant = isUserRenter ? chat.hostId : chat.renterId;
          const isSelected = activeChat?._id === chat._id;
          const isOnline = onlineUsers.has(otherParticipant?._id);
          const isAdmin = currentUser?.role === "admin";

          return (
            <div
              key={chat._id}
              onClick={() => setActiveChat(chat)}
              className={`p-5 flex items-center gap-4 cursor-pointer transition-all hover:bg-zinc-50 border-b border-zinc-50 ${isSelected ? 'bg-zinc-50 border-l-4 border-l-[#14532d]' : ''}`}
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200">
                  <Image src={getImageUrl(otherParticipant?.image) || "/placeholder-user.png"} alt="Peer" width={48} height={48} className="object-cover" />
                </div>
                {!isAdmin && isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm animate-pulse" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4 className="text-[13px] font-black italic uppercase text-black truncate flex items-center gap-2">
                    {isAdmin ? `${chat.renterId?.name} ↔ ${chat.hostId?.name}` : (
                      <>
                        {otherParticipant?.name}
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-sm font-black tracking-tighter not-italic ${isUserRenter ? 'bg-orange-500/10 text-orange-600' : 'bg-[#14532d]/10 text-[#14532d]'}`}>
                          {isUserRenter ? 'HOST' : 'CUSTOMER'}
                        </span>
                        {chat.carId?.isAdminFleet && (
                          <span className="text-[7px] bg-black text-white px-1.5 py-0.5 rounded-sm font-black tracking-widest italic">ADMIN FLEET</span>
                        )}
                      </>
                    )}
                  </h4>
                  {chat.lastMessageAt && (
                    <span className="text-[8px] font-bold text-zinc-400 uppercase italic whitespace-nowrap">
                      {formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: false })}
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-bold text-zinc-400 truncate tracking-tight uppercase italic flex items-center gap-2">
                  {chat.carId && (
                    <span className="text-[#14532d] shrink-0 font-black tracking-tighter">[{chat.carId.name}]</span>
                  )}
                  <span className="truncate">{chat.lastMessage || "Establishing secure connection..."}</span>
                </p>
              </div>

              {(chat.unreadCount?.[currentUser?.id] || 0) > 0 && (
                <div className="w-5 h-5 bg-[#14532d] text-white rounded-full flex items-center justify-center text-[8px] font-black italic">
                  {chat.unreadCount?.[currentUser?.id]}
                </div>
              )}
            </div>
          );
        })}
        {chats.length === 0 && (
          <div className="p-10 text-center">
            <p className="text-[10px] font-black uppercase text-zinc-300 italic">No active tactical links detected.</p>
          </div>
        )}
      </div>
    </div>
  );
}
