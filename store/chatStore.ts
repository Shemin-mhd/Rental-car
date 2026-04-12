import { create } from "zustand";

interface Message {
  _id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  text?: string;
  image?: string;
  messageType: "text" | "image" | "system";
  isSeen: boolean;
  createdAt: string;
}

interface Chat {
  _id: string;
  bookingId: any;
  renterId: any;
  hostId: any;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: Record<string, number>;
}

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  onlineUsers: Set<string>;
  isTyping: Record<string, boolean>; // userId -> isTyping
  
  setChats: (chats: Chat[]) => void;
  setActiveChat: (chat: Chat | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateOnlineUsers: (userId: string, status: "online" | "offline") => void;
  setTyping: (userId: string, typing: boolean) => void;
  updateChatLastMessage: (chatId: string, lastMessage: string, lastMessageAt: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  activeChat: null,
  messages: [],
  onlineUsers: new Set(),
  isTyping: {},

  setChats: (chats) => set({ chats }),
  setActiveChat: (chat) => set((state) => {
    if (chat) {
       // Mark chat as read locally
       const currentUserId = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}").id : null;
       const updatedChats = state.chats.map(c => 
         c._id === chat._id ? { ...c, unreadCount: { ...c.unreadCount, [currentUserId]: 0 } } : c
       );
       return { activeChat: chat, messages: [], chats: updatedChats };
    }
    return { activeChat: chat, messages: [] };
  }),
  setMessages: (messages) => set({ messages: Array.isArray(messages) ? messages : [] }),
  addMessage: (message) => set((state) => {
    const currentUserId = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}").id : null;
    const isForActiveChat = state.activeChat?._id === message.chatId;
    
    // Update unread count if it's not the active chat
    const updatedChats = state.chats.map(c => {
      if (c._id === message.chatId) {
        const newCount = (c.unreadCount?.[currentUserId] || 0) + (isForActiveChat ? 0 : 1);
        return { 
          ...c, 
          lastMessage: message.text, 
          lastMessageAt: message.createdAt,
          unreadCount: { ...c.unreadCount, [currentUserId]: newCount }
        };
      }
      return c;
    });

    return { 
      messages: isForActiveChat ? [...state.messages, message] : state.messages,
      chats: updatedChats
    };
  }),
  updateOnlineUsers: (userId, status) => set((state) => {
    const newOnline = new Set(state.onlineUsers);
    if (status === "online") newOnline.add(userId);
    else newOnline.delete(userId);
    return { onlineUsers: newOnline };
  }),
  setTyping: (userId, typing) => set((state) => ({
    isTyping: { ...state.isTyping, [userId]: typing }
  })),
  updateChatLastMessage: (chatId, lastMessage, lastMessageAt) => set((state) => ({
    chats: state.chats.map(c => c._id === chatId ? { ...c, lastMessage, lastMessageAt } : c)
  }))
}));
