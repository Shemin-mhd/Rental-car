"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { apiFetch, getImageUrl } from "@/services/api";

export default function BookingStatusPage() {
    const router = useRouter();
    const [pendingBookings, setPendingBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            router.push("/login");
            return;
        }

        apiFetch("/bookings/user/bookings")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const pending = data.filter((b: any) => b.status !== 'Confirmed' && b.status !== 'Cancelled');
                    setPendingBookings(pending);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [router]);

    const handleCancelBooking = async (bookingId: string) => {
        if (!confirm("Are you sure you want to cancel this reservation?")) return;
        try {
            const res = await apiFetch(`/bookings/${bookingId}`, { method: "DELETE" });
            if (res.ok) {
                setPendingBookings(prev => prev.filter(b => b._id !== bookingId));
            } else {
                const data = await res.json();
                alert(data.message || "Failed to cancel reservation");
            }
        } catch (err) {
            alert("Network error.");
        }
    };

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
                    <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-3">Booking <span className="text-[#526E48]">Status</span></h1>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">Track the approval process for your active reservations.</p>
                </header>

                <main>
                    {loading ? (
                        <div className="py-20 flex justify-center">
                            <div className="w-8 h-8 border-2 border-[#526E48] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : pendingBookings.length > 0 ? (
                        <AnimatePresence>
                            {pendingBookings.map((bk: any, idx: number) => (
                                <motion.div
                                    key={bk._id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 30 }}
                                    transition={{ delay: idx * 0.08 }}
                                    className={`mb-5 rounded-[2.5rem] border overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.03)] bg-white ${bk.documentStatus === 'Approved'
                                            ? 'border-green-500/10'
                                            : bk.documentStatus === 'Rejected'
                                                ? 'border-red-500/10'
                                                : 'border-black/5'
                                        }`}
                                >
                                    {/* Status Header Bar */}
                                    <div className={`px-7 py-4 flex items-center gap-4 border-b ${bk.documentStatus === 'Approved'
                                            ? 'border-green-500/5 bg-green-500/[0.02]'
                                            : bk.documentStatus === 'Rejected'
                                                ? 'border-red-500/5 bg-red-500/[0.02]'
                                                : 'border-black/[0.02] bg-zinc-50/50'
                                        }`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bk.documentStatus === 'Approved' ? 'bg-green-500/5' : bk.documentStatus === 'Rejected' ? 'bg-red-500/5' : 'bg-black/[0.03]'
                                            }`}>
                                            {bk.documentStatus === 'Approved' ? (
                                                <svg width="20" height="20" fill="none" stroke="#22c55e" strokeWidth="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                                            ) : bk.documentStatus === 'Rejected' ? (
                                                <svg width="20" height="20" fill="none" stroke="#ef4444" strokeWidth="3" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                                            ) : (
                                                <div className="w-5 h-5 border-2 border-[#526E48]/20 border-t-[#526E48] rounded-full animate-spin" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-[11px] font-black uppercase tracking-widest ${bk.documentStatus === 'Approved' ? 'text-green-600' : bk.documentStatus === 'Rejected' ? 'text-red-500' : 'text-[#526E48]'
                                                }`}>
                                                {bk.documentStatus === 'Approved' ? '✓ Document Approved' : bk.documentStatus === 'Rejected' ? '✕ Document Rejected' : '⧗ Under Review'}
                                            </p>
                                            <p className="text-[8px] font-mono font-bold text-zinc-300 uppercase tracking-widest mt-0.5">
                                                Archive ID: {bk._id?.slice(-8).toUpperCase()}
                                            </p>
                                        </div>
                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-3">
                                            {bk.status !== 'Confirmed' && (
                                                <button
                                                    onClick={() => handleCancelBooking(bk._id)}
                                                    className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-400 border border-black/5 hover:border-red-500/30 hover:text-red-500 transition-all"
                                                >
                                                    Retract
                                                </button>
                                            )}
                                            {bk.documentStatus === 'Approved' && bk.status !== 'Confirmed' && (
                                                <button
                                                    onClick={() => router.push(`/bookings/payment/${bk._id}`)}
                                                    className="h-11 px-6 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-[#526E48] transition-all active:scale-[0.97] whitespace-nowrap flex items-center gap-2"
                                                >
                                                    Secure Payment
                                                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                </button>
                                            )}
                                            {bk.documentStatus === 'Rejected' && (
                                                <Link href="/" className="px-5 py-2.5 bg-red-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 whitespace-nowrap">
                                                    Resubmit
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    {/* Car Image + Full Booking Details */}
                                    <div className="p-7">
                                        <div className="flex flex-col lg:flex-row gap-8">
                                            {/* Car Image & Details */}
                                            <div className="shrink-0 lg:w-[320px]">
                                                <div className="relative h-48 lg:h-44 w-full rounded-3xl overflow-hidden border border-black/[0.03] bg-zinc-50">
                                                    <Image
                                                        src={getImageUrl(bk.carId?.image)}
                                                        alt={bk.carId?.name || 'Vehicle'}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-md px-3 py-1 rounded-lg border border-black/5">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-[#526E48] italic">{bk.carId?.category || 'Premium'}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-5 space-y-4">
                                                    <div>
                                                        <h4 className="text-[17px] font-black uppercase italic tracking-tighter text-black">{bk.carId?.name || 'N/A'}</h4>
                                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{bk.carId?.year || ''} • {bk.carId?.model || ''}</p>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div className="py-2.5 bg-zinc-50 border border-black/[0.02] rounded-2xl flex flex-col items-center gap-0.5">
                                                            <span className="text-[10px] font-black text-black">{bk.carId?.seats || '—'}</span>
                                                            <span className="text-[6px] font-black uppercase tracking-widest text-zinc-400">Seats</span>
                                                        </div>
                                                        <div className="py-2.5 bg-zinc-50 border border-black/[0.02] rounded-2xl flex flex-col items-center gap-0.5">
                                                            <span className="text-[10px] font-black text-black">{bk.carId?.transmission === 'Automatic' ? 'Auto' : 'Manual'}</span>
                                                            <span className="text-[6px] font-black uppercase tracking-widest text-zinc-400">Gear</span>
                                                        </div>
                                                        <div className="py-2.5 bg-zinc-50 border border-black/[0.02] rounded-2xl flex flex-col items-center gap-0.5">
                                                            <span className="text-[10px] font-black text-[#526E48]">₹{(bk.carId?.pricePerDay / 1000).toFixed(1)}k</span>
                                                            <span className="text-[6px] font-black uppercase tracking-widest text-zinc-400">Rate</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Booking Info Grid */}
                                            <div className="flex-1">
                                                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[#526E48] mb-6 italic">/// Reservation_Registry</p>
                                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-7 gap-x-10">
                                                    <div className="space-y-1.5">
                                                        <p className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-300">Principal</p>
                                                        <p className="text-[11px] font-black uppercase text-black italic">{bk.fullName || 'N/A'}</p>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <p className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-300">Nominee</p>
                                                        <p className="text-[11px] font-black uppercase text-black italic">{bk.nomineeName || 'N/A'}</p>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <p className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-300">Protocol</p>
                                                        <p className="text-[11px] font-black uppercase text-[#526E48] italic">{bk.bookingType === 'driver' ? 'Chauffeur' : 'Self Drive'}</p>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <p className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-300">Comm_Link</p>
                                                        <p className="text-[11px] font-bold text-black tracking-widest">{bk.primaryPhone || 'N/A'}</p>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <p className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-300">Deployment</p>
                                                        <p className="text-[11px] font-bold text-black tracking-widest">{new Date(bk.startDate).toLocaleDateString('en-GB')}</p>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <p className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-300">Retraction</p>
                                                        <p className="text-[11px] font-bold text-black tracking-widest">{new Date(bk.endDate).toLocaleDateString('en-GB')}</p>
                                                    </div>
                                                    <div className="space-y-1.5 col-span-2">
                                                        <p className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-300">Vector_Address</p>
                                                        <p className="text-[10px] font-bold text-zinc-600 uppercase leading-snug">{bk.address || 'N/A'}</p>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <p className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-300">Net_Investment</p>
                                                        <p className="text-[18px] font-black text-[#526E48] italic leading-none">₹{bk.totalPrice?.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    ) : (
                        <div className="py-32 text-center bg-zinc-50/50 rounded-[3rem] border border-dashed border-black/5">
                            <div className="w-16 h-16 rounded-full bg-white border border-black/5 flex items-center justify-center mx-auto mb-6 text-zinc-200">
                                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-8 italic">Archive: Zero Active Reservations Found</p>
                            <Link href="/cars" className="inline-block bg-black text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#526E48] transition-all shadow-2xl">
                                Browse Fleet
                            </Link>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
