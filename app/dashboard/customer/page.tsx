"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch, getImageUrl } from "@/services/api";
import Image from "next/image";
import Link from "next/link";
import { io } from "socket.io-client";
import {
    Bell,
    Search,
    Calendar,
    ChevronRight,
    Plus,
    Activity,
    ShieldCheck,
    LayoutDashboard,
    TrendingUp,
    LogOut,
    RefreshCw,
    Settings,
    Map as MapIcon,
    MessageSquare,
    Navigation,
    Car,
    Workflow,
    Layers,
    ArrowUpRight,
    Menu,
    ClipboardList,
    Key,
    CheckCircle,
    Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/components/providers/ChatSocketProvider";

/**
 * 🔱 Dashboard Design: "Premium Pearl Lux - User Friendly Edition"
 * Aesthetic: Clean, easy to read, no confusing technical jargon.
 */

export default function HostDashboard() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("dashboard");

    const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
        queryKey: ["customerDashboard"],
        queryFn: async () => {
            const res = await apiFetch("/dashboard/customer");
            return res.json();
        }
    });

    const { data: rawCars = [], isLoading: carsLoading } = useQuery({
        queryKey: ["customerCars"],
        queryFn: async () => {
            const res = await apiFetch("/cars/owner/cars");
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        }
    });

    const [autoTrackId, setAutoTrackId] = useState<string | null>(null);
    const trackingInterval = useRef<NodeJS.Timeout | null>(null);

    // 🛰️ Tactical Auto-Uplink Engine
    useEffect(() => {
        if (autoTrackId) {
            console.log("🛰️ Auto-Tracking Engaged for Unit:", autoTrackId);
            trackingInterval.current = setInterval(() => {
                if (!navigator.geolocation) return;
                navigator.geolocation.getCurrentPosition(async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    try {
                        await apiFetch(`/bookings/${autoTrackId}/location`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ lat: latitude, lng: longitude })
                        });
                        console.log("🛰️ Pulse Sent:", latitude, longitude);
                    } catch (err) { console.error("Signal Drop."); }
                });
            }, 10000); // 10s ping interval
        } else {
            if (trackingInterval.current) clearInterval(trackingInterval.current);
        }
        return () => { if (trackingInterval.current) clearInterval(trackingInterval.current); };
    }, [autoTrackId]);

    useEffect(() => {
        const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "https://rental-car-backend-7np6.onrender.com");
        socket.on("connect", () => {
            console.log("Tactical Uplink Established 🛰️");
            const userId = localStorage.getItem("userId");
            if (userId) socket.emit("join", `user-${userId}`);
        });

        // 🛰️ Real-time Fleet Tracking Listener
        socket.on("locationUpdate", (data: { carId: string, lat: number, lng: number }) => {
            console.log("🛰️ Incoming Telemetry:", data);
            queryClient.setQueryData(["ownerCars"], (oldCars: any) => {
                if (!oldCars) return oldCars;
                return oldCars.map((c: any) =>
                    c._id === data.carId ? { ...c, lat: data.lat, lng: data.lng, isMoving: true } : c
                );
            });
        });

        return () => { socket.disconnect(); };
    }, [queryClient]);

    const cars = Array.isArray(rawCars) ? rawCars : [];
    const stats = dashboardData?.stats || { revenue: 0, bookings: 0, fleetCount: 0, activeNodes: 0, avgYield: 0 };
    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : null;
    const utilization = stats.fleetCount > 0 ? Math.round((stats.activeNodes / stats.fleetCount) * 100) : 0;

    const handleLogout = () => { localStorage.clear(); router.push("/login"); };

    const deleteCarMutation = useMutation({
        mutationFn: async (id: string) => apiFetch(`/cars/${id}`, { method: "DELETE" }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customerCars"] })
    });

    const { data: hostBookings = [], isLoading: hostBookingsLoading } = useQuery({
        queryKey: ["hostBookings"],
        queryFn: async () => {
            const res = await apiFetch("/bookings/host/bookings");
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        }
    });

    const handoverMutation = useMutation({
        mutationFn: async (bookingId: string) => {
            const res = await apiFetch(`/bookings/${bookingId}/handover`, { method: "PATCH" });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Handover failed");
            }
            return res.json();
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hostBookings"] }),
        onError: (err: any) => alert(err.message || "Handover failed."),
    });


    if (dashboardLoading || carsLoading) return (
        <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#526E48] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const renderView = () => {
        switch (activeTab) {
            case "dashboard":
                return (
                    <div className="space-y-8">
                        {/* ── Revenue Section ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-[#526E48]/5 group overflow-hidden relative">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#526E48] mb-2 font-mono">Total Earnings</p>
                                <h2 className="text-6xl font-black tracking-tighter text-black mb-8">₹{(stats.revenue || 0).toLocaleString()}</h2>
                                <div className="flex items-end gap-2 h-20">
                                    {(dashboardData?.history || [20, 50, 40, 80, 60, 100, 75]).map((h: any, i: number) => {
                                        const height = typeof h === 'object' ? (h.revenue / (Math.max(...dashboardData.history.map((x: any) => x.revenue)) || 1) * 100) : h;
                                        return (
                                            <div key={i} className={`flex-1 rounded-sm transition-all duration-1000 ${i === 5 ? "bg-[#526E48]" : "bg-[#526E48]/10 group-hover:bg-[#526E48]/30"}`} style={{ height: `${height}%` }} />
                                        );
                                    })}
                                </div>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#526E48] p-10 rounded-[2.5rem] shadow-xl text-white flex flex-col justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">Fleet Active</p>
                                    <h3 className="text-5xl font-black tracking-tighter">{utilization}%</h3>
                                </div>
                                <div className="pt-6 border-t border-white/10 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest opacity-60">
                                    <span>{stats.activeNodes}/{stats.fleetCount} Cars are Rented</span>
                                    <Activity size={14} />
                                </div>
                            </motion.div>
                        </div>

                        {/* ── Statistics Grid ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: "Total Cars", value: stats.fleetCount, icon: Car },
                                { label: "Earnings Per Trip", value: `₹${(stats.avgYield || 0).toLocaleString()}`, icon: Workflow },
                                { label: "Total Bookings", value: stats.bookings, icon: Layers },
                                { label: "Safety Rating", value: "Excellent", icon: ShieldCheck },
                            ].map((stat, i) => (stat.label && (
                                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }} className="bg-white p-8 rounded-[2rem] border border-black/[0.03] hover:border-[#526E48]/20 transition-all group">
                                    <stat.icon className="text-[#526E48]/20 group-hover:text-[#526E48] transition-colors mb-4" size={20} />
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#526E48]/50 mb-1">{stat.label}</p>
                                    <h4 className="text-xl font-black text-black">{stat.value}</h4>
                                </motion.div>
                            )))}
                        </div>

                        {/* Fleet Summary: Now the focus of the dashboard */}
                        <div className="bg-white rounded-[3rem] p-10 border border-black/[0.02] shadow-sm">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#526E48] mb-8">Fleet Overview</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {cars.map((car: any) => (
                                    <div key={car._id} className="flex items-center justify-between p-6 rounded-3xl bg-[#FBFBFB] border border-black/[0.02]">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 relative rounded-2xl overflow-hidden shadow-sm">
                                                <Image src={getImageUrl(car.image)} alt="Car" fill className="object-cover" unoptimized />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase text-black italic">{car.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${!car.isAvailable ? "bg-[#526E48] animate-pulse" : "bg-zinc-200"}`} />
                                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{car.isAvailable ? "Standby" : "Deployed"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case "registry":
                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-black">Fleet Registry</h2>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] mt-1 italic">Managing {cars.length} tactical assets</p>
                            </div>
                            <div className="relative w-72">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                                <input type="text" placeholder="Search my cars..." className="w-full bg-white border border-black/[0.04] rounded-2xl pl-12 pr-6 py-3.5 text-xs font-bold text-black outline-none focus:border-[#526E48]/20 transition-all shadow-sm" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {cars.map((car: any) => (
                                <motion.div
                                    key={car._id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-white p-5 rounded-[2rem] border border-black/[0.03] shadow-sm flex items-center justify-between group hover:shadow-2xl hover:border-[#526E48]/5 transition-all"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="relative w-28 h-20 rounded-2xl overflow-hidden border border-black/[0.04] bg-zinc-50 shadow-inner">
                                            <Image src={getImageUrl(car.image)} alt="Car" fill className="object-cover" unoptimized />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-lg font-black uppercase italic text-black leading-none">{car.name}</h4>
                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-sm ${car.status === 'APPROVED' ? 'bg-[#526E48]/10 text-[#526E48]' : 'bg-red-100 text-red-600'}`}>{car.status === 'APPROVED' ? 'Approved' : car.status}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">{car.model} • {car.location}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {car.status === "APPROVED" && (
                                            <div className="flex items-center gap-2 pr-6 border-r border-black/[0.04]">
                                                {!car.isAvailable && (() => {
                                                    const activeBk = hostBookings.find((b: any) => b.carId._id === car._id && b.status !== 'Completed' && b.status !== 'Cancelled');
                                                    if (!activeBk) return null;

                                                    const isArrived = activeBk.status === "arrived";
                                                    const isHandingOver = handoverMutation.isPending && handoverMutation.variables === activeBk._id;

                                                    return (
                                                        <div className="flex items-center gap-2">
                                                            {/* 💬 Quick Chat Bridge */}
                                                            <Link
                                                                href="/dashboard/chat"
                                                                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-[#526E48] transition-all"
                                                            >
                                                                <MessageSquare size={10} /> Contact Renter
                                                            </Link>

                                                            {/* 🛰️ Auto-Tracking Toggle */}
                                                            <button
                                                                onClick={() => setAutoTrackId(autoTrackId === activeBk._id ? null : activeBk._id)}
                                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ml-2 ${autoTrackId === activeBk._id
                                                                    ? "bg-[#526E48] text-white border-[#526E48] animate-pulse"
                                                                    : "bg-zinc-50 text-zinc-400 border-black/5 hover:border-black/20"
                                                                    }`}
                                                            >
                                                                <Activity size={10} /> {autoTrackId === activeBk._id ? "Auto-Track ON" : "Auto-Track OFF"}
                                                            </button>

                                                            {/* 📍 Live Location Uplink */}
                                                            <button
                                                                onClick={() => {
                                                                    if (!navigator.geolocation) return alert("Location Services Disabled");
                                                                    navigator.geolocation.getCurrentPosition(async (pos) => {
                                                                        const { latitude, longitude } = pos.coords;
                                                                        try {
                                                                            const res = await apiFetch(`/cars/${car._id}`, {
                                                                                method: "PATCH",
                                                                                headers: { "Content-Type": "application/json" },
                                                                                body: JSON.stringify({ lat: latitude, lng: longitude })
                                                                            });
                                                                            if (res.ok) alert("📍 LIVE: Uplink active. GPS broadcast synchronized.");
                                                                        } catch (err) { alert("Uplink Error"); }
                                                                    });
                                                                }}
                                                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-600 hover:text-white transition-all ml-2"
                                                                title="Broadcast Live Location"
                                                            >
                                                                <Navigation size={10} /> Broadcast
                                                            </button>

                                                            {isArrived && (
                                                                <button
                                                                    onClick={() => handoverMutation.mutate(activeBk._id)}
                                                                    disabled={isHandingOver}
                                                                    className="flex items-center gap-2 px-3 py-1.5 bg-[#526E48] text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
                                                                >
                                                                    {isHandingOver ? <Loader2 size={10} className="animate-spin" /> : <Key size={10} />}
                                                                    Handover Keys
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 pl-4">
                                            <Link href={`/dashboard/customer/edit-car/${car._id}`} className="h-10 px-5 rounded-xl border border-black/5 flex items-center justify-center text-zinc-400 hover:text-black hover:bg-zinc-100 transition-all text-[9px] font-black uppercase tracking-widest">
                                                Edit Car
                                            </Link>
                                            <button onClick={() => { if (window.confirm('Are you sure you want to remove this car?')) deleteCarMutation.mutate(car._id) }} className="h-10 px-5 rounded-xl border border-black/5 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all text-[9px] font-black uppercase tracking-widest">
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                );
            case "tracking":
                return (
                    <div className="space-y-6">
                        <div className="mb-10">
                            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-black">Fleet Radar</h2>
                            <p className="text-[10px] font-bold text-[#526E48] uppercase tracking-[0.4em] mt-1 italic">Real-time GPS Monitoring & Tactical Status</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* 🛰️ Fleet Tracking Grid */}
                            <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {cars.map((car: any) => (
                                    <motion.div
                                        key={car._id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-white rounded-[2.5rem] p-8 border border-black/[0.03] shadow-sm relative overflow-hidden group"
                                    >
                                        {/* Status Glow */}
                                        <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 transition-all ${!car.isAvailable ? "bg-[#526E48]" : "bg-zinc-400"}`} />

                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-14 h-14 relative rounded-2xl overflow-hidden shadow-md">
                                                <Image src={getImageUrl(car.image)} alt="Car" fill className="object-cover" unoptimized />
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${!car.isAvailable ? "bg-[#526E48]/10 text-[#526E48]" : "bg-zinc-100 text-zinc-400"}`}>
                                                    {!car.isAvailable ? "🛰️ Deployed" : "Standby"}
                                                </span>
                                                <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest mt-2">{car.location}</p>
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-black uppercase italic tracking-tighter text-black mb-1">{car.name}</h3>
                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-6">{car.model}</p>

                                        <div className="space-y-3 mb-8">
                                            <div className="flex justify-between items-center py-2 border-b border-black/[0.02]">
                                                <span className="text-[8px] font-black uppercase text-zinc-300">Status</span>
                                                <div className="flex items-center gap-2">
                                                    {car.isMoving && <div className="w-1 h-1 rounded-full bg-[#526E48] animate-ping" />}
                                                    <span className={`text-[9px] font-mono font-black ${car.isMoving ? "text-[#526E48]" : "text-zinc-400"}`}>
                                                        {car.isMoving ? "SIGNAL_ACTIVE" : "STATIONARY"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-black/[0.02]">
                                                <span className="text-[8px] font-black uppercase text-zinc-300">Last Lat</span>
                                                <span className="text-[10px] font-mono font-black text-black transition-all duration-500">{car.lat?.toFixed(6) || "NO_SIGNAL"}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-black/[0.02]">
                                                <span className="text-[8px] font-black uppercase text-zinc-300">Last Lng</span>
                                                <span className="text-[10px] font-mono font-black text-black transition-all duration-500">{car.lng?.toFixed(6) || "NO_SIGNAL"}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                // Unconditionally launch the Customer Live Radar
                                                router.push(`/dashboard/customer/intercept/${car._id}`);
                                            }}
                                            className={`w-full h-12 flex items-center justify-center gap-3 text-[9px] font-black uppercase tracking-[0.2em] transition-all group/btn rounded-xl border ${car.isMoving || hostBookings?.find((b: any) => b.carId._id === car._id && b.status !== 'Completed' && b.status !== 'Cancelled') ? 'bg-[#526E48] text-white border-[#526E48] shadow-lg shadow-[#526E48]/20 hover:bg-black' : 'bg-zinc-50 border-black/[0.03] text-black hover:bg-[#526E48] hover:text-white'}`}
                                        >
                                            <Navigation size={14} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                            {(!car.lat || !car.lng) ? "View Base Station" : "View Live Position"}
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] text-black font-sans flex flex-col lg:flex-row overflow-hidden relative">
            {/* ── Sidebar (Desktop) ── */}
            <aside className="hidden lg:flex w-72 bg-white border-r border-black/[0.04] flex-col p-10 z-50">
                <div className="flex items-center gap-4 mb-20 group cursor-pointer" onClick={() => router.push("/")}>
                    <div className="w-10 h-10 bg-[#526E48] rounded-2xl flex items-center justify-center shadow-2xl transition-all group-hover:rotate-12">
                        <Car className="text-white" size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-black italic tracking-tighter text-black leading-none uppercase">Garage</h1>
                        <p className="text-[8px] font-bold text-[#526E48] uppercase tracking-[0.4em] mt-1 italic leading-none">Member Area</p>
                    </div>
                </div>

                <nav className="space-y-2">
                    {[
                        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
                        { id: "registry", label: "Registry", icon: Menu },
                        { id: "tracking", label: "Fleet Radar", icon: MapIcon },
                        { id: "chat", label: "Messages", icon: MessageSquare },
                        { id: "verify", label: "Verification", icon: ShieldCheck },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (item.id === "verify") router.push("/dashboard/customer/verify");
                                else if (item.id === "chat") router.push("/dashboard/chat");
                                else setActiveTab(item.id);
                            }}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === item.id ? "bg-[#526E48] text-white shadow-xl shadow-[#526E48]/20" : "text-black/30 hover:text-black hover:bg-[#F8F8F8]"}`}
                        >
                            <item.icon size={16} className={activeTab === item.id ? "opacity-100" : "opacity-30"} />
                            {item.label}
                            {activeTab === item.id && <motion.div layoutId="nav-pill" className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white italic" />}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto space-y-4">
                    <Link href="/dashboard/customer/add-car" className="w-full h-14 bg-black text-white rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase italic tracking-[0.2em] hover:bg-[#526E48] transition-all shadow-xl">
                        <Plus size={16} /> Add New Car
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-3 text-red-500/40 hover:text-red-500 text-[10px] font-black uppercase tracking-widest transition-all">
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </aside>

            {/* ── Mobile Tactical Command Bar ── */}
            <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] bg-black/90 backdrop-blur-2xl rounded-[2rem] border border-white/10 px-6 py-4 flex justify-between items-center shadow-2xl">
                {[
                    { id: "dashboard", icon: LayoutDashboard },
                    { id: "registry", icon: Menu },
                    { id: "chat", icon: MessageSquare },
                    { id: "tracking", icon: MapIcon },
                    { id: "add", icon: Plus, special: true },
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => {
                            if (item.id === "add") router.push("/dashboard/customer/add-car");
                            else if (item.id === "chat") router.push("/dashboard/chat");
                            else setActiveTab(item.id);
                        }}
                        className={`p-3 rounded-2xl transition-all ${item.special ? "bg-[#526E48] text-white scale-110 -translate-y-2 shadow-lg shadow-[#526E48]/40" : activeTab === item.id ? "text-[#526E48]" : "text-white/40"}`}
                    >
                        <item.icon size={20} fontWeight="900" />
                    </button>
                ))}
            </div>

            {/* ── Main Operations Floor ── */}
            <main className="flex-1 h-screen overflow-y-auto bg-[#FDFDFD] custom-scrollbar flex flex-col p-6 lg:p-10 lg:pt-14 pb-32 lg:pb-10">
                <div className="max-w-6xl mx-auto w-full">
                    <header className="flex justify-between items-center mb-10 lg:mb-16">
                        <div className="max-w-[70%]">
                            <h2 className="text-3xl lg:text-5xl font-black italic tracking-tighter text-black leading-none uppercase truncate">
                                Hello, <span className="text-[#526E48]">{user?.name?.split(' ')[0] || "User"}</span>
                            </h2>
                            <p className="text-[8px] lg:text-[10px] font-bold text-zinc-300 uppercase tracking-[0.4em] mt-3 italic">Car Management Hub</p>
                        </div>
                        <div className="flex items-center gap-3 lg:gap-6">
                            <button onClick={handleLogout} className="lg:hidden w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shadow-sm text-red-500">
                                <LogOut size={18} />
                            </button>
                            <button onClick={() => queryClient.invalidateQueries()} className="hidden lg:flex w-14 h-14 rounded-2xl bg-white border border-black/5 items-center justify-center shadow-sm hover:shadow-xl hover:border-[#526E48]/20 transition-all text-zinc-300 hover:text-[#526E48]">
                                <RefreshCw size={20} />
                            </button>
                            <div className="relative cursor-pointer">
                                <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-white border border-black/5 flex items-center justify-center shadow-sm hover:shadow-xl transition-all">
                                    <Bell size={18} className="text-black" />
                                    <div className="absolute top-0 right-0 w-2.5 h-2.5 lg:w-3 lg:h-3 bg-[#526E48] rounded-full border-4 border-[#FDFDFD]" />
                                </div>
                            </div>
                        </div>
                    </header>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderView()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(82,110,72,0.1); border-radius: 10px; }
                ::-webkit-scrollbar { display: none; }
                body { background: #FDFDFD !important; color: black !important; }
            `}</style>
        </div>
    );
}
