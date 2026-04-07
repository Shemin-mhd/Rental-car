"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/services/api";
import { io } from "socket.io-client";

export default function AdminDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ users: 0, revenue: 0 });
    const [pendingBookings, setPendingBookings] = useState<any[]>([]);
    const [notification, setNotification] = useState<{ msg: string, type: 'info' | 'success' } | null>(null);

    const fetchPendingDocums = async () => {
        try {
            const res = await apiFetch("/bookings/documents/pending");
            const data = await res.json();
            if (res.ok) setPendingBookings(data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await apiFetch("/dashboard/admin");
                const data = await res.json();
                if (res.ok) setStats(data.stats);
            } catch (err) { console.error(err); }
        };

        fetchStats();
        fetchPendingDocums();
        setLoading(false);

        const socket = io("http://localhost:5000", { transports: ["websocket"] });
        socket.on("connect", () => socket.emit("join", "admin-channel"));
        socket.on("newBookingSubmitted", (data) => {
            setNotification({ msg: `URGENT: New transmission from ${data.fullName}! Review now.`, type: 'info' });
            fetchPendingDocums();
            setTimeout(() => setNotification(null), 8000);
        });

        return () => { socket.disconnect(); };
    }, []);

    const handleAction = async (id: string, status: "Approved" | "Rejected") => {
        try {
            const res = await apiFetch(`/bookings/${id}/document-status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                setPendingBookings(prev => prev.filter(b => b._id !== id));
                setNotification({ msg: `Reservation ${status.toLowerCase()} successfully`, type: 'success' });
                setTimeout(() => setNotification(null), 3000);
            }
        } catch (err) {
            alert("Error processing verification");
        }
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-[#C5A037] p-10 font-sans relative overflow-x-hidden">
            {/* Real-time Notification Banner */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -100, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: -100, x: "-50%" }}
                        className={`fixed top-10 left-1/2 z-[9999] w-full max-w-lg p-6 rounded-3xl border shadow-2xl backdrop-blur-3xl flex items-center gap-6 transform -translate-x-1/2 ${notification.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-[#C5A059]/10 border-[#C5A059]/30 text-[#C5A059]'}`}
                    >
                        <span className="text-xl">{notification.type === 'success' ? '✅' : '📢'}</span>
                        <div className="flex-1 text-[11px] font-bold tracking-tight">{notification.msg}</div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <header className="mb-16">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-[#C5A059] px-2 py-0.5 rounded text-[10px] text-black font-black italic -skew-x-12">RG</div>
                        <span className="text-sm font-black tracking-widest uppercase italic">Terminal_<span className="text-[#C5A059]">Uplink</span></span>
                    </div>
                    <h1 className="text-6xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#C5A059] to-[#8E7341] tracking-tighter">Command Center</h1>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
                    <div className="bg-zinc-900/30 border border-[#C5A059]/10 p-10 rounded-[3rem] backdrop-blur-xl">
                        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Net Yield</p>
                        <p className="text-4xl font-black italic tracking-tighter">₹{(stats.revenue || 1280450).toLocaleString()}</p>
                    </div>
                    <div className="bg-zinc-900/30 border border-white/5 p-10 rounded-[3rem] backdrop-blur-xl">
                        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Total Force</p>
                        <p className="text-4xl font-black italic tracking-tighter">{(stats.users || 12402).toLocaleString()}</p>
                    </div>
                </div>

                <div className="space-y-10">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-4 border-b border-white/5 pb-8">
                        Verification <span className="text-[#C5A059]">Protocol</span>
                        <span className="bg-[#C5A059]/10 text-[#C5A059] text-[10px] px-4 py-1.5 rounded-full border border-[#C5A059]/20 font-black">{pendingBookings.length} PENDING</span>
                    </h2>

                    {pendingBookings.length === 0 ? (
                        <div className="bg-[#0a0a0a] border border-white/[0.03] p-32 rounded-[3.5rem] text-center italic text-zinc-600 text-[11px] font-black uppercase tracking-[0.4em]">
                            🛡️ All dossiers cleared. Monitoring transmissions...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            {pendingBookings.map((bk) => (
                                <div key={bk._id} className="bg-zinc-900/30 border border-white/[0.03] rounded-[3.5rem] p-10 space-y-8 hover:border-[#C5A059]/20 transition-all">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-widest text-[#C5A059] mb-1">{bk.fullName}</p>
                                            <p className="text-xl font-black italic uppercase tracking-tighter">{bk.carId?.name || "Premium Fleet Access"}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black italic">₹{bk.totalPrice.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="aspect-video rounded-3xl overflow-hidden border border-white/5">
                                            <img src={`http://localhost:5000/uploads/${bk.idFront}`} className="w-full h-full object-cover opacity-80" />
                                        </div>
                                        <div className="aspect-video rounded-3xl overflow-hidden border border-white/5">
                                            <img src={`http://localhost:5000/uploads/${bk.idBack}`} className="w-full h-full object-cover opacity-80" />
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button onClick={() => handleAction(bk._id, "Approved")} className="flex-[2] bg-white text-black py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-widest hover:bg-[#C5A059] transition-all">Authorize Rental 🔱</button>
                                        <button onClick={() => handleAction(bk._id, "Rejected")} className="flex-1 bg-white/5 border border-white/10 text-white/40 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-widest hover:text-red-500 transition-all">Reject Case</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
