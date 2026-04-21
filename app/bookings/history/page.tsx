"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { apiFetch } from "@/services/api";
import { useRouter } from "next/navigation";

const getImageUrl = (img?: string) => {
    if (!img || img === "" || img === "null") return "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=2000";
    if (img.startsWith("http")) return img;
    return `https://rental-garage.duckdns.org/uploads/${img}`;
};

export default function BookingHistoryPage() {
    const router = useRouter();
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

        // 💳 Load Razorpay SDK for fine settlements
        if (!document.getElementById("razorpay-sdk")) {
            const script = document.createElement("script");
            script.id = "razorpay-sdk";
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            document.head.appendChild(script);
        }
    }, []);

    const handleCancelBooking = async (bookingId: string) => {
        if (!confirm("Are you sure you want to cancel this reservation?")) return;
        try {
            const res = await apiFetch(`/bookings/${bookingId}`, { method: "DELETE" });
            if (res.ok) {
                setBookings(prev => prev.filter(b => b._id !== bookingId));
            } else {
                const data = await res.json();
                alert(data.message || "Failed to cancel reservation");
            }
        } catch (err) {
            alert("Network error.");
        }
    };

    const handleInitiateChat = async (bookingId: string) => {
        try {
            const res = await apiFetch("/chat/create", {
                method: "POST",
                body: JSON.stringify({ bookingId })
            });
            const data = await res.json();
            if (res.ok) {
                router.push(`/dashboard/chat?id=${data._id}`);
            } else {
                alert(`Tactical Link Error: ${data.message || "Failed to synchronize thread"}`);
            }
        } catch (error) {
            console.error("Chat initiation failure", error);
            alert("Signal transmission failure. Check neural link connection.");
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
                                            <p className="text-base font-black italic text-black mb-1.5 leading-none">
                                                ₹{((bk.totalPrice || 0) + (bk.lateFine || 0)).toLocaleString()}
                                            </p>
                                            {bk.lateFine > 0 && (
                                                <p className={`text-[8px] font-black tracking-widest uppercase mb-1.5 italic ${bk.finePaid ? "text-emerald-500" : "text-[#ef4444]"}`}>
                                                    {bk.finePaid ? "✓ Fine Settled" : `+ ₹${bk.lateFine.toLocaleString()} Fine`}
                                                </p>
                                            )}
                                            <p className={`text-[8px] font-black tracking-[0.2em] uppercase inline-flex items-center gap-1.5 px-2 py-1 rounded-md border ${
                                                bk.status === 'active_trip'     ? 'text-[#526E48]  border-[#526E48]/10  bg-[#526E48]/[0.02]' :
                                                bk.status === 'arrived'         ? 'text-amber-600  border-amber-200      bg-amber-50/50' :
                                                bk.status === 'upcoming_pickup' ? 'text-orange-500 border-orange-200     bg-orange-50/50' :
                                                bk.status === 'Confirmed'       ? 'text-blue-600   border-blue-200       bg-blue-50/50' :
                                                bk.status === 'Completed'       ? 'text-green-600  border-green-500/10   bg-green-500/[0.02]' :
                                                bk.status === 'Pending'         ? 'text-[#526E48]  border-[#526E48]/10   bg-[#526E48]/[0.02]' :
                                                                                  'text-red-500     border-red-500/10      bg-red-500/[0.02]'
                                            }`}>
                                                /// {
                                                    bk.status === 'active_trip'     ? 'Active Trip' :
                                                    bk.status === 'arrived'         ? 'Arrived' :
                                                    bk.status === 'upcoming_pickup' ? 'Pickup Soon' :
                                                    bk.status
                                                }
                                            </p>
                                        </div>
                                        <div className="col-span-12 sm:col-span-5 md:col-span-2 text-right flex flex-col items-end gap-3">
                                            <span className={`inline-block px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border ${bk.documentStatus === 'Approved' ? 'bg-green-500/[0.02] text-green-600 border-green-500/10' : bk.documentStatus === 'Rejected' ? 'bg-red-500/[0.02] text-red-500 border-red-500/10' : 'bg-black/[0.02] text-zinc-400 border-black/5'}`}>
                                                Log: {bk.documentStatus}
                                            </span>

                                            {/* ── Active booking: next-step guidance ── */}
                                            {['Confirmed', 'upcoming_pickup', 'arrived', 'active_trip'].includes(bk.status) && (
                                                <div className={`w-full max-w-[200px] rounded-xl border p-3 text-left ${
                                                    bk.status === 'arrived'     ? 'bg-amber-50 border-amber-200' :
                                                    bk.status === 'active_trip' ? 'bg-[#526E48]/5 border-[#526E48]/20' :
                                                    'bg-blue-50 border-blue-200'
                                                }`}>
                                                    <p className={`text-[7px] font-black uppercase tracking-widest mb-1 ${
                                                        bk.status === 'arrived'     ? 'text-amber-600' :
                                                        bk.status === 'active_trip' ? 'text-[#526E48]' :
                                                        'text-blue-600'
                                                    }`}>
                                                        {bk.status === 'Confirmed'       ? '📍 Next Step' :
                                                         bk.status === 'upcoming_pickup' ? '🔔 Pickup Soon' :
                                                         bk.status === 'arrived'         ? '⏳ Waiting' :
                                                         '🚗 Trip Active'}
                                                    </p>
                                                    <p className="text-[8px] font-bold text-zinc-500 leading-snug">
                                                        {bk.status === 'Confirmed'       ? 'Go to pickup location & mark arrival' :
                                                         bk.status === 'upcoming_pickup' ? 'Head to pickup location soon' :
                                                         bk.status === 'arrived'         ? 'Waiting for host to hand over' :
                                                         `Return by ${new Date(bk.endDate).toLocaleDateString('en-GB')}`}
                                                    </p>
                                                </div>
                                            )}

                                            {/* ── View Details button ── */}
                                            {['Confirmed', 'upcoming_pickup', 'arrived', 'active_trip'].includes(bk.status) && (
                                                <Link
                                                    href={`/bookings/${bk._id}`}
                                                    className="w-full max-w-[140px] text-center py-2.5 bg-black text-white rounded-xl text-[8px] font-black uppercase tracking-[0.15em] hover:bg-[#526E48] transition-all shadow-lg block"
                                                >
                                                    View Details →
                                                </Link>
                                            )}

                                            <button
                                                onClick={() => handleInitiateChat(bk._id)}
                                                className="w-full max-w-[140px] py-2 bg-[#526E48]/5 text-[#526E48] rounded-xl text-[8px] font-black uppercase tracking-[0.1em] border border-[#526E48]/10 hover:bg-[#526E48]/10 transition-all italic"
                                            >
                                                Chat with Host
                                            </button>

                                            {bk.lateFine > 0 && !bk.finePaid && (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const res = await apiFetch(`/bookings/${bk._id}/fine-payment`, { method: "POST" });
                                                            const data = await res.json();
                                                            if (!res.ok) throw new Error(data.message);

                                                            const options = {
                                                                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                                                                amount: data.amount * 100,
                                                                currency: "INR",
                                                                name: "Rental Garage - Settlement",
                                                                description: `Settle Fine for RG-${bk._id.slice(-6).toUpperCase()}`,
                                                                order_id: data.orderId,
                                                                handler: async (response: any) => {
                                                                    const confirmRes = await apiFetch(`/bookings/${bk._id}/fine-confirm`, {
                                                                        method: "POST",
                                                                        body: JSON.stringify({ paymentId: response.razorpay_payment_id })
                                                                    });
                                                                    if (confirmRes.ok) {
                                                                        alert("✅ MISSION SETTLED: Fine cleared successfully.");
                                                                        window.location.reload();
                                                                    }
                                                                },
                                                                theme: { color: "#526E48" }
                                                            };
                                                            const rzp = new (window as any).Razorpay(options);
                                                            rzp.open();
                                                        } catch (err: any) { alert(err.message || "Payment initiation failed"); }
                                                    }}
                                                    className="w-full max-w-[140px] py-2.5 bg-green-600 text-white rounded-xl text-[8px] font-black uppercase tracking-[0.15em] hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2"
                                                >
                                                    <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                                                    Settle Fine
                                                </button>
                                            )}

                                            {bk.status === 'Pending' && (
                                                <div className="flex flex-col items-end gap-2 w-full max-w-[140px]">
                                                    {bk.documentStatus === 'Approved' && (
                                                        <Link
                                                            href={`/bookings/payment/${bk._id}`}
                                                            className="w-full text-center py-2.5 bg-black text-white rounded-xl text-[8px] font-black uppercase tracking-[0.15em] hover:bg-[#526E48] transition-all shadow-lg"
                                                        >
                                                            Secure Payment
                                                        </Link>
                                                    )}
                                                    <button
                                                        onClick={() => handleCancelBooking(bk._id)}
                                                        className="w-full text-center py-2.5 bg-white border border-red-500/20 text-red-500 rounded-xl text-[8px] font-black uppercase tracking-[0.15em] hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                    >
                                                        Cancel Reservation
                                                    </button>
                                                </div>
                                            )}
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
