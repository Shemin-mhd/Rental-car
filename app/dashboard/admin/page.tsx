"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/services/api";
import { io } from "socket.io-client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import TacticalMap from "@/components/tracking/TacticalMap";

export default function AdminDashboard() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("Overview");
    const [openStatusId, setOpenStatusId] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'info' } | null>(null);

    // 🔱 Real-time Synchronization Bridge
    useEffect(() => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";
        const socket = io(API_URL, { transports: ["websocket"] });

        socket.on("connect", () => socket.emit("join", "admin-channel"));
        socket.on("newBookingSubmitted", () => {
            queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
            queryClient.invalidateQueries({ queryKey: ["adminStats"] });
        });

        return () => { socket.disconnect(); };
    }, [queryClient]);

    // 🔱 Sovereign Data Streams (Queries)
    const { data: stats = {}, isLoading: statsLoading } = useQuery({
        queryKey: ["adminStats"],
        queryFn: async () => {
            const res = await apiFetch("/dashboard/admin");
            const data = await res.json();
            return data.stats || {};
        }
    });

    const { data: users = [], isLoading: usersLoading } = useQuery({
        queryKey: ["adminUsers"],
        queryFn: async () => {
            const res = await apiFetch("/dashboard/admin/users");
            return res.json();
        }
    });

    const { data: cars = [], isLoading: carsLoading } = useQuery({
        queryKey: ["adminCars"],
        queryFn: async () => {
            const res = await apiFetch("/dashboard/admin/cars");
            return res.json();
        }
    });

    const { data: allBookings = [], isLoading: bookingsLoading } = useQuery({
        queryKey: ["adminBookings"],
        queryFn: async () => {
            const res = await apiFetch("/dashboard/admin/bookings");
            return res.json();
        }
    });

    // 🔱 Operational Handlers (Mutations)
    const verifyUserMutation = useMutation({
        mutationFn: async ({ id, status, reason }: any) => {
            const res = await apiFetch(`/dashboard/admin/verify-user/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, rejectionReason: reason })
            });
            return res.json();
        },
        onSuccess: (data) => {
            setNotification({ msg: data.message || "User status updated", type: 'success' });
            queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
            queryClient.invalidateQueries({ queryKey: ["adminStats"] });
            setTimeout(() => setNotification(null), 3000);
        }
    });

    const verifyVehicleMutation = useMutation({
        mutationFn: async ({ id, status, reason }: any) => {
            const res = await apiFetch(`/dashboard/admin/verify-vehicle/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, rejectionReason: reason })
            });
            return res.json();
        },
        onSuccess: (data) => {
            setNotification({ msg: data.message || "Vehicle status updated", type: 'success' });
            queryClient.invalidateQueries({ queryKey: ["adminCars"] });
            queryClient.invalidateQueries({ queryKey: ["adminStats"] });
            setTimeout(() => setNotification(null), 3000);
        }
    });

    const deleteUserMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await apiFetch(`/dashboard/admin/users/${id}`, { method: "DELETE" });
            return res.json();
        },
        onSuccess: (data) => {
            setNotification({ msg: data.message || "User removed", type: 'success' });
            queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
            queryClient.invalidateQueries({ queryKey: ["adminStats"] });
        }
    });

    const deleteCarMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await apiFetch(`/dashboard/admin/cars/${id}`, { method: "DELETE" });
            return res.json();
        },
        onSuccess: (data) => {
            setNotification({ msg: data.message || "Vehicle deleted", type: 'success' });
            queryClient.invalidateQueries({ queryKey: ["adminCars"] });
            queryClient.invalidateQueries({ queryKey: ["adminStats"] });
        }
    });

    const toggleBlockMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await apiFetch(`/dashboard/admin/users/${id}/block`, { method: "PATCH" });
            return res.json();
        },
        onSuccess: (data) => {
            setNotification({ msg: data.message, type: 'success' });
            queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
        }
    });

    const updateBookingStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const res = await apiFetch(`/dashboard/admin/bookings/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            return res.json();
        },
        onSuccess: () => {
            setNotification({ msg: "Status overridden", type: 'success' });
            queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
        }
    });

    const deleteBookingMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await apiFetch(`/bookings/admin/${id}`, { method: "DELETE" });
            return res.json();
        },
        onSuccess: (data) => {
            setNotification({ msg: data.message || "Booking deleted", type: 'success' });
            queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
            queryClient.invalidateQueries({ queryKey: ["adminStats"] });
        }
    });

    const handleLogout = () => { localStorage.clear(); router.push("/login"); };

    const getFullUrl = (path: string) => {
        if (!path) return "";
        if (path.startsWith("http") || path.startsWith("data:")) return path;
        const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";
        return `${API_URL}/uploads/${path}`;
    };

    const pendingUsers = users.filter((u: any) =>
        (u.verificationStatus === 'PENDING' || u.status === 'PENDING') && (u.licenseFrontUrl || u.licenseBackUrl)
    );
    const pendingVehicles = cars.filter((c: any) => c.status === 'PENDING' && (c.image || c.images?.length > 0));
    const pendingCount = pendingUsers.length + pendingVehicles.length;

    if (statsLoading || usersLoading || carsLoading || bookingsLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center font-sans">
                <div className="w-12 h-12 border-4 border-[#526E48]/20 border-t-[#526E48] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 text-black font-sans flex">

            {/* ── Sidebar ── */}
            <aside className="w-64 bg-white border-r border-black/5 flex flex-col p-8 sticky top-0 h-screen">
                <div className="flex items-center gap-2 mb-12">
                    <div className="bg-[#526E48] px-2 py-0.5 rounded text-[10px] text-white font-black italic -skew-x-12">RG</div>
                    <span className="text-sm font-black tracking-tighter uppercase italic">Rental_<span className="text-[#526E48]">Garage</span></span>
                </div>

                <nav className="flex-1 space-y-2">
                    {["Overview", "Approvals", "Bookings", "Manage Cars", "Users", "Communications"].map((item) => (
                        <button
                            key={item}
                            onClick={() => {
                                if (item === "Communications") {
                                    router.push("/dashboard/chat");
                                } else {
                                    setActiveTab(item);
                                }
                            }}
                            className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === item ? 'bg-[#526E48] text-white shadow-lg shadow-[#526E48]/20' : 'text-zinc-400 hover:bg-zinc-100 hover:text-black'}`}
                        >
                            {item} {(item === 'Approvals' && pendingCount > 0) && (
                                <span className="ml-2 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[7px]">{pendingCount}</span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="pt-8 border-t border-black/5 space-y-2">
                    <Link href="/" className="block w-full text-[9px] font-black uppercase text-center text-[#526E48] py-3 rounded-xl hover:bg-zinc-50 transition-all tracking-widest">Back to Website</Link>
                    <button onClick={handleLogout} className="w-full text-[9px] font-black uppercase text-red-500 py-3 rounded-xl hover:bg-red-50 transition-all tracking-widest">Logout</button>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="flex-1 p-12 overflow-y-auto">
                <h1 className="text-5xl font-black uppercase italic tracking-tighter mb-16">{activeTab} <span className="text-[#526E48]">Panel.</span></h1>

                {activeTab === "Overview" && (
                    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                        {/* 🔱 Tactical Fleet Overview */}
                        <div className="h-[500px] w-full relative">
                            <TacticalMap />
                        </div>

                        <div className="bg-white p-10 rounded-[3rem] border border-black/5 shadow-2xl overflow-hidden relative group">
                            <div className="flex justify-between items-center mb-10 relative z-10">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-2">Revenue Velocity // 180D History</h4>
                                    <h3 className="text-3xl font-black italic tracking-tighter">₹{stats.revenue?.toLocaleString()} <span className="text-[10px] font-bold text-[#526E48] tracking-widest ml-4">+12.5% TRAJECTORY</span></h3>
                                </div>
                            </div>
                            <div className="h-64 w-full relative">
                                <svg className="w-full h-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#526E48" stopOpacity="0.2" />
                                            <stop offset="100%" stopColor="#526E48" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    {[0, 50, 100, 150].map(y => <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="black" strokeOpacity="0.03" strokeWidth="1" />)}
                                    {stats.history && (
                                        <>
                                            <path d={`M 0 200 ${stats.history.map((h: any, i: number) => `L ${(i * 200)} ${200 - (h.revenue / (Math.max(...stats.history.map((x: any) => x.revenue)) || 1) * 150)}`).join(' ')} L 1000 200 Z`} fill="url(#lineGrad)" />
                                            <path d={`M 0 ${200 - (stats.history[0]?.revenue / (Math.max(...stats.history.map((x: any) => x.revenue)) || 1) * 150)} ${stats.history.map((h: any, i: number) => `L ${(i * 200)} ${200 - (h.revenue / (Math.max(...stats.history.map((x: any) => x.revenue)) || 1) * 150)}`).join(' ')}`} fill="none" stroke="#526E48" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                            {stats.history.map((h: any, i: number) => (
                                                <g key={i}>
                                                    <circle cx={i * 200} cy={200 - (h.revenue / (Math.max(...stats.history.map((x: any) => x.revenue)) || 1) * 150)} r="4" fill="white" stroke="#526E48" strokeWidth="2" />
                                                    <text x={i * 200} y="195" textAnchor="middle" className="text-[8px] font-black fill-zinc-300 uppercase italic">{h.month}</text>
                                                </g>
                                            ))}
                                        </>
                                    )}
                                </svg>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm group">
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-4">Commanders</p>
                                <h3 className="text-3xl font-black italic">{stats.hosts || 0}</h3>
                            </div>
                            <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm group">
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-4">Elite Fleet</p>
                                <h3 className="text-3xl font-black italic">{stats.fleet || 0}</h3>
                            </div>
                            <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm group">
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-4">Platform Yield</p>
                                <h3 className="text-3xl font-black italic">₹{stats.avgYield?.toLocaleString()}</h3>
                            </div>
                            <div className={`p-8 rounded-[2.5rem] border transition-all ${stats.totalPending > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-black/5'}`}>
                                <p className="text-[9px] font-black uppercase tracking-widest mb-4">Action Pipeline</p>
                                <h3 className="text-4xl font-black italic">{stats.totalPending || 0}</h3>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "Approvals" && (
                    <div className="space-y-16">
                        <section>
                            <h2 className="text-xl font-black uppercase italic mb-8 border-b pb-4">Document(Rent) <span className="text-[#526E48] ml-2">({pendingUsers.length})</span></h2>
                            {pendingUsers.length === 0 ? <p className="text-zinc-300 italic text-[10px] uppercase font-bold tracking-widest text-center py-20">No pending rental documents.</p> : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {pendingUsers.map(u => (
                                        <div key={u._id} className="bg-white p-8 rounded-[3rem] border border-black/5 shadow-sm space-y-6">
                                            <div>
                                                <p className="text-xs font-black uppercase italic text-[#526E48]">{u.name}</p>
                                                <p className="text-[9px] font-bold text-zinc-400">{u.email}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                {['licenseFrontUrl', 'licenseBackUrl'].map((field, idx) => (
                                                    <div key={field} className="space-y-1">
                                                        <p className="text-[7px] font-bold uppercase tracking-widest text-zinc-400">{idx === 0 ? "Front" : "Back"}</p>
                                                        <div className="aspect-video bg-zinc-50 rounded-lg overflow-hidden border border-black/5">
                                                            {u[field] ? <img src={getFullUrl(u[field])} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center opacity-10">N/A</div>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-4">
                                                <button onClick={() => verifyUserMutation.mutate({ id: u._id, status: 'APPROVED' })} className="flex-1 bg-black text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#526E48] transition-all disabled:opacity-50" disabled={verifyUserMutation.isPending}>Authorize</button>
                                                <button onClick={() => verifyUserMutation.mutate({ id: u._id, status: 'REJECTED', reason: prompt("Reason for denial?") })} className="flex-1 border border-black/10 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-red-500 disabled:opacity-50" disabled={verifyUserMutation.isPending}>Deny</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section>
                            <h2 className="text-xl font-black uppercase italic mb-8 border-b pb-4">Document(Host) <span className="text-[#526E48] ml-2">({pendingVehicles.length})</span></h2>
                            {pendingVehicles.length === 0 ? <p className="text-zinc-300 italic text-[10px] uppercase font-bold tracking-widest text-center py-20">No assets awaiting documentation.</p> : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {pendingVehicles.map(v => (
                                        <div key={v._id} className="bg-white p-8 rounded-[3rem] border border-black/5 shadow-sm space-y-6">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-xs font-black uppercase italic text-[#526E48]">{v.name}</p>
                                                    <p className="text-[9px] font-bold text-zinc-400">Host: {v.ownerId?.name}</p>
                                                </div>
                                                <Image src={getFullUrl(v.image || v.images?.[0])} width={48} height={48} className="rounded-xl object-cover" alt="Car" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                {['rcFrontUrl', 'rcBackUrl'].map((field, idx) => (
                                                    <div key={field} className="space-y-1">
                                                        <p className="text-[7px] font-bold uppercase tracking-widest text-zinc-400">RC {idx === 0 ? "Front" : "Back"}</p>
                                                        <div className="aspect-video bg-zinc-50 rounded-lg overflow-hidden border border-black/5">
                                                            {v[field] ? <img src={getFullUrl(v[field])} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center opacity-10">N/A</div>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-4">
                                                <button onClick={() => verifyVehicleMutation.mutate({ id: v._id, status: 'APPROVED' })} className="flex-1 bg-[#526E48] text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-[#526E48]/20 disabled:opacity-50" disabled={verifyVehicleMutation.isPending}>Commission</button>
                                                <button onClick={() => verifyVehicleMutation.mutate({ id: v._id, status: 'REJECTED', reason: prompt("Reason?") })} className="flex-1 border border-black/10 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-red-500 disabled:opacity-50" disabled={verifyVehicleMutation.isPending}>Reject</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {activeTab === "Bookings" && (
                    <div className="bg-white border border-black/5 rounded-[2.5rem] overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-zinc-50 border-b border-black/5">
                                <tr>
                                    {["Commander", "Asset", "Status", "Yield", "Actions"].map(h => <th key={h} className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-zinc-400">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {allBookings.map(b => (
                                    <tr key={b._id} className="hover:bg-zinc-50 transition-all group">
                                        <td className="px-8 py-6 text-[11px] font-black uppercase italic">{b.fullName || b.userId?.name || "Guest"}</td>
                                        <td className="px-8 py-6 text-[10px] font-black uppercase text-[#526E48] italic">{b.carId?.name || "Fleet Asset"}</td>
                                        <td className="px-8 py-6">
                                            <div className="relative">
                                                <button
                                                    onClick={() => setOpenStatusId(openStatusId === b._id ? null : b._id)}
                                                    className={`w-40 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-between px-4 transition-all shadow-lg active:scale-95 ${b.status === 'Confirmed' ? 'bg-[#526E48] text-white shadow-[#526E48]/20' :
                                                        b.status === 'Pending' ? 'bg-amber-400 text-amber-950 shadow-amber-400/20' :
                                                            b.status === 'Completed' ? 'bg-zinc-900 text-white shadow-zinc-900/20' :
                                                                'bg-red-500 text-white shadow-red-500/20'
                                                        }`}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${b.status === 'Pending' ? 'bg-amber-600 animate-pulse' : 'bg-white/50'}`} />
                                                        {b.status}
                                                    </span>
                                                    <svg className={`w-2.5 h-2.5 transition-transform ${openStatusId === b._id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7" /></svg>
                                                </button>

                                                <AnimatePresence>
                                                    {openStatusId === b._id && (
                                                        <>
                                                            <div className="fixed inset-0 z-[60]" onClick={() => setOpenStatusId(null)} />
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                                className="absolute left-0 mt-2 w-48 bg-white border border-black/5 shadow-2xl rounded-2xl p-2 z-[70] backdrop-blur-xl"
                                                            >
                                                                {["Pending", "Confirmed", "Completed", "Cancelled"].map(s => (
                                                                    <button
                                                                        key={s}
                                                                        onClick={() => {
                                                                            updateBookingStatusMutation.mutate({ id: b._id, status: s });
                                                                            setOpenStatusId(null);
                                                                        }}
                                                                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-zinc-50 transition-all flex items-center justify-between group"
                                                                    >
                                                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-black">{s}</span>
                                                                        {b.status === s && <div className="w-1.5 h-1.5 rounded-full bg-[#526E48]" />}
                                                                    </button>
                                                                ))}
                                                            </motion.div>
                                                        </>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-[11px] font-black italic">₹{b.totalPrice?.toLocaleString()}</td>
                                        <td className="px-8 py-6 text-right">
                                            <button onClick={() => deleteBookingMutation.mutate(b._id)} className="opacity-0 group-hover:opacity-100 text-[8px] font-black uppercase text-red-400 hover:text-red-600 tracking-widest transition-all">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === "Manage Cars" && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {cars.map(c => (
                            <div key={c._id} className="bg-white p-6 rounded-[2.5rem] border border-black/5 space-y-4 group hover:shadow-xl transition-all">
                                <div className="h-40 rounded-3xl overflow-hidden relative">
                                    <img src={getFullUrl(c.image || c.images?.[0])} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Car" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase italic text-[#526E48]">{c.name}</p>
                                    <div className="flex justify-between items-center mt-4">
                                        <p className="text-[7px] font-bold text-zinc-300 uppercase tracking-widest">{c.status}</p>
                                        <button onClick={() => deleteCarMutation.mutate(c._id)} className="text-[8px] font-black uppercase text-red-300 hover:text-red-600 transition-all">Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === "Users" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {users.filter((u: any) => u.role !== 'admin').map((u: any) => (
                            <div key={u._id} className={`${u.isBlocked ? 'bg-red-50' : 'bg-white'} p-8 rounded-[3rem] border border-black/5 flex flex-col gap-6 hover:shadow-xl transition-all relative overflow-hidden`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black ${u.isBlocked ? 'bg-red-100 text-red-700' : 'bg-zinc-100 text-[#526E48]'}`}>{u.name?.charAt(0)}</div>
                                    <div>
                                        <p className="text-[12px] font-black uppercase italic leading-none mb-1">{u.name}</p>
                                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{u.role}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => toggleBlockMutation.mutate(u._id)} className={`flex-[2] py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${u.isBlocked ? 'bg-green-600 text-white' : 'bg-zinc-900 text-white'}`}>
                                        {u.isBlocked ? "Unblock" : `Block ${u.role?.toLowerCase() === 'customer' ? 'Host' : 'User'}`}
                                    </button>
                                    <button onClick={() => deleteUserMutation.mutate(u._id)} className="flex-1 py-3 rounded-xl border border-red-100 text-red-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* 🔱 Global Notifications */}
            <AnimatePresence>
                {notification && (
                    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-12 right-12 z-[100]">
                        <div className={`px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 ${notification.type === 'success' ? 'bg-zinc-900 text-white' : 'bg-white text-red-600 border border-red-50'}`}>
                            <div className="w-2 h-2 rounded-full bg-[#526E48] animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-widest italic">{notification.msg}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
