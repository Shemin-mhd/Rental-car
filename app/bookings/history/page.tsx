"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { apiFetch } from "@/services/api";

const getImageUrl = (img?: string) => {
    if (!img || img === "" || img === "null") return "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=2000";
    if (img.startsWith("http")) return img;
    return `http://localhost:5000/uploads/${img}`;
};

export default function BookingHistoryPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await apiFetch("/bookings/user/bookings");
                const data = await res.json();
                if (res.ok && Array.isArray(data)) {
                    // Sort bookings with newest first
                    const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    setBookings(sorted);
                }
            } catch (err) {
                console.error("Failed to fetch booking history:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    return (
        <div className="min-h-screen bg-white text-black selection:bg-[#526E48]/30 pb-32">
            {/* Elegant Fixed Navbar */}
            <nav className="fixed top-0 inset-x-0 z-50 border-b border-black/[0.04] bg-white/60 px-8 h-14 flex items-center backdrop-blur-xl">
                <div className="mx-auto flex w-full max-w-[1700px] items-center justify-between">
                    <Link href="/cars" className="flex items-center gap-2">
                        <div className="rounded bg-[#526E48] px-1.5 py-0.5 text-[9px] font-black italic text-white">RG</div>
                        <span className="text-base font-black italic uppercase tracking-tighter text-black hover:text-[#526E48] transition-colors">Rental_<span className="text-[#526E48]">Garage</span></span>
                    </Link>
                    <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        <Link href="/cars" className="hover:text-black transition-colors">Fleet</Link>
                        <span className="text-black text-opacity-10">|</span>
                        <Link href="/" className="hover:text-black transition-colors">Home</Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-[1400px] mx-auto px-6 pt-32">
                <header className="mb-12">
                    <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-3">Booking <span className="text-[#526E48]">History</span></h1>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">Comprehensive log of your past and active reservations.</p>
                </header>

                <main>
                    {loading ? (
                        <div className="py-20 flex justify-center">
                            <div className="w-8 h-8 border-2 border-[#526E48] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="bg-white border border-black/5 shadow-[0_20px_50px_rgba(0,0,0,0.03)] rounded-[2.5rem] overflow-hidden pb-4">
                            <div className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-black/5 bg-zinc-50/50 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400 items-center">
                                <div className="col-span-12 sm:col-span-4">Vehicle Identity</div>
                                <div className="col-span-3 hidden sm:block">Timeline / Ref ID</div>
                                <div className="col-span-3 hidden md:block">Cost / Status</div>
                                <div className="col-span-7 sm:col-span-5 md:col-span-2 text-right">Approval_Gate</div>
                            </div>

                            <div className="divide-y divide-black/[0.03]">
                                {bookings.length > 0 ? bookings.map((bk) => (
                                    <div key={bk._id} className="grid grid-cols-12 gap-4 px-8 py-8 items-center hover:bg-zinc-50 transition-all group">
                                        <div className="col-span-12 sm:col-span-4 flex items-center gap-6">
                                            <div className="w-24 h-16 rounded-2xl overflow-hidden relative shrink-0 border border-black/[0.04] bg-white group-hover:border-[#526E48]/20 transition-all shadow-sm">
                                                {bk.carId?.image ? (
                                                    <Image src={getImageUrl(bk.carId.image)} alt={bk.carId?.name || "Car"} fill className="object-cover group-hover:scale-110 transition-transform duration-1000" unoptimized />
                                                ) : (
                                                    <div className="w-full h-full bg-zinc-50" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black uppercase italic tracking-tighter text-black group-hover:text-[#526E48] transition-colors truncate mb-1">
                                                    {bk.carId?.name || "Classified Asset"}
                                                </p>
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${bk.bookingType === 'driver' ? 'border-[#526E48]/20 text-[#526E48] bg-[#526E48]/5' : 'border-black/5 text-zinc-400 bg-zinc-50'}`}>
                                                    {bk.bookingType === 'driver' ? 'Chauffeur' : 'Self-Drive'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="col-span-3 hidden sm:block">
                                            <p className="text-[10px] font-black text-black tracking-tight mb-2 uppercase">
                                                {new Date(bk.startDate).toLocaleDateString('en-GB')} — {new Date(bk.endDate).toLocaleDateString('en-GB')}
                                            </p>
                                            <p className="text-[9px] font-mono font-black tracking-widest text-[#526E48]/40 uppercase italic">
                                                RG-{(bk._id.toString().slice(-6)).toUpperCase()}
                                            </p>
                                        </div>
                                        <div className="col-span-3 hidden md:block">
                                            <p className="text-base font-black italic text-[#526E48] mb-1.5 leading-none">
                                                ₹{bk.totalPrice?.toLocaleString() || "0"}
                                            </p>
                                            <p className={`text-[8px] font-black tracking-[0.2em] uppercase inline-flex items-center gap-1.5 px-2 py-1 rounded-md border ${bk.status === 'Confirmed' || bk.status === 'Ongoing' ? 'text-green-600 border-green-500/10 bg-green-500/[0.02]' : bk.status === 'Pending' ? 'text-[#526E48] border-[#526E48]/10 bg-[#526E48]/[0.02]' : 'text-red-500 border-red-500/10 bg-red-500/[0.02]'}`}>
                                                /// {bk.status}
                                            </p>
                                        </div>
                                        <div className="col-span-12 sm:col-span-5 md:col-span-2 text-right">
                                            <span className={`inline-block px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border ${bk.documentStatus === 'Approved' ? 'bg-green-500/[0.02] text-green-600 border-green-500/10' : bk.documentStatus === 'Rejected' ? 'bg-red-500/[0.02] text-red-500 border-red-500/10' : 'bg-black/[0.02] text-zinc-400 border-black/5'}`}>
                                                Log: {bk.documentStatus}
                                            </span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-32 text-center bg-zinc-50/50">
                                        <div className="w-16 h-16 rounded-full bg-white border border-black/5 flex items-center justify-center mx-auto mb-6 text-zinc-200">
                                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-8 italic">Archive: No Past Deployments Found</p>
                                        <Link href="/cars" className="inline-block bg-black text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-[#526E48] transition-all">
                                            Browse fleet
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
