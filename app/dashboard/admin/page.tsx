"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch, getImageUrl } from "@/services/api";
import {
    LayoutDashboard,
    Car,
    Users,
    ClipboardList,
    Navigation,
    ShieldCheck,
    MessageSquare,
    ChevronDown,
    Activity,
    LogOut,
    Power,
    CheckCircle2,
    XCircle,
    User as UserIcon,
    FileText,
    ExternalLink,
    Zap,
    TrendingUp,
    Briefcase
} from "lucide-react";
import { useRouter } from "next/navigation";

// 🔱 Tactical Design Utility
const getFullUrl = (img: string) => getImageUrl(img);

const StatusSelector = ({ currentStatus, onUpdate }: { currentStatus: string, onUpdate: (s: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const statuses = ['Pending', 'Confirmed', 'arrived', 'active_trip', 'Completed', 'Cancelled'];

    const getTheme = (s: string) => {
        const status = s.toLowerCase();
        if (status === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-200 dot-emerald-500';
        if (status === 'cancelled') return 'bg-red-50 text-red-700 border-red-200 dot-red-500';
        if (status === 'active_trip') return 'bg-blue-50 text-blue-700 border-blue-200 dot-blue-500';
        if (status === 'arrived') return 'bg-orange-50 text-orange-700 border-orange-200 dot-orange-500';
        if (status === 'confirmed') return 'bg-indigo-50 text-indigo-700 border-indigo-200 dot-indigo-500';
        return 'bg-amber-50 text-amber-700 border-amber-200 dot-amber-500';
    };

    const themeClass = getTheme(currentStatus);
    const dotColor = themeClass.split('dot-')[1];

    return (
        <div className="relative inline-block w-40">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full pl-8 pr-4 py-2 rounded-full text-[10px] font-bold border transition-all shadow-sm uppercase flex items-center justify-between ${themeClass.split('dot-')[0]}`}
            >
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full`} style={{
                        backgroundColor:
                            currentStatus === 'Completed' ? '#10b981' :
                                currentStatus === 'Cancelled' ? '#ef4444' :
                                    currentStatus === 'active_trip' ? '#3b82f6' :
                                        currentStatus === 'arrived' ? '#f97316' :
                                            currentStatus === 'Confirmed' ? '#6366f1' : '#f59e0b'
                    }} />
                    {currentStatus}
                </div>
                <ChevronDown size={12} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full mt-2 left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 z-[70] overflow-hidden"
                        >
                            {statuses.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => {
                                        onUpdate(s);
                                        setIsOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-3 group"
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full`}
                                        style={{
                                            backgroundColor: s === 'Completed' ? '#10b981' :
                                                s === 'Cancelled' ? '#ef4444' :
                                                    s === 'active_trip' ? '#3b82f6' :
                                                        s === 'arrived' ? '#f97316' :
                                                            s === 'Confirmed' ? '#6366f1' : '#f59e0b'
                                        }} />
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${s === currentStatus ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                        {s}
                                    </span>
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function TacticalMinimalistCommand() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("Overview");

    // 💰 Dynamic Tactical Auditor: Calculate live fine for active assets (₹100/hr)
    const calculateLiveFine = (booking: any) => {
        if (booking.status !== 'active_trip') return 0;
        const now = new Date();
        const scheduledEnd = new Date(booking.endDate);
        if (now <= scheduledEnd) return 0;

        const diffMs = now.getTime() - scheduledEnd.getTime();
        const diffHrs = Math.ceil(diffMs / (1000 * 3600));
        return diffHrs * 100;
    };

    // ── Data Ingress ──
    const { data: allBookings = [] } = useQuery({
        queryKey: ["adminBookings"],
        queryFn: async () => {
            const res = await apiFetch("/dashboard/admin/bookings");
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        }
    });

    const { data: allCars = [] } = useQuery({
        queryKey: ["adminCars"],
        queryFn: async () => {
            const res = await apiFetch("/dashboard/admin/cars");
            return res.json();
        }
    });

    const { data: users = [] } = useQuery({
        queryKey: ["adminUsers"],
        queryFn: async () => {
            const res = await apiFetch("/dashboard/admin/users");
            return res.json();
        }
    });

    const { data: allChats = [] } = useQuery({
        queryKey: ["adminChats"],
        queryFn: async () => {
            const res = await apiFetch("/chat/admin/all-chats");
            return res.json();
        }
    });

    const { data: pendingUsers = [] } = useQuery({
        queryKey: ["pendingUsers"],
        queryFn: async () => {
            const res = await apiFetch("/dashboard/admin/pending-users");
            return res.json();
        }
    });

    const { data: pendingCars = [] } = useQuery({
        queryKey: ["pendingCars"],
        queryFn: async () => {
            const res = await apiFetch("/dashboard/admin/pending-vehicles");
            return res.json();
        }
    });

    const { data: statsData = {} } = useQuery({
        queryKey: ["adminStats"],
        queryFn: async () => {
            const res = await apiFetch("/dashboard/admin");
            return res.json();
        }
    });

    const stats = statsData.stats || statsData;

    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    // ── Status Styling ──
    const getStatusTheme = (status: string) => {
        const s = status?.toLowerCase();
        if (s === 'completed') return { bg: 'bg-black', text: 'text-white', dot: 'bg-white' };
        if (s === 'pending') return { bg: 'bg-[#F5F5F5]', text: 'text-zinc-400', dot: 'bg-zinc-300' };
        if (s === 'confirmed') return { bg: 'bg-[#526E48]', text: 'text-white', dot: 'bg-white/40' };
        if (s === 'active_trip') return { bg: 'bg-black text-emerald-400 border border-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' };
        if (s === 'arrived') return { bg: 'bg-orange-500', text: 'text-white', dot: 'bg-white' };
        return { bg: 'bg-zinc-100', text: 'text-zinc-500', dot: 'bg-zinc-300' };
    };

    const menuItems = [
        { id: "Overview", icon: LayoutDashboard },
        { id: "Approvals", icon: ShieldCheck, badge: pendingUsers.length + pendingCars.length },
        { id: "Bookings", icon: ClipboardList },
        { id: "Fleet Command", icon: Activity },
        { id: "Manage Cars", icon: Car },
        { id: "Users", icon: Users },
        { id: "Communications", icon: MessageSquare, badge: allChats.length },
    ];

    return (
        <div className="h-screen bg-white text-black flex font-sans overflow-hidden">

            {/* ── Sidebar (Tactical White) ── */}
            <aside className="w-[300px] bg-white border-r border-zinc-100 flex flex-col z-50">
                <div className="p-10 pb-16">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
                        <div className="bg-[#526E48] px-2 py-0.5 rounded text-[10px] text-white font-black italic -skew-x-12">RG</div>
                        <span className="text-sm font-black tracking-widest uppercase italic">Rental_<span className="text-[#526E48]">Garage</span></span>
                    </div>
                </div>

                <nav className="flex-1 px-8 space-y-1">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all ${activeTab === item.id
                                ? "bg-[#526E48] text-white shadow-[0_10px_30px_rgba(82,110,72,0.2)]"
                                : "text-[#A3A3A3] hover:text-black hover:bg-zinc-50"
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <item.icon size={16} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.id}</span>
                            </div>
                            {item.badge > 0 && (
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black ${activeTab === item.id ? "bg-white text-[#526E48]" : "bg-zinc-100 text-zinc-400"}`}>{item.badge}</span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-10 space-y-8">
                    <button className="text-[9px] font-black uppercase tracking-widest text-[#A3A3A3] hover:text-black transition-all">Registry Insight</button>
                    <button onClick={handleLogout} className="w-full text-left text-red-500 text-[10px] font-black uppercase tracking-widest hover:pl-2 transition-all">Logout</button>
                </div>
            </aside>

            {/* ── Operations Floor ── */}
            <main className="flex-1 min-w-0 bg-white p-16 overflow-y-auto h-screen custom-scrollbar relative">
                <header className="mb-16">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#526E48]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 italic">Admin Command Layer</span>
                    </div>
                    <h1 className="text-3xl font-black uppercase italic tracking-widest leading-none text-black">
                        {activeTab} <span className="text-[#526E48]">Control.</span>
                    </h1>
                </header>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* ── OVERVIEW ── */}
                        {activeTab === "Overview" && (
                            <div className="space-y-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                    {[
                                        { label: "Total Yield", val: `₹${(stats.revenue || 0).toLocaleString()}` },
                                        { label: "Fleet Status", val: stats.fleet || 0 },
                                        { label: "Mission Load", val: stats.bookings || 0 },
                                        { label: "Active Agents", val: stats.users || 0 },
                                    ].map((s, i) => (
                                        <div key={i} className="bg-white border border-zinc-100 p-12 rounded-[3.5rem] shadow-sm hover:shadow-xl hover:shadow-zinc-100 transition-all group">
                                            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-[#D4D4D4] mb-8 italic group-hover:text-[#526E48] transition-colors">{s.label}</p>
                                            <h4 className="text-4xl font-black italic tracking-tighter leading-none">{s.val}</h4>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                    <div className="xl:col-span-2 bg-white border border-zinc-100 rounded-[3.5rem] p-12">
                                        <div className="flex items-center justify-between mb-12">
                                            <h3 className="text-xl font-black uppercase italic tracking-tighter">Yield <span className="text-[#526E48]">Analytics</span></h3>
                                            <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Real-time Stream</span>
                                        </div>
                                        <div className="h-[240px] flex items-end gap-4">
                                            {[35, 60, 40, 85, 50, 75, 45, 95, 30, 80, 55, 90].map((h, i) => (
                                                <div key={i} className="flex-1 bg-zinc-50 rounded-2xl relative group overflow-hidden border border-zinc-50 hover:border-[#526E48]/20 transition-all">
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${h}%` }}
                                                        className="absolute bottom-0 left-0 right-0 bg-[#526E48] group-hover:bg-black transition-colors"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-white border border-zinc-100 rounded-[3.5rem] p-12 flex flex-col justify-between shadow-sm">
                                        <div>
                                            <div className="flex justify-between items-start mb-10">
                                                <h3 className="text-xl font-black uppercase italic tracking-tighter text-black">Network <span className="text-[#526E48]">Intel.</span></h3>
                                                <div className="px-3 py-1 bg-[#526E48]/10 rounded-lg text-[8px] font-black text-[#526E48]">PEAK_PERFORMANCE</div>
                                            </div>
                                            <div className="space-y-8">
                                                <div className="flex items-end gap-1.5 h-16">
                                                    {[20, 45, 30, 75, 55, 90, 40, 65].map((h, i) => (
                                                        <div key={i} className="flex-1 bg-zinc-50 rounded-full relative overflow-hidden h-full">
                                                            <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} className="absolute bottom-0 left-0 right-0 bg-[#526E48]/40" />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="space-y-4">
                                                    {[
                                                        { label: 'Uplink Integrity', val: '99.8%' },
                                                        { label: 'Active Coverage', val: '84%' },
                                                        { label: 'Data Latency', val: '12ms' }
                                                    ].map(t => (
                                                        <div key={t.label} className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1 h-1 rounded-full bg-[#526E48]" />
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{t.label}</span>
                                                            </div>
                                                            <span className="text-[9px] font-black italic text-black">{t.val}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <button className="w-full h-16 border border-zinc-100 text-black hover:bg-black hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mt-10">Sync Global Terminal</button>
                                    </div>
                                </div>

                                <div className="mt-10 bg-white border border-zinc-100 rounded-[3.5rem] p-12 shadow-sm">
                                    <h3 className="text-xl font-black uppercase italic tracking-tighter mb-10">Mission <span className="text-[#526E48]">Records</span></h3>
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="h-14 border-b border-zinc-50">
                                                <th className="text-[9px] font-black uppercase tracking-widest text-zinc-300 px-4">Unit_ID</th>
                                                <th className="text-[9px] font-black uppercase tracking-widest text-zinc-300 px-4">Commander</th>
                                                <th className="text-[9px] font-black uppercase tracking-widest text-zinc-300 text-right px-4">Yield</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allBookings.filter((b: any) => b.status === "Completed").sort((a: any, b: any) => new Date(b.actualReturnDate || 0).getTime() - new Date(a.actualReturnDate || 0).getTime()).slice(0, 5).map((b: any) => (
                                                <tr key={b._id} className="h-16 border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-all">
                                                    <td className="px-4 text-[10px] font-black uppercase italic tracking-tighter">{b.carId?.name || "Asset"}</td>
                                                    <td className="px-4 text-[10px] font-black text-zinc-600 italic uppercase">{b.userId?.name || b.fullName}</td>
                                                    <td className="px-4 text-right">
                                                        <span className="text-sm font-black italic tracking-tighter text-black">₹{(b.totalPrice + (b.lateFine || 0)).toLocaleString()}</span>
                                                        {b.lateFine > 0 && <span className="text-[8px] font-black text-red-500 ml-2">(+₹{b.lateFine})</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* ── APPROVALS ── */}
                        {activeTab === "Approvals" && (
                            <div className="space-y-16">
                                <section>
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="w-1.5 h-10 bg-black italic" />
                                        <h2 className="text-3xl font-black uppercase italic tracking-tighter">User License <span className="text-[#526E48]">Registry.</span></h2>
                                    </div>
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                                        {pendingUsers.length > 0 ? pendingUsers.map((u: any) => (
                                            <div key={u._id} className="bg-white border border-zinc-100 rounded-[3rem] p-12 shadow-sm hover:border-black transition-all">
                                                <div className="flex justify-between items-start mb-10">
                                                    <div>
                                                        <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-1">{u.name}</h3>
                                                        <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">{u.email}</p>
                                                    </div>
                                                    <div className="bg-zinc-50 text-black px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-zinc-100">Verification_Req</div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-6 mb-10">
                                                    {[u.licenseFrontUrl, u.licenseBackUrl].map((img, idx) => (
                                                        <div key={idx} className="space-y-3">
                                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-300 italic">{idx === 0 ? 'Front_Spec' : 'Rear_Spec'}</p>
                                                            <div className="aspect-video bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-50 group pointer-events-auto">
                                                                <img src={getFullUrl(img)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 cursor-pointer" onClick={() => window.open(getFullUrl(img), '_blank')} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex gap-4">
                                                    <button
                                                        onClick={async () => {
                                                            await apiFetch(`/dashboard/admin/verify-user/${u._id}`, { method: "PATCH", body: JSON.stringify({ status: "APPROVED" }) });
                                                            queryClient.invalidateQueries({ queryKey: ["pendingUsers"] });
                                                        }}
                                                        className="flex-1 h-16 bg-[#526E48] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all"
                                                    >
                                                        Authorize Agent
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            const reason = prompt("Enter Rejection Reason:");
                                                            if (reason === null) return;
                                                            await apiFetch(`/dashboard/admin/verify-user/${u._id}`, { method: "PATCH", body: JSON.stringify({ status: "REJECTED", rejectionReason: reason }) });
                                                            queryClient.invalidateQueries({ queryKey: ["pendingUsers"] });
                                                        }}
                                                        className="px-8 h-16 border border-zinc-100 text-red-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-50 transition-all font-center flex items-center justify-center font-black"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="col-span-2 py-32 border border-dashed border-zinc-200 rounded-[3.5rem] text-center">
                                                <p className="text-[12px] font-black uppercase tracking-[0.5em] text-zinc-300 italic">No Pending Agents</p>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <section>
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="w-1.5 h-10 bg-[#526E48] italic" />
                                        <h2 className="text-3xl font-black uppercase italic tracking-tighter">Host RC Book <span className="text-[#526E48]">Registry.</span></h2>
                                    </div>
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                                        {pendingCars.length > 0 ? pendingCars.map((car: any) => (
                                            <div key={car._id} className="bg-white border border-zinc-100 rounded-[3rem] p-12 shadow-sm hover:border-[#526E48] transition-all">
                                                <div className="flex justify-between items-start mb-10">
                                                    <div>
                                                        <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-1">{car.name} <span className="text-[#526E48]">[{car.model}]</span></h3>
                                                        <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">HOST: {car.ownerId?.name || "Independent"}</p>
                                                    </div>
                                                    <div className="bg-[#526E48]/10 text-[#526E48] px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-[#526E48]/20 italic">Asset_Audit</div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-6 mb-10">
                                                    {[car.rcFrontUrl, car.rcBackUrl].map((img, idx) => (
                                                        <div key={idx} className="space-y-3">
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-300 italic">{idx === 0 ? 'Document_Front' : 'Document_Rear'}</p>
                                                            <div className="aspect-video bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-50 text-center flex items-center justify-center group pointer-events-auto">
                                                                {img ? (
                                                                    <img src={getFullUrl(img)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 cursor-pointer" onClick={() => window.open(getFullUrl(img), '_blank')} />
                                                                ) : <span className="text-[9px] font-black text-zinc-200 italic">Missing_Fragment</span>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex gap-4">
                                                    <button
                                                        onClick={async () => {
                                                            await apiFetch(`/dashboard/admin/verify-vehicle/${car._id}`, { method: "PATCH", body: JSON.stringify({ status: "APPROVED" }) });
                                                            queryClient.invalidateQueries({ queryKey: ["pendingCars"] });
                                                        }}
                                                        className="flex-1 h-16 bg-[#526E48] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all"
                                                    >
                                                        Deploy Asset
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            const reason = prompt("Enter Rejection Reason:");
                                                            if (reason === null) return;
                                                            await apiFetch(`/dashboard/admin/verify-vehicle/${car._id}`, { method: "PATCH", body: JSON.stringify({ status: "REJECTED", rejectionReason: reason }) });
                                                            queryClient.invalidateQueries({ queryKey: ["pendingCars"] });
                                                        }}
                                                        className="px-8 h-16 border border-zinc-100 text-zinc-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all font-center flex items-center justify-center font-black"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="col-span-2 py-32 bg-zinc-50/50 border border-dashed border-zinc-100 rounded-[3.5rem] text-center">
                                                <p className="text-[12px] font-black uppercase tracking-[0.5em] text-zinc-200 italic">Fleet Integrity Secured</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* ── BOOKINGS ── */}
                        {activeTab === "Bookings" && (
                            <div className="bg-white border border-zinc-100 rounded-[3.5rem] shadow-sm overflow-hidden p-14">
                                <table className="w-full text-left border-separate border-spacing-y-0">
                                    <thead>
                                        <tr className="border-b border-zinc-100 h-20">
                                            <th className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4D4D4] px-4">Commander</th>
                                            <th className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4D4D4] px-4">Asset</th>
                                            <th className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4D4D4] px-4">Schedule</th>
                                            <th className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4D4D4] text-center px-4">Status</th>
                                            <th className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4D4D4] text-right px-4">Yield</th>
                                            <th className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4D4D4] text-right px-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="h-8" />
                                        {allBookings.map((b: any) => {
                                            const theme = getStatusTheme(b.status);
                                            return (
                                                <tr key={b._id} className="h-16 hover:bg-zinc-50/50 transition-all border-b border-zinc-50 last:border-0 group">
                                                    <td className="text-[11px] font-black uppercase italic tracking-tighter leading-none px-4">{b.userId?.name || b.fullName}</td>
                                                    <td className="text-[11px] font-black uppercase italic tracking-tighter text-[#526E48] px-4">{b.carId?.name || "Asset_Unknown"}</td>
                                                    <td className="px-4">
                                                        <div className="text-[10px] font-black uppercase tracking-tighter leading-none whitespace-nowrap">
                                                            {new Date(b.startDate).toLocaleDateString()} <span className="text-zinc-300 font-normal">@</span> {new Date(b.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            <span className="text-[#526E48] mx-2">→</span>
                                                            {new Date(b.endDate).toLocaleDateString()} <span className="text-zinc-300 font-normal">@</span> {new Date(b.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                        <p className="text-[7px] font-bold text-zinc-300 uppercase tracking-widest mt-1">
                                                            Deploy_Period: {Math.max(1, Math.ceil((new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / (1000 * 3600 * 24)))} Days
                                                        </p>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <StatusSelector
                                                            currentStatus={b.status}
                                                            onUpdate={async (newStatus) => {
                                                                await apiFetch(`/bookings/${b._id}/status`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) });
                                                                queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="text-right font-black italic text-sm tracking-tighter px-4">
                                                        ₹{((b.totalPrice || 0) + (b.lateFine || 0) + calculateLiveFine(b)).toLocaleString()}
                                                        {b.lateFine > 0 && <span className="text-[8px] text-red-500 block">+₹{b.lateFine.toLocaleString()} Penalty</span>}
                                                        {calculateLiveFine(b) > 0 && <span className="text-[8px] text-[#526E48] block animate-pulse">+₹{calculateLiveFine(b).toLocaleString()} Live_Accrual</span>}
                                                    </td>
                                                    <td className="text-right px-4">
                                                        <div className="flex items-center justify-end gap-3">
                                                            {b.status === 'active_trip' && (
                                                                <>
                                                                    <button
                                                                        onClick={async () => {
                                                                            const amount = prompt("💰 Enter Manual Fine Amount (₹):");
                                                                            if (!amount || isNaN(Number(amount))) return;
                                                                            try {
                                                                                const res = await apiFetch(`/bookings/${b._id}/fine`, {
                                                                                    method: "POST",
                                                                                    body: JSON.stringify({ amount: Number(amount) })
                                                                                });
                                                                                const data = await res.json();
                                                                                alert(data.message);
                                                                                queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
                                                                            } catch (err) { alert("Fine Processing Error"); }
                                                                        }}
                                                                        className="px-3 py-1 bg-amber-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-black transition-all"
                                                                    >
                                                                        ⚠️ Fine
                                                                    </button>
                                                                    <button
                                                                        onClick={async () => {
                                                                            const confirmed = confirm(`🏁 FINALIZE MISSION: End trip for ${b.carId?.name}? (Late fines will be assessed automatically)`);
                                                                            if (!confirmed) return;
                                                                            try {
                                                                                const res = await apiFetch(`/bookings/${b._id}/trip-status`, {
                                                                                    method: "PATCH",
                                                                                    body: JSON.stringify({ tripStatus: "Completed" })
                                                                                });
                                                                                const data = await res.json();
                                                                                alert(data.message);
                                                                                queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
                                                                            } catch (err) { alert("Termination Error"); }
                                                                        }}
                                                                        className="px-3 py-1 bg-red-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-black transition-all"
                                                                    >
                                                                        Complete Trip
                                                                    </button>
                                                                </>
                                                            )}
                                                            <button onClick={() => router.push(`/admin/intercept/${b._id}`)} className="text-[8px] font-black uppercase tracking-widest text-[#D4D4D4] hover:text-black transition-all underline decoration-1 underline-offset-4">Track Live</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ── FLEET COMMAND ── */}
                        {activeTab === "Fleet Command" && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {allBookings.filter((b: any) => ['arrived', 'active_trip'].includes(b.status)).map((b: any) => (
                                    <div key={b._id} className="bg-white border border-zinc-100 rounded-[4rem] p-12 transition-all hover:border-black group shadow-sm">
                                        <div className="flex justify-between items-start mb-10">
                                            <div>
                                                <div className="flex items-center gap-4 mb-3">
                                                    <span className={`px-5 py-1.5 rounded-xl text-[9px] font-black uppercase italic tracking-widest ${b.status === 'arrived' ? 'bg-orange-500 text-white animate-pulse' : 'bg-[#526E48] text-white'}`}>
                                                        {b.status === 'arrived' ? "UNIT_STATIONARY" : "OPS_ACTIVE"}
                                                    </span>
                                                    <span className="text-[10px] font-mono font-bold text-zinc-300 tracking-[0.2em]">INTEL-{b._id.slice(-6).toUpperCase()}</span>
                                                </div>
                                                <h3 className="text-4xl font-black uppercase italic tracking-tighter leading-none text-black">{b.carId?.name}</h3>
                                            </div>
                                        </div>
                                        <div className="h-48 bg-zinc-50 rounded-[2rem] mb-6 overflow-hidden border border-zinc-100">
                                            <img src={getFullUrl(b.carId?.image)} className={`w-full h-full object-cover grayscale transition-all duration-[2s] hover:grayscale-0 ${b.status === 'active_trip' ? 'scale-105' : 'opacity-100'}`} alt="Asset" />
                                        </div>

                                        {/* 📅 Tactical Schedule Sync */}
                                        <div className="flex items-center justify-between bg-zinc-50/50 rounded-2xl p-4 mb-3 border border-zinc-100">
                                            <div className="flex flex-col">
                                                <span className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-1">Deployment_Start</span>
                                                <span className="text-[10px] font-black uppercase tracking-tighter text-black">
                                                    {new Date(b.startDate).toLocaleDateString()} <span className="text-zinc-300 font-normal">@</span> {new Date(b.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="w-[1px] h-6 bg-zinc-200" />
                                            <div className="flex flex-col text-right">
                                                <span className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-1">Scheduled_Return</span>
                                                <span className="text-[10px] font-black uppercase tracking-tighter text-red-500">
                                                    {new Date(b.endDate).toLocaleDateString()} <span className="text-zinc-300 font-normal">@</span> {new Date(b.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between px-2 mb-8">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Projected_Yield</span>
                                            <div className="text-right">
                                                <span className="text-xl font-black italic">₹{((b.totalPrice || 0) + (b.lateFine || 0) + calculateLiveFine(b)).toLocaleString()}</span>
                                                {calculateLiveFine(b) > 0 && <span className="text-[8px] text-[#526E48] block font-black border-t border-[#526E48]/20 mt-1 pt-1 animate-pulse">+₹{calculateLiveFine(b).toLocaleString()} OVERDUE_ACCRUAL</span>}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            {b.status === 'arrived' && (
                                                <button
                                                    onClick={async (e) => {
                                                        const btn = e.currentTarget;
                                                        btn.disabled = true;
                                                        btn.innerHTML = 'ESTABLISHING SYNC...';
                                                        await apiFetch(`/bookings/${b._id}/handover`, { method: "PATCH" });
                                                        queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
                                                    }}
                                                    className="h-20 bg-[#526E48] text-white rounded-3xl flex items-center justify-center gap-4 text-[11px] font-black uppercase tracking-[0.4em] hover:bg-black transition-all"
                                                >
                                                    <Power size={20} className="text-white" />
                                                    Handover Control
                                                </button>
                                            )}
                                            <div className="flex flex-col gap-3">
                                                <button
                                                    onClick={() => window.open(`/admin/intercept/${b._id}`, '_blank')}
                                                    className="h-20 bg-black text-white rounded-3xl flex items-center justify-center gap-4 text-[11px] font-black uppercase tracking-[0.4em] hover:bg-[#526E48] transition-all shadow-xl"
                                                >
                                                    <Activity size={20} />
                                                    Intercept Tactical Link
                                                </button>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={async () => {
                                                            const amount = prompt("💰 Enter Manual Fine Amount (₹):");
                                                            if (!amount || isNaN(Number(amount))) return;
                                                            try {
                                                                const res = await apiFetch(`/bookings/${b._id}/fine`, {
                                                                    method: "POST",
                                                                    body: JSON.stringify({ amount: Number(amount) })
                                                                });
                                                                const data = await res.json();
                                                                alert(data.message);
                                                                queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
                                                            } catch (err) { alert("Fine Processing Error"); }
                                                        }}
                                                        className="h-14 bg-amber-600/10 border border-amber-500/20 text-amber-600 rounded-2xl flex items-center justify-center text-[9px] font-black uppercase tracking-[0.4em] hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                                                    >
                                                        ⚠️ Fine
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            const confirmed = confirm("⚠️ CRITICAL TERMINATE: End this deployment and assess fines?");
                                                            if (!confirmed) return;
                                                            try {
                                                                const res = await apiFetch(`/bookings/${b._id}/trip-status`, {
                                                                    method: "PATCH",
                                                                    body: JSON.stringify({ tripStatus: "Completed" })
                                                                });
                                                                const data = await res.json();
                                                                alert(data.message);
                                                                queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
                                                            } catch (err) { alert("Termination Error"); }
                                                        }}
                                                        className="h-14 bg-red-600/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center text-[9px] font-black uppercase tracking-[0.4em] hover:bg-red-600 hover:text-white transition-all"
                                                    >
                                                        Terminate
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {allBookings.filter((b: any) => ['arrived', 'active_trip'].includes(b.status)).length === 0 && (
                                    <div className="col-span-2 py-40 border border-dashed border-zinc-100 rounded-[4rem] text-center">
                                        <p className="text-[12px] font-black uppercase tracking-[0.5em] text-zinc-300 italic">No Active Missions in Progress</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── MANAGE CARS ── */}
                        {activeTab === "Manage Cars" && (
                            <div className="bg-white border border-zinc-100 rounded-[3.5rem] p-14 shadow-sm">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-zinc-50 h-20">
                                            <th className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 px-6">Asset Registry</th>
                                            <th className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 px-6 text-center">Authorization</th>
                                            <th className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 text-right px-6">Yield/Day</th>
                                            <th className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 text-right px-6">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allCars.map((car: any) => (
                                            <tr key={car._id} className="h-32 hover:bg-zinc-50 border-b border-zinc-50 last:border-0 group transition-all">
                                                <td className="px-6">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-24 h-16 bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-100">
                                                            <img src={getFullUrl(car.image)} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Car" />
                                                        </div>
                                                        <div>
                                                            <p className="text-lg font-black uppercase italic tracking-tighter leading-none mb-1">{car.name}</p>
                                                            <p className="text-[9px] font-bold text-zinc-300 uppercase italic">{car.model} // TRUCK_OPS</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-center px-6">
                                                    <span className={`px-8 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${car.status === 'APPROVED' ? 'bg-[#526E48] text-white border-[#526E48]' : 'bg-red-50 text-red-500 border-red-100'}`}>
                                                        {car.status}
                                                    </span>
                                                </td>
                                                <td className="text-right font-black italic text-2xl tracking-tighter px-6">₹{car.pricePerDay?.toLocaleString()}</td>
                                                <td className="text-right px-6">
                                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button
                                                            onClick={() => router.push(`/dashboard/admin/edit-car/${car._id}`)}
                                                            className="px-4 py-2 bg-white border border-zinc-200 text-zinc-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-black hover:text-black transition-all shadow-sm"
                                                        >
                                                            EDIT
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                const confirmed = confirm(`PERMANENT DELETE: Remove ${car.name} from global registry?`);
                                                                if (!confirmed) return;
                                                                await apiFetch(`/cars/${car._id}`, { method: "DELETE" });
                                                                queryClient.invalidateQueries({ queryKey: ["adminCars"] });
                                                            }}
                                                            className="px-4 py-2 bg-white border border-red-100 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                        >
                                                            DELETE
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ── USERS ── */}
                        {activeTab === "Users" && (
                            <div className="bg-white border border-zinc-100 rounded-[3.5rem] p-14 shadow-sm">
                                <table className="w-full text-left border-separate border-spacing-y-4">
                                    <thead>
                                        <tr className="text-zinc-300">
                                            <th className="text-[10px] font-black uppercase tracking-[0.4em] px-8 py-4">Agent Name</th>
                                            <th className="text-[10px] font-black uppercase tracking-[0.4em] px-8 py-4">Credential Link</th>
                                            <th className="text-[10px] font-black uppercase tracking-[0.4em] px-8 py-4 text-center">Security Status</th>
                                            <th className="text-[10px] font-black uppercase tracking-[0.4em] px-8 py-4 text-right">Overrides</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user: any) => (
                                            <tr key={user._id} className="h-24 bg-white hover:bg-zinc-50 border border-zinc-100 rounded-3xl transition-all group shadow-sm">
                                                <td className="text-[13px] font-black uppercase tracking-widest text-zinc-900 px-8 rounded-l-3xl">{user.name}</td>
                                                <td className="text-[11px] font-mono text-zinc-400 px-8 uppercase">{user.email}</td>
                                                <td className="text-center px-8">
                                                    <div className={`inline-flex items-center gap-3 px-6 py-2 rounded-full border ${user.isBlocked ? 'bg-red-50 text-red-500 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${user.isBlocked ? 'bg-red-500 animate-pulse' : 'bg-green-600'}`} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest italic">{user.isBlocked ? 'REVOKED' : 'AUTHORIZED'}</span>
                                                    </div>
                                                </td>
                                                <td className="text-right px-8 rounded-r-3xl">
                                                    <div className="flex items-center justify-end gap-3 transition-all">
                                                        <button
                                                            onClick={async () => {
                                                                const confirmed = confirm(`Confirm status change for ${user.name}?`);
                                                                if (!confirmed) return;
                                                                await apiFetch(`/dashboard/admin/users/${user._id}/block`, { method: "PATCH" });
                                                                queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
                                                            }}
                                                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${user.isBlocked ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg shadow-yellow-400/20 hover:bg-yellow-500' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-800 hover:text-zinc-900 shadow-sm'}`}
                                                        >
                                                            {user.isBlocked ? 'UNBLOCK' : 'BLOCK'}
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                const confirmed = confirm(`TERMINATION: Wipe agent ${user.name} from records?`);
                                                                if (!confirmed) return;
                                                                await apiFetch(`/dashboard/admin/users/${user._id}`, { method: "DELETE" });
                                                                queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
                                                            }}
                                                            className="px-4 py-2 bg-white border border-red-100 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                        >
                                                            DELETE
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ── COMMUNICATIONS ── */}
                        {activeTab === "Communications" && (
                            <div className="space-y-6">
                                {allChats?.length > 0 ? (
                                    allChats.map((chat: any) => (
                                        <div
                                            key={chat._id}
                                            onClick={() => router.push(`/dashboard/chat?id=${chat._id}`)}
                                            className="group bg-white border border-zinc-100 hover:border-black transition-all p-12 rounded-[4rem] flex items-center justify-between cursor-pointer shadow-sm hover:shadow-2xl"
                                        >
                                            <div className="flex items-center gap-10">
                                                <div className="flex -space-x-8">
                                                    <div className="w-20 h-20 rounded-[2rem] border-4 border-white overflow-hidden bg-zinc-100 z-10 shadow-lg">
                                                        <img src={getFullUrl(chat.renterId?.image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 grayscale group-hover:grayscale-0" alt="Renter" />
                                                    </div>
                                                    <div className="w-20 h-20 rounded-[2rem] border-4 border-white overflow-hidden bg-[#526E48] flex items-center justify-center text-lg font-black italic text-white z-0 shadow-lg">
                                                        {chat.hostId?.name?.charAt(0) || "H"}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="text-[13px] font-black uppercase tracking-[0.2em] text-black leading-none mb-3">
                                                        {chat.renterId?.name || "ANON"} <span className="text-[#526E48] font-light mx-2">/</span> {chat.hostId?.name || "HOST"}
                                                    </h4>
                                                    <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest italic leading-none">
                                                        INTEL: {chat.lastMessage || "Thread Initialized"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-[#526E48] uppercase tracking-[0.4em] mb-4">
                                                    {new Date(chat.lastMessageAt || chat.createdAt).toLocaleDateString()}
                                                </p>
                                                <div className="inline-flex items-center gap-4 bg-zinc-50 px-8 py-3 rounded-2xl group-hover:bg-black group-hover:text-emerald-400 transition-all transform group-hover:-translate-x-2">
                                                    <MessageSquare size={16} />
                                                    <span className="text-[9px] font-black uppercase tracking-[0.5em]">Audit Flow</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-20 text-center border-2 border-dashed border-zinc-100 rounded-[4rem]">
                                        <p className="text-[12px] font-black uppercase tracking-[0.5em] text-zinc-200 italic">No Platforms Intelligence Gathered</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #526E48; border-radius: 10px; }
                body { background: white !important; font-family: 'Inter', sans-serif !important; }
            `}</style>
        </div>
    );
}
