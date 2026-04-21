"use client";

import { useEffect, ReactNode, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useChatStore } from "@/store/chatStore";
import { AnimatePresence, motion } from "framer-motion";

let socket: Socket;

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "arrived";
}

// ─── In-App Notification Toast ─────────────────────────────────────────────
function NotificationToast({ notifications, onDismiss }: {
    notifications: AppNotification[];
    onDismiss: (id: string) => void;
}) {
    return (
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {notifications.map((n) => (
                    <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: 60, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 60, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="pointer-events-auto w-80 bg-white border border-black/[0.06] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden"
                    >
                        {/* Color accent bar */}
                        <div className={`h-1 w-full ${
                            n.type === "success" ? "bg-[#526E48]" :
                            n.type === "arrived" ? "bg-amber-500" :
                            n.type === "warning" ? "bg-orange-500" :
                            "bg-blue-500"
                        }`} />
                        <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-black mb-1">
                                        {n.title}
                                    </p>
                                    <p className="text-[11px] text-zinc-500 font-medium leading-snug">
                                        {n.message}
                                    </p>
                                </div>
                                <button
                                    onClick={() => onDismiss(n.id)}
                                    className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-zinc-300 hover:text-zinc-600 hover:bg-zinc-50 transition-all text-xs font-black"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

// ─── Main Provider ──────────────────────────────────────────────────────────
export const ChatSocketProvider = ({ children }: { children: ReactNode }) => {
    const { addMessage, updateOnlineUsers, setTyping, updateChatLastMessage, activeChat } = useChatStore();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    const addNotification = (title: string, message: string, type: AppNotification["type"] = "info") => {
        const id = Date.now().toString();
        setNotifications((prev) => [...prev, { id, title, message, type }]);
        // Auto-dismiss after 6 seconds
        setTimeout(() => dismissNotification(id), 6000);
    };

    const dismissNotification = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    useEffect(() => {
        let user = null;
        try {
            const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
            if (storedUser && storedUser !== "undefined" && storedUser.startsWith("{")) {
                user = JSON.parse(storedUser);
            }
        } catch (e) {
            console.error("Critical: User identity corruption detected.", e);
            localStorage.removeItem("user");
        }
        if (!user?.id) return;

        const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "https://rental-garage.duckdns.org";
        socket = io(API_URL, { transports: ["websocket"] });

        socket.on("connect", () => {
            console.log("🛰️ Neural Link Established");
            socket.emit("register-user", user.id);
            // Join personal notification room
            socket.emit("join-user-room", user.id);
            
            // Join global admin command room if authorized
            if (user.role === 'admin') {
                console.log("💂 Admin Authority Verified. Joining Tactical Command Room.");
                socket.emit("join-admin-room");
            }
        });

        // ── Chat events ─────────────────────────────────────────────────────
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

        // ── Pickup reminder notifications ───────────────────────────────────
        socket.on("pickupReminder", (data: { title: string; message: string; type: "tomorrow" | "today" }) => {
            addNotification(
                data.title,
                data.message,
                data.type === "today" ? "warning" : "info"
            );
        });

        // ── Customer arrived → host gets notified ───────────────────────────
        socket.on("customerArrived", (data: { message: string; fullName: string }) => {
            addNotification("Customer Has Arrived 📍", data.message, "arrived");
        });

        // ── Trip started → user gets notified ──────────────────────────────
        socket.on("tripStarted", (data: { message: string }) => {
            addNotification("Trip Started! 🚗", data.message, "success");
        });

        return () => {
            socket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeChat?._id, addMessage, updateOnlineUsers, setTyping, updateChatLastMessage]);

    return (
        <>
            {children}
            <NotificationToast notifications={notifications} onDismiss={dismissNotification} />
        </>
    );
};

export const getSocket = () => socket;
