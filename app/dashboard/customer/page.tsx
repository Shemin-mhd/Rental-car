"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch, getImageUrl } from "@/services/api";
import Image from "next/image";
import Link from "next/link";
import {
    Bell,
    Search,
    Calendar,
    ChevronRight,
    Plus,
    Activity,
    UserCircle,
    ShieldCheck,
    LayoutDashboard,
    TrendingUp,
    LogOut,
    RefreshCw,
    Settings,
    Map as MapIcon,
    Circle,
    Clock,
    DollarSign,
    Menu,
    MessageSquare,
    Navigation,
    Edit
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/components/providers/ChatSocketProvider";
import TacticalMap from "@/components/tracking/TacticalMap";

export default function HostDashboard() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("dashboard");
    const [activeTracking, setActiveTracking] = useState<string | null>(null);
    const trackingInterval = useRef<Record<string, number>>({});

    const handleStartTracking = (carId: string, carName: string) => {
        console.log("🔱 Tactical Click Detected for:", carName);
        const socket = getSocket();

        if (!socket) {
            alert("📡 SOCKET ERROR: Connection to orbital server lost. Refresh the page.");
            return;
        }

        if (activeTracking === carId) {
            if (trackingInterval.current[carId]) {
                navigator.geolocation.clearWatch(trackingInterval.current[carId]);
                delete trackingInterval.current[carId];
            }
            setActiveTracking(null);
            alert("🛑 UPLINK DISCONNECTED");
            return;
        }

        // 🛰️ Initialization Pulse
        alert(`🛰️ INITIALIZING UPLINK: Starting tracking for ${carName}. Please click 'ALLOW' on the browser prompt.`);

        if (!navigator.geolocation) {
            alert("❌ HARDWARE ERROR: No GPS sensor found.");
            return;
        }

        setActiveTracking(carId);
        setActiveTab("telemetry"); // 🔱 Auto-Navigation to Radar View
        
        // 🚀 "Jump-Start" Pulse: Send immediate location without waiting for movement
        navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude } = pos.coords;
            socket.emit("update-car-location", {
                carId,
                carName,
                lat: latitude,
                lng: longitude
            });
        });

        const watchId = navigator.geolocation.watchPosition((pos) => {
            const { latitude, longitude } = pos.coords;
            console.log(`📍 TRANSMITTING: ${latitude}, ${longitude}`);
            socket.emit("update-car-location", {
                carId,
                carName,
                lat: latitude,
                lng: longitude
            });
        }, (err) => {
            console.error("TELEMETRY_ERROR_CODE:", err.code);
            console.error("TELEMETRY_ERROR_MSG:", err.message);

            let tacticalAdvice = "Ensure location is enabled in system settings.";
            if (err.code === 1) tacticalAdvice = "ACCESS DENIED: Please click the lock icon 🔒 next to the website URL and change Location to 'Allow'.";
            if (err.code === 2) tacticalAdvice = "SIGNAL LOST: GPS satellite connection failed. Try moving to an open area.";
            if (err.code === 3) tacticalAdvice = "TIMEOUT: Satellite handshake took too long.";

            alert(`⚠️ SIGNAL FAILURE: ${err.message || "Unknown Interference"}\n\n🔱 TACTICAL ADVICE: ${tacticalAdvice}`);
            setActiveTracking(null);
        }, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });

        trackingInterval.current[carId] = watchId;
    };

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

    const cars = Array.isArray(rawCars) ? rawCars : [];

    const handleLogout = () => { localStorage.clear(); router.push("/login"); };

    const deleteCarMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await apiFetch(`/cars/${id}`, { method: "DELETE" });
            return res.json();
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customerCars"] })
    });

    const toggleAvailableMutation = useMutation({
        mutationFn: async ({ id, isAvailable }: { id: string; isAvailable: boolean }) => {
            const formData = new FormData();
            formData.append("isAvailable", String(isAvailable));
            const res = await apiFetch(`/cars/${id}`, {
                method: "PATCH",
                body: formData
            });
            return res.json();
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customerCars"] })
    });

    if (dashboardLoading || carsLoading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#14532d] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const stats = dashboardData?.stats || {
        revenue: 0,
        bookings: 0,
        fleetCount: 0,
        activeNodes: 0,
        avgYield: 0
    };

    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : null;
    const utilization = stats.fleetCount > 0 ? Math.round((stats.activeNodes / stats.fleetCount) * 100) : 0;

    // ── Internal View Switcher ──
    const renderView = () => {
        switch (activeTab) {
            case "dashboard":
                return (
                    <div className="space-y-6">
                        {/* ── Monthly Revenue Card ── */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-[2rem] border border-[#14532d]/5 shadow-[0_10px_40px_rgba(0,0,0,0.03)] group hover:shadow-xl transition-all duration-500">
                            <div className="flex justify-between items-start mb-6">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#14532d] italic">Monthly Revenue</p>
                                <span className="bg-[#14532d]/10 text-[#14532d] px-3 py-1 rounded-full text-[9px] font-black italic">+12.4%</span>
                            </div>
                            <div className="flex items-end justify-between">
                                <h3 className="text-5xl font-black italic tracking-tighter text-black">₹{(stats.revenue || 0).toLocaleString()}</h3>
                                <div className="flex items-end gap-1.5 h-12">
                                    {[20, 50, 35, 80, 60, 100].map((h, i) => (
                                        <div key={i} className={`w-4 rounded-sm transition-all duration-1000 ${i === 5 ? "bg-[#14532d]" : "bg-[#14532d]/20 group-hover:bg-[#14532d]/40"}`} style={{ height: `${h}%` }} />
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* ── Fleet Utilization Card ── */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-8 rounded-[2rem] border border-[#14532d]/5 shadow-[0_10px_40px_rgba(0,0,0,0.03)] flex justify-between items-center group">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#14532d] mb-4 italic">Fleet Utilization</p>
                                <h3 className="text-5xl font-black italic tracking-tighter text-black mb-1">{utilization}%</h3>
                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest italic">{stats.activeNodes}/{stats.fleetCount} cars active</p>
                            </div>
                            <div className="relative w-24 h-24 shrink-0">
                                <svg className="w-full h-full -rotate-90">
                                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-zinc-50" />
                                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={251} strokeDashoffset={251 * (1 - utilization / 100)} className="text-[#14532d] transition-all duration-1000" strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Activity className="text-[#14532d]/20" size={24} />
                                </div>
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-[#14532d]/5 shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#14532d] mb-4 italic">Next Payout</p>
                                <h3 className="text-3xl font-black italic tracking-tighter text-black mb-4">₹{(stats.revenue / 4).toLocaleString()}</h3>
                                <div className="flex items-center gap-3 text-zinc-400">
                                    <Calendar size={14} className="text-[#14532d]" />
                                    <p className="text-[9px] font-black uppercase tracking-widest italic tracking-tighter">Scheduled: June 24th</p>
                                </div>
                            </div>
                            <div className="bg-[#14532d] p-8 rounded-[2.5rem] shadow-xl text-white">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-4 italic">Average Yield</p>
                                <h3 className="text-3xl font-black italic tracking-tighter mb-4">₹{(stats.avgYield || 0).toLocaleString()}</h3>
                                <div className="flex items-center gap-3">
                                    <TrendingUp size={14} className="opacity-40" />
                                    <p className="text-[9px] font-black uppercase tracking-widest italic opacity-40 tracking-tighter">Per Protocol Transaction</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity Mini-log */}
                        <div className="bg-white rounded-[2.5rem] border border-[#14532d]/5 p-8 shadow-sm">
                            <h3 className="text-xl font-black italic uppercase text-black mb-6">Recent Fleet Logs</h3>
                            <div className="space-y-4">
                                {dashboardData?.recentBookings?.map((b: any) => (
                                    <div key={b._id} className="flex items-center justify-between py-3 border-b border-[#14532d]/5">
                                        <div>
                                            <p className="text-[11px] font-black uppercase text-black italic leading-none mb-1">{b.carId?.name}</p>
                                            <p className="text-[8px] font-bold text-zinc-300 uppercase italic">Deployed by {b.fullName || user.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[11px] font-black text-[#14532d]">₹{b.totalPrice.toLocaleString()}</p>
                                            <p className="text-[7px] font-bold text-zinc-300 uppercase italic">Confirmed</p>
                                        </div>
                                    </div>
                                ))}
                                {(!dashboardData?.recentBookings || dashboardData.recentBookings.length === 0) && (
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 italic py-10 text-center">No recent activity detected.</p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case "analytics":
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <section className="bg-white p-8 rounded-[2.5rem] border border-[#14532d]/5 shadow-sm">
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">Yield Velocity</h2>
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1 italic">Historical Revenue Signal Protocol</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[40px] font-black italic tracking-tighter text-black leading-none">₹{stats.revenue.toLocaleString()}</p>
                                    <span className="text-[10px] font-black text-[#14532d] italic">TOTAL_ACCUMULATED_YIELD</span>
                                </div>
                            </div>

                            <div className="h-64 flex items-end justify-between gap-4 px-4">
                                {dashboardData?.history?.map((h: any, i: number) => {
                                    const maxRev = Math.max(...dashboardData.history.map((x: any) => x.revenue)) || 1;
                                    const height = (h.revenue / maxRev) * 100;
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-4">
                                            <div className="w-full relative group">
                                                <div className="bg-[#14532d]/10 w-full rounded-2xl transition-all duration-700 h-0 group-hover:bg-[#14532d]/20" style={{ height: `100%`, position: 'absolute', bottom: 0 }} />
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${height}%` }}
                                                    transition={{ delay: i * 0.1, duration: 1 }}
                                                    className="bg-[#14532d] w-full rounded-2xl relative z-10"
                                                />
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[8px] font-black px-2 py-1 rounded-md uppercase">
                                                    ₹{h.revenue}
                                                </div>
                                            </div>
                                            <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest italic">{h.month}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-[#14532d]/5 shadow-sm">
                                <h3 className="text-[10px] font-black uppercase text-[#14532d] mb-4 italic">Performance Meta</h3>
                                <div className="space-y-4">
                                    {[
                                        { label: "Fleet Resilience", val: "94%" },
                                        { label: "Avg. Deployment Time", val: "3.4 Days" },
                                        { label: "Node Health Index", val: "EXCELLENT" }
                                    ].map((item, i) => (
                                        <div key={i} className="flex justify-between items-center py-2 border-b border-[#14532d]/5">
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase italic tracking-widest">{item.label}</p>
                                            <p className="text-[11px] font-black italic uppercase text-black">{item.val}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-[2.5rem] border border-[#14532d]/5 shadow-sm">
                                <h3 className="text-[10px] font-black uppercase text-[#14532d] mb-4 italic">Yield Forecast</h3>
                                <div className="space-y-4">
                                    <p className="text-[11px] font-black italic text-black leading-relaxed">System projects a <span className="text-[#14532d]">15.2%</span> increase in fleet demand over the next 30 days due to operational scaling.</p>
                                    <button className="text-[8px] font-black bg-[#14532d] text-white px-4 py-2 rounded-lg uppercase tracking-widest italic">Request Full Audit</button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            case "registry":
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <section className="bg-white rounded-[2.5rem] border border-[#14532d]/5 shadow-sm overflow-hidden">
                            <div className="px-8 py-8">
                                <div className="flex justify-between items-center mb-10">
                                    <div>
                                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-black leading-none">Fleet Manager</h3>
                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1 italic">Total Inventory Density: {cars.length}</p>
                                    </div>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                                        <input type="text" placeholder="Search cars..." className="bg-[#FAFAFA] border border-black/[0.03] rounded-2xl pl-12 pr-6 py-3.5 text-xs font-bold italic text-black outline-none focus:border-[#14532d]/20 transition-all shadow-inner w-64" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="grid grid-cols-12 px-4 py-2 text-[9px] font-black uppercase tracking-[0.3em] text-[#14532d] opacity-40 italic">
                                        <div className="col-span-6">Asset Signature</div>
                                        <div className="col-span-3">Sync ID</div>
                                        <div className="col-span-3 text-right">Status</div>
                                    </div>
                                    <div className="divide-y divide-[#14532d]/5">
                                        {cars.map((car: any) => (
                                            <div key={car._id} className="grid grid-cols-12 items-center px-4 py-6 group hover:bg-[#FAFAFA] rounded-2xl transition-all cursor-pointer">
                                                <div className="col-span-6 flex items-center gap-5">
                                                    <div className="relative w-16 h-10 rounded-xl overflow-hidden border border-[#14532d]/5 bg-zinc-50 shadow-sm group-hover:scale-110 transition-transform">
                                                        <Image src={getImageUrl(car.image)} alt="Asset" fill className="object-cover" unoptimized />
                                                    </div>
                                                    <div>
                                                        <p className="text-[14px] font-black italic uppercase text-black leading-none mb-1">{car.name}</p>
                                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic leading-none">{car.model}</p>
                                                    </div>
                                                </div>
                                                <div className="col-span-3">
                                                    <p className="text-[11px] font-black text-zinc-600 tracking-tighter uppercase whitespace-break-spaces italic">NODE_{car._id.slice(-6).toUpperCase()}</p>
                                                </div>
                                                <div className="col-span-3 text-right flex items-center justify-end gap-3">
                                                    {car.status === "PENDING" || car.status === "REJECTED" ? (
                                                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest italic transition-all ${car.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${car.status === 'PENDING' ? 'bg-amber-400 animate-pulse' : 'bg-red-500'}`} />
                                                            {car.status === 'PENDING' ? 'Pending Approval' : 'Rejected'}
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <span className="inline-flex items-center px-2 py-1 rounded text-[7px] font-black uppercase tracking-widest italic bg-green-50 text-[#14532d] border border-[#14532d]/20">
                                                                Approved
                                                            </span>
                                                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest italic transition-all ${!car.isAvailable ? "bg-[#14532d] text-white" : "bg-zinc-100 text-zinc-400"}`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full ${!car.isAvailable ? "bg-green-300 animate-pulse" : "bg-zinc-300"}`} />
                                                                {!car.isAvailable ? "Deployed" : "Idle Node"}
                                                            </span>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); toggleAvailableMutation.mutate({ id: car._id, isAvailable: !car.isAvailable }) }}
                                                                disabled={toggleAvailableMutation.isPending}
                                                                className={`px-3 py-2 rounded-lg transition-colors text-[8px] font-black uppercase tracking-widest italic ${car.isAvailable ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-[#14532d]/10 text-[#14532d] hover:bg-[#14532d]/20"}`}
                                                            >
                                                                {car.isAvailable ? "Deactivate" : "Activate"}
                                                            </button>

                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleStartTracking(car._id, car.name); }}
                                                                className={`px-3 py-2 rounded-lg transition-all text-[8px] font-black uppercase tracking-widest italic flex items-center gap-2 ${activeTracking === car._id ? "bg-red-500 text-white animate-pulse" : "bg-[#14532d] text-white"}`}
                                                            >
                                                                <Navigation size={10} />
                                                                {activeTracking === car._id ? "SIGNALING..." : "LIVE UPLINK"}
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Cancellation Button */}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); if (window.confirm('Are you sure you want to cancel and delete this asset?')) deleteCarMutation.mutate(car._id) }}
                                                        disabled={deleteCarMutation.isPending}
                                                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-zinc-300 hover:text-red-500"
                                                        title="Cancel Asset"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>

                                                    <Link href={`/dashboard/customer/edit-car/${car._id}`} className="p-2 hover:bg-[#14532d]/10 rounded-lg transition-colors text-zinc-300 hover:text-[#14532d]" onClick={(e) => e.stopPropagation()}>
                                                        <Settings size={14} />
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </motion.div>
                );
            case "telemetry":
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-140px)] w-full">
                        <TacticalMap />
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-black font-sans flex overflow-hidden">
            {/* ── Fixed Sidebar ── */}
            <aside className="hidden lg:flex w-64 bg-white border-r border-[#14532d]/10 flex-col p-6 z-50">
                <div className="flex items-center gap-3 mb-10 px-2 group cursor-pointer" onClick={() => router.push("/")}>
                    <div className="bg-[#14532d] w-8 h-8 rounded-lg flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12">
                        <Activity className="text-white" size={16} />
                    </div>
                    <div>
                        <h1 className="text-[14px] font-black italic uppercase tracking-tighter text-black">Elite_Garage</h1>
                        <p className="text-[7px] font-bold text-[#14532d] uppercase tracking-[0.3em] leading-none">Command Center</p>
                    </div>
                </div>

                <nav className="flex flex-col gap-1.5">
                    {[
                        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
                        { id: "verify", label: "Verification", icon: ShieldCheck },
                        { id: "chat", label: "Messages", icon: MessageSquare },
                        { id: "analytics", label: "Analytics", icon: TrendingUp },
                        { id: "registry", label: "Fleet Manager", icon: Menu },
                        { id: "telemetry", label: "Live Tracking", icon: MapIcon },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (item.id === "verify") router.push("/dashboard/customer/verify");
                                else if (item.id === "chat") router.push("/dashboard/chat");
                                else setActiveTab(item.id);
                            }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === item.id ? "bg-[#14532d] text-white shadow-xl shadow-[#14532d]/20" : "text-zinc-400 hover:text-[#14532d] hover:bg-[#14532d]/5"}`}
                        >
                            <item.icon size={14} /> {item.label}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto pt-6 border-t border-[#14532d]/10 space-y-3">
                    <Link href="/dashboard/customer/add-car" className="w-full bg-[#14532d] text-white py-3.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-2xl hover:scale-[1.02] transition-all italic tracking-tighter">
                        <Plus size={14} /> NEW CAR
                    </Link>
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-zinc-400 hover:text-black text-[9px] font-bold uppercase tracking-widest transition-all">
                        <Settings size={14} /> ACCOUNT SETTINGS
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-zinc-400 hover:text-red-500 text-[9px] font-bold uppercase tracking-widest transition-all">
                        <LogOut size={14} /> LOGOUT
                    </button>
                </div>
            </aside>

            {/* ── Main Dashboard ── */}
            <main className="flex-1 h-screen overflow-y-auto custom-scrollbar bg-[#FDFDFD] flex flex-col pt-6 pb-20">

                {/* ── Mobile Style App Header ── */}
                <header className="px-8 flex items-center justify-between mb-8 max-w-4xl mx-auto w-full">
                    <div className="flex items-center gap-4">
                        <button className="lg:hidden w-10 h-10 flex items-center justify-center text-[#14532d]">
                            <Activity size={24} />
                        </button>
                        <div>
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none text-black">
                                Good Morning, <span className="text-[#14532d]">{user?.name?.split(' ')[0] || "Marcus"}</span>
                            </h2>
                            <p className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.4em] mt-1 italic">
                                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </p>
                        </div>
                    </div>

                    <div className="relative group cursor-pointer flex items-center gap-4">
                        <button onClick={() => queryClient.invalidateQueries({ queryKey: ["customerDashboard"] })} className="w-11 h-11 bg-white border border-[#14532d]/5 rounded-full flex items-center justify-center text-zinc-300 hover:text-[#14532d] transition-all">
                            <RefreshCw size={18} />
                        </button>
                        <div className="bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] w-11 h-11 rounded-full flex items-center justify-center border border-[#14532d]/5 transition-all group-hover:bg-[#14532d]/5">
                            <Bell size={18} className="text-[#14532d]" />
                            <div className="absolute top-0 right-0 w-3 h-3 bg-[#14532d] border-2 border-white rounded-full" />
                        </div>
                    </div>
                </header>

                <div className="px-8 max-w-4xl mx-auto w-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {renderView()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* ── Quick Add Floating Pulse ── */}
                <Link href="/dashboard/customer/add-car" className="fixed bottom-10 right-10 bg-[#14532d] text-white w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl hover:scale-110 hover:-rotate-3 transition-all group z-[60]">
                    <Plus size={28} />
                </Link>

            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(20,83,45,0.1); border-radius: 10px; }
                ::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
}
