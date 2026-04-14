"use client";

import { useEffect, useState, use, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/services/api";
import { io } from "socket.io-client";

const LUXURY_PLACEHOLDERS = [
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=2000",
];

const getImageUrl = (img?: string) => {
    if (!img || img === "" || img === "null") return LUXURY_PLACEHOLDERS[0];
    if (img.startsWith("http")) return img;
    return `http://localhost:5000/uploads/${img}`;
};

interface Car {
    _id: string;
    name: string;
    category: string;
    image: string;
    transmission: string;
    seats: number;
}

interface Booking {
    _id: string;
    carId: Car;
    totalPrice: number;
    documentStatus: "Pending" | "Approved" | "Rejected";
    status: string;
    startDate: string;
    endDate: string;

}

export default function BookingPaymentPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <PaymentContent id={params.id} />
        </Suspense>
    );
}

function PaymentContent({ id }: { id: string }) {
    const router = useRouter();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState<any>(null);

    // 🛡️ Load Razorpay SDK Script
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const fetchBooking = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiFetch(`/bookings/${id}`);
            const data = await res.json();
            if (res.ok) {
                setBooking(data);
            } else {
                setError(data.message || "Archive decryption failed");
            }
        } catch (err) {
            setError("Connection failure 📡");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooking();
        
        // 🛰️ Real-time Sync-Bridge connection
        const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000";
        const socket = io(BASE_URL);
        
        socket.emit("join", id);
        
        socket.on("bookingStatusUpdate", (data) => {
            if (data.bookingId === id) {
                setBooking(prev => prev ? { ...prev, documentStatus: data.documentStatus, status: data.status } : null);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [id]);

    const handleRazorpayPayment = async () => {
        if (!booking) return;

        setIsProcessing(true);
        try {
            // 1. Create order on backend
            const orderRes = await apiFetch("/payments/order", {
                method: "POST",
                body: JSON.stringify({ bookingId: id }),
                headers: { "Content-Type": "application/json" }
            });

            const orderData = await orderRes.json();
            if (!orderRes.ok) throw new Error(orderData.message || "Failed to initiate payment engine");

            // 2. Open Razorpay Checkout Popup
            const options = {
                key: orderData.key,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Rental Garage Elite",
                description: `Elite Reservation for ${booking.carId.name}`,
                order_id: orderData.orderId,
                handler: async function (response: any) {
                    // 3. Verify payment on backend
                    const verifyRes = await apiFetch("/payments/verify", {
                        method: "POST",
                        body: JSON.stringify({
                            bookingId: id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                        }),
                        headers: { "Content-Type": "application/json" }
                    });

                    if (verifyRes.ok) {
                        setPaymentDetails({
                            paymentId: response.razorpay_payment_id,
                            orderId: response.razorpay_order_id,
                            amount: booking?.totalPrice || 0,
                            carName: booking?.carId?.name || "Premium Fleet Asset"
                        });
                        setPaymentSuccess(true);
                    } else {
                        const verifyData = await verifyRes.json();
                        alert(verifyData.message || "Financial authorization failed at the final step.");
                    }
                },
                prefill: {
                    name: (JSON.parse(localStorage.getItem("user") || "{}")).name || "",
                },
                theme: { color: "#526E48" }, // Elite Olive Theme
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                alert("Payment Uplink Failed: " + response.error.description);
            });
            rzp.open();

        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 border border-[#526E48]/20 border-t-[#526E48] rounded-full animate-spin mb-6" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#526E48] italic animate-pulse">Checking Booking Status...</p>
        </div>
    );

    if (error || !booking) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-3xl font-black uppercase tracking-tighter italic mb-4 text-black">Booking <span className="text-red-500">Not Found</span></h1>
            <p className="text-zinc-400 text-[10px] font-black uppercase mb-12 italic">{error || "Unable to retrieve booking details."}</p>
            <button onClick={fetchBooking} className="bg-black text-white py-5 px-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#526E48] transition-colors">Try Again</button>
        </div>
    );

    const summarySidebar = (
        <div className="lg:col-span-5">
            <div className="bg-white border border-black/[0.03] p-10 rounded-[3rem] sticky top-32 space-y-10 shadow-[0_30px_100px_rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-6 pb-10 border-b border-black/[0.03]">
                    <div className="relative w-24 h-16 rounded-2xl overflow-hidden shadow-sm bg-zinc-50">
                        <Image src={getImageUrl(booking.carId.image)} alt="Vehicle" fill className="object-cover" unoptimized />
                    </div>
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[#526E48] mb-1 italic">/// {booking.carId.category}</p>
                        <p className="text-lg font-black italic uppercase leading-none tracking-tighter text-black">{booking.carId.name}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-50 rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-black/[0.01]">
                        <span className="text-lg">⚡</span>
                        <div>
                            <p className="text-[7px] font-black uppercase tracking-widest text-zinc-300">Logic</p>
                            <p className="text-[10px] font-black uppercase italic text-black">{booking.carId.transmission}</p>
                        </div>
                    </div>
                    <div className="bg-zinc-50 rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-black/[0.01]">
                        <span className="text-lg">⚓</span>
                        <div>
                            <p className="text-[7px] font-black uppercase tracking-widest text-zinc-300">Access</p>
                            <p className="text-[10px] font-black uppercase italic text-black">{booking.carId.seats} LRS</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-5 border-t border-black/[0.03] pt-10">
                    <div className="grid grid-cols-2 gap-6 pb-6 border-b border-black/[0.03]">
                        <div className="space-y-1">
                            <p className="text-[7px] font-black uppercase text-zinc-300 tracking-widest">Arrival</p>
                            <p className="text-[10px] font-black italic text-black uppercase tracking-tight">{new Date(booking.startDate).toLocaleDateString('en-GB')}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[7px] font-black uppercase text-zinc-300 tracking-widest">Retraction</p>
                            <p className="text-[10px] font-black italic text-black uppercase tracking-tight">{new Date(booking.endDate).toLocaleDateString('en-GB')}</p>
                        </div>
                    </div>

                    <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 italic">
                        <span>Total Duration</span>
                        <span className="text-black">
                            {Math.max(1, Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 3600 * 24)))} Days
                        </span>
                    </div>
                    <div className="flex justify-between items-baseline pt-8 border-t border-black/[0.03] mt-6">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#526E48] italic">Total Amount</span>
                        <span className="text-3xl font-black italic text-black tracking-tighter">₹{booking.totalPrice.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white text-black selection:bg-[#526E48]/30 pb-24 font-sans antialiased">
            <nav className="fixed top-0 inset-x-0 z-50 bg-white/60 backdrop-blur-xl border-b border-black/[0.03]">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href={`/`} className="p-2 hover:bg-black/5 rounded-full transition-colors flex items-center gap-2 group text-[10px] uppercase font-black text-zinc-400">
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
                        <span className="group-hover:text-black transition-colors">Return Home</span>
                    </Link>
                    <div className="flex items-center gap-2.5">
                        <div className="bg-[#526E48] px-1.5 py-0.5 rounded-sm text-[8px] text-white font-black -skew-x-12">RG</div>
                        <span className="text-sm font-black tracking-tighter uppercase italic text-black">Elite_<span className="text-[#526E48]">Checkout</span></span>
                    </div>
                    <div className="w-10 text-zinc-200">🔒</div>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto pt-32 px-6">
                <AnimatePresence mode="wait">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {booking.documentStatus === "Pending" ? (
                            <>
                                <div className="lg:col-span-7 space-y-12">
                                    <header className="space-y-3">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-50 border border-black/[0.03]">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                            <span className="text-[8px] font-black uppercase text-amber-600 tracking-widest">Step 2: Verification in Progress</span>
                                        </div>
                                        <h1 className="text-3xl lg:text-4xl font-black italic tracking-tighter uppercase leading-none text-black">Reviewing <span className="text-amber-500">Documents.</span></h1>
                                        <p className="text-zinc-500 text-[11px] uppercase font-bold tracking-widest leading-loose max-w-md">Please wait while our team verifies your identity and license. This is required before proceeding to payment.</p>
                                    </header>

                                    <div className="bg-white border border-black/[0.03] rounded-[3rem] p-10 space-y-8 shadow-[0_30px_100px_rgba(0,0,0,0.06)] relative overflow-hidden">
                                        <div className="absolute top-0 inset-x-0 h-1 overflow-hidden bg-zinc-100">
                                            <div className="h-full bg-amber-400 w-1/3 animate-[slide_2s_ease-in-out_infinite]" />
                                        </div>

                                        <div className="flex flex-col gap-8">
                                            <div className="flex items-start gap-6">
                                                <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center border border-black/[0.02] shrink-0">
                                                    <svg width="20" height="20" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                </div>
                                                <div className="space-y-1 pt-1.5">
                                                    <h3 className="text-sm font-black uppercase tracking-widest text-black">Documents Uploaded</h3>
                                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-relaxed">Your government ID and driving license were successfully received.</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-6">
                                                <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center border border-black/[0.02] shrink-0">
                                                    <div className="w-5 h-5 border-2 border-zinc-200 border-t-amber-500 rounded-full animate-spin" />
                                                </div>
                                                <div className="space-y-1 pt-1.5">
                                                    <h3 className="text-sm font-black uppercase tracking-widest text-amber-500">Validating Identity</h3>
                                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-relaxed">Our support team is cross-checking your details to authorize your account. You will be able to proceed to payment once completed.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <style>{`@keyframes slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }`}</style>
                                </div>
                                {summarySidebar}
                            </>
                        ) : booking.documentStatus === "Rejected" ? (
                            <div className="lg:col-span-12 max-w-2xl mx-auto w-full">
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-red-500/10 rounded-[3rem] p-12 text-center space-y-10 shadow-[0_30px_100px_rgba(239,68,68,0.06)]">
                                    <div className="w-24 h-24 bg-red-50 rounded-full mx-auto flex items-center justify-center border border-red-100/50">
                                        <svg width="36" height="36" fill="none" stroke="#ef4444" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </div>
                                    <div className="space-y-4">
                                        <h1 className="text-3xl font-black uppercase italic tracking-tighter text-black">Verification <span className="text-red-500">Failed.</span></h1>
                                        <p className="text-zinc-400 text-[10px] uppercase font-black tracking-widest leading-loose max-w-md mx-auto italic">
                                            Unfortunately, we could not verify your documents. Your booking has been cancelled.
                                        </p>
                                    </div>
                                    <Link href="/" className="inline-block mt-4 bg-black text-white py-5 px-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-red-500 transition-colors shadow-2xl">
                                        Go Back Home
                                    </Link>
                                </motion.div>
                            </div>
                        ) : !paymentSuccess ? (
                            <>
                                <div className="lg:col-span-7 space-y-12">
                                    <header className="space-y-3">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-50 border border-black/[0.03]">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#526E48] animate-pulse" />
                                            <span className="text-[8px] font-black uppercase text-[#526E48] tracking-widest">Documents Verified /// Ready for Payment</span>
                                        </div>
                                        <h1 className="text-3xl lg:text-4xl font-black italic tracking-tighter uppercase leading-none text-black">Complete <span className="text-[#526E48]">Payment.</span></h1>
                                    </header>

                                    {/* Center Payment Info */}
                                    <div className="bg-white border border-black/[0.03] rounded-[3rem] p-16 text-center space-y-10 shadow-[0_30px_100px_rgba(0,0,0,0.06)]">
                                        <div className="w-24 h-24 bg-zinc-50 rounded-[2.5rem] mx-auto flex items-center justify-center border border-black/[0.01] shadow-inner">
                                            <svg width="40" height="40" fill="none" stroke="#526E48" strokeWidth="1.5" viewBox="0 0 24 24">
                                                <rect x="2" y="5" width="20" height="14" rx="3" strokeLinecap="round" />
                                                <path d="M2 10h20" strokeLinecap="round" />
                                                <circle cx="17" cy="15" r="1.5" fill="#526E48" />
                                            </svg>
                                        </div>
                                        <div className="space-y-3">
                                            <h2 className="text-base font-black uppercase tracking-[0.2em] italic text-black">Secure Payment Gateway</h2>
                                            <p className="text-zinc-400 text-[10px] uppercase font-black tracking-widest leading-loose px-6 italic">Secure payment processing via Razorpay. Supported methods include Credit/Debit Cards, UPI, and Netbanking.</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleRazorpayPayment}
                                        disabled={isProcessing}
                                        className="w-full bg-black text-white hover:bg-[#526E48] py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {isProcessing ? "Processing Payment..." : `Pay Now — ₹${booking.totalPrice.toLocaleString()}`}
                                    </button>
                                </div>

                                {/* Summary Sidebar */}
                                {summarySidebar}
                            </>
                        ) : (
                            <div className="lg:col-span-12 max-w-2xl mx-auto w-full">
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-[#526E48]/10 rounded-[3rem] p-12 text-center space-y-12 shadow-[0_30px_100px_rgba(82,110,72,0.06)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#526E48] shadow-lg shadow-[#526E48]/20" />
                                    <div className="w-24 h-24 bg-[#526E48]/5 rounded-full mx-auto flex items-center justify-center border border-[#526E48]/10 shadow-inner">
                                        <svg width="36" height="36" fill="none" stroke="#526E48" strokeWidth="4" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                                    </div>

                                    <div className="space-y-3">
                                        <h1 className="text-3xl lg:text-4xl font-black uppercase italic tracking-tighter text-black">Reservation <span className="text-[#526E48]">Confirmed.</span></h1>
                                        <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em] italic">Your car is ready for you! Thank you for booking with us.</p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 text-left bg-zinc-50 p-8 rounded-[2rem] border border-black/[0.01] shadow-inner font-mono">
                                        <div className="flex justify-between items-center py-3 border-b border-black/[0.03]">
                                            <span className="text-[9px] uppercase text-zinc-300 font-black tracking-widest italic">Payment ID</span>
                                            <span className="text-[10px] text-[#526E48] font-black break-all ml-8 italic">{paymentDetails?.paymentId}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 border-b border-black/[0.03]">
                                            <span className="text-[9px] uppercase text-zinc-300 font-black tracking-widest italic">Order ID</span>
                                            <span className="text-[10px] text-zinc-500 font-black italic">{paymentDetails?.orderId}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 border-b border-black/[0.03]">
                                            <span className="text-[9px] uppercase text-zinc-300 font-black tracking-widest italic">Vehicle</span>
                                            <span className="text-[10px] text-zinc-500 font-black italic">{paymentDetails?.carName}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-4">
                                            <span className="text-[9px] uppercase text-zinc-400 font-black tracking-[0.3em] italic">Amount Paid</span>
                                            <span className="text-2xl text-black font-black italic tracking-tighter">₹{paymentDetails?.amount.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-5 pt-8">
                                        <Link href="/bookings/history" className="flex items-center justify-center gap-4 w-full bg-black text-white hover:bg-[#526E48] py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] transition-all shadow-[0_20px_50px_rgba(0,0,0,0.2)] active:scale-95 italic">
                                            View Booking History
                                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                                        </Link>
                                        <Link href="/cars" className="flex items-center justify-center gap-4 w-full bg-transparent border border-black/[0.03] hover:bg-zinc-50 text-zinc-400 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] transition-all active:scale-95 italic">
                                            Browse More Cars
                                        </Link>
                                        <p className="text-[8px] text-zinc-400 font-black uppercase tracking-[0.5em] pt-6 italic">Receipt sent to your registered email</p>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
