"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { apiFetch, getImageUrl } from "@/services/api";
import Image from "next/image";
import Link from "next/link";

export default function CustomerDashboard() {
    const [cars, setCars] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState({
        totalEarnings: 0,
        activeFleet: 0
    });

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const userData = JSON.parse(localStorage.getItem("user") || "{}");
                setUser(userData);

                const res = await apiFetch("/cars/host/inventory");
                if (res.ok) {
                    const data = await res.json();
                    setCars(data);

                    // Simple stats calculation
                    const earnings = data.reduce((acc: number, car: any) => acc + (car.pricePerDay * 5), 0); // Simulated
                    setStats({
                        totalEarnings: earnings,
                        activeFleet: data.length
                    });
                }
            } catch (error) {
                console.error("Dashboard failed:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-12 h-12 border-2 border-[#C5A037] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDFDFD] selection:bg-[#C5A037] p-6 lg:p-12 font-sans relative overflow-x-hidden">

            {/* ── High-Contrast Atmosphere ── */}
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#C5A059]/[0.05] rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-black/[0.02] rounded-full blur-[120px] pointer-events-none" />

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
                <header className="mb-16 flex flex-col lg:flex-row lg:items-end justify-between gap-10 border-b border-black/[0.05] pb-12">
                    <div className="space-y-4 pl-2">
                        <div className="flex items-center gap-3">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-black px-2 py-0.5 rounded-sm text-[8px] text-[#C5A037] font-black italic -skew-x-12">RG</motion.div>
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400 italic">Fleet Authority Portal</span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black italic uppercase tracking-tighter leading-none text-black">
                            Operational <span className="text-[#C5A037]">Intelligence.</span>
                        </h1>
                        <p className="text-zinc-400 text-[8px] font-black uppercase tracking-[0.3em] pl-2 border-l border-[#C5A037]/50 italic">Fleet Commander: {user?.name}</p>
                    </div>

                    <Link
                        href="/dashboard/customer/add-car"
                        className="relative group overflow-hidden bg-black text-white px-10 py-4.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] hover:bg-[#C5A037] transition-all flex items-center gap-4 shadow-2xl active:scale-95"
                    >
                        <span className="relative z-10 text-white group-hover:text-black">Commission Asset</span>
                        <div className="bg-[#C5A037] text-black w-6 h-6 rounded-full flex items-center justify-center font-black relative z-10 group-hover:bg-white transition-transform">+</div>
                    </Link>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    {[
                        { label: "Projected Yield", val: `₹${stats.totalEarnings.toLocaleString()}`, accent: "#C5A037" },
                        { label: "Active Registry", val: stats.activeFleet, accent: "black" },
                        { label: "Fleet Health", val: "98.4%", accent: "rgba(0,0,0,0.3)" }
                    ].map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + (i * 0.1) }}
                            className="bg-white border border-black/[0.05] p-8 rounded-3xl hover:border-[#C5A037]/30 transition-all group shadow-[0_10px_50px_rgba(0,0,0,0.02)]"
                        >
                            <p className="text-zinc-400 text-[8px] font-black uppercase tracking-[0.4em] mb-4 group-hover:text-[#C5A037] transition-colors italic">{s.label}</p>
                            <p className="text-3xl font-black italic tracking-tighter" style={{ color: s.accent }}>{s.val}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="space-y-12 pb-20">
                    <div className="flex items-center gap-4">
                        <h2 className="text-zinc-300 text-[9px] font-black uppercase tracking-[0.5em] italic">Active Registry</h2>
                        <div className="flex-1 h-px bg-black/[0.05]" />
                    </div>

                    {cars.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-zinc-50 border border-black/[0.03] p-24 rounded-[3rem] text-center border-dashed">
                            <p className="italic text-zinc-300 text-[9px] font-black uppercase tracking-[0.6em] tracking-widest">Registry Empty.</p>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            {cars.map((car, i) => (
                                <motion.div
                                    key={car._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + (i * 0.1) }}
                                    className="bg-black border border-[#C5A037]/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 hover:border-[#C5A037] transition-all group shadow-2xl relative overflow-hidden"
                                >
                                    <div className="relative w-full md:w-52 aspect-video rounded-3xl overflow-hidden border border-white/[0.05] shrink-0 shadow-2xl">
                                        <Image src={getImageUrl(car.image)} alt="Asset" fill className="object-cover group-hover:scale-105 transition-transform duration-[2000ms]" unoptimized />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                    </div>

                                    <div className="flex-1 space-y-6 w-full relative z-10 text-white">
                                        <div>
                                            <p className="text-[7px] font-black uppercase tracking-[0.4em] text-[#C5A037] mb-1.5 italic px-2">REG_ID: {car._id.slice(-8).toUpperCase()}</p>
                                            <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none px-2">{car.name}</h3>
                                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest italic px-2">{car.model} • {car.year}</p>
                                        </div>

                                        <div className="flex items-center gap-4 px-2">
                                            <div className="bg-white text-black px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest italic hover:bg-[#C5A037] transition-all">
                                                ₹{car.pricePerDay.toLocaleString()} <span className="opacity-40 ml-1">/ DAY</span>
                                            </div>
                                            <div className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${car.isAvailable ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                {car.isAvailable ? 'ACTIVE' : 'ENGAGED'}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
