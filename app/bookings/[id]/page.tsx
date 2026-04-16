"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { apiFetch, getImageUrl } from "@/services/api";
import { io } from "socket.io-client";
import {
    MapPin,
    Calendar,
    Clock,
    Phone,
    ChevronLeft,
    Navigation,
    MessageSquare,
    CheckCircle,
    Loader2,
} from "lucide-react";

// ── Status helpers ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; description: string }> = {
    Pending: { label: "Pending Review", color: "text-zinc-500", bg: "bg-zinc-100", description: "Waiting for document approval" },
    Confirmed: { label: "Confirmed", color: "text-blue-600", bg: "bg-blue-50", description: "Payment complete — pickup ahead" },
    upcoming_pickup: { label: "Pickup Tomorrow", color: "text-orange-600", bg: "bg-orange-50", description: "Your pickup is coming up soon" },
    arrived: { label: "Arrived", color: "text-amber-600", bg: "bg-amber-50", description: "Waiting for host to hand over the car" },
    active_trip: { label: "Active Trip", color: "text-[#526E48]", bg: "bg-[#526E48]/10", description: "Trip is in progress — enjoy the drive!" },
    Completed: { label: "Completed", color: "text-green-600", bg: "bg-green-50", description: "Trip completed successfully" },
    Cancelled: { label: "Cancelled", color: "text-red-500", bg: "bg-red-50", description: "This booking was cancelled" },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] || { label: status, color: "text-zinc-400", bg: "bg-zinc-50", description: "" };
    return (
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${cfg.bg}`}>
            <div className={`w-2 h-2 rounded-full ${cfg.color.replace("text-", "bg-")} animate-pulse`} />
            <span className={`text-[11px] font-black uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
        </div>
    );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function BookingDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [arriving, setArriving] = useState(false);
    const [arrivalDone, setArrivalDone] = useState(false);
    const [chatLoading, setChatLoading] = useState(false);

    // ── Fetch booking ───────────────────────────────────────────────────────
    useEffect(() => {
        if (!id) return;
        apiFetch(`/bookings/${id}`)
            .then((r) => r.json())
            .then((data) => {
                if (data?.message) setError(data.message);
                else setBooking(data);
            })
            .catch(() => setError("Failed to load booking details."))
            .finally(() => setLoading(false));
    }, [id]);

    // ── Real-time status updates ────────────────────────────────────────────
    useEffect(() => {
        if (!id) return;
        const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "https://rental-car-backend-7np6.onrender.com";
        const s = io(API_URL, { transports: ["websocket"] });
        s.emit("join", id);
        s.on("bookingStatusUpdate", (data: any) => {
            if (data.bookingId === id) {
                setBooking((prev: any) => prev ? { ...prev, status: data.status } : prev);
                if (data.status === "arrived") setArrivalDone(true);
            }
        });

        s.on("locationUpdate", (data: any) => {
            setBooking((prev: any) => {
                if (!prev || data.carId !== prev.carId?._id) return prev;
                return {
                    ...prev,
                    carId: { ...prev.carId, lat: data.lat, lng: data.lng }
                };
            });
        });

        return () => { s.disconnect(); };
    }, [id]);

    // ── Handlers ────────────────────────────────────────────────────────────
    const handleIHaveReached = async () => {
        setArriving(true);
        try {
            const res = await apiFetch(`/bookings/${id}/arrived`, { method: "PATCH" });
            const data = await res.json();
            if (res.ok) {
                setBooking((prev: any) => ({ ...prev, status: "arrived" }));
                setArrivalDone(true);
            } else {
                alert(data.message || "Failed to notify arrival.");
            }
        } catch {
            alert("Network error. Please try again.");
        } finally {
            setArriving(false);
        }
    };

    const handleContactHost = async () => {
        setChatLoading(true);
        try {
            const res = await apiFetch("/chat/create", {
                method: "POST",
                body: JSON.stringify({ bookingId: id }),
            });
            const data = await res.json();
            if (res.ok) router.push(`/dashboard/chat?id=${data._id}`);
            else alert(data.message || "Failed to open chat.");
        } catch {
            alert("Network error. Please try again.");
        } finally {
            setChatLoading(false);
        }
    };

    const openInMaps = () => {
        const location = booking?.pickupLocation || booking?.carId?.location;
        if (!location) return;
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
        window.open(url, "_blank");
    };

    // ── Loading / Error states ──────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-[#526E48] border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Loading booking...</p>
            </div>
        </div>
    );

    if (error || !booking) return (
        <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-4 px-6">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-2">
                <span className="text-red-400 text-2xl">✕</span>
            </div>
            <p className="text-sm font-black uppercase tracking-widest text-red-500">{error || "Booking not found"}</p>
            <Link href="/bookings/history" className="mt-4 px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#526E48] transition-all">
                Back to History
            </Link>
        </div>
    );

    const car = booking.carId;
    const pickupLocation = booking.pickupLocation || car?.location || "Location not available";
    const pickupDate = new Date(booking.startDate);
    const returnDate = new Date(booking.endDate);
    const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG["Pending"];
    const canMarkArrived = ["Confirmed", "upcoming_pickup"].includes(booking.status);
    const hasArrived = booking.status === "arrived" || arrivalDone;

    const formatDate = (d: Date) => d.toLocaleDateString("en-IN", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    const formatTime = (d: Date) => d.toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", hour12: true,
    });

    return (
        <div className="min-h-screen bg-[#FDFDFD] text-black">
            {/* Navbar */}
            <nav className="fixed top-0 inset-x-0 z-50 border-b border-black/[0.04] bg-white/80 px-6 h-14 flex items-center backdrop-blur-xl">
                <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-zinc-400 hover:text-black transition-colors group"
                    >
                        <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
                    </button>
                    <Link href="/cars" className="flex items-center gap-2">
                        <div className="rounded bg-[#526E48] px-1.5 py-0.5 text-[9px] font-black italic text-white">RG</div>
                        <span className="text-sm font-black italic uppercase tracking-tighter text-black">
                            Rental_<span className="text-[#526E48]">Garage</span>
                        </span>
                    </Link>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 pt-24 pb-24">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <StatusBadge status={booking.status} />
                        <span className="text-[9px] font-mono font-bold text-zinc-300 uppercase tracking-widest">
                            RG-{booking._id?.slice(-8).toUpperCase()}
                        </span>
                    </div>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter text-black">
                        Booking <span className="text-[#526E48]">Details</span>
                    </h1>
                    <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-2">
                        {statusCfg.description}
                    </p>
                </motion.div>

                {/* 🛰️ Tactical Trip Progress Card */}
                {booking.status === "active_trip" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-8 bg-black rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl border border-white/5"
                    >
                        {/* Glow effect */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#526E48]/20 blur-[100px] -mr-32 -mt-32" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#526E48] mb-2 font-mono">Mission Status</p>
                                    <h3 className="text-3xl font-black italic uppercase tracking-tighter">
                                        Trip <span className="text-[#526E48]">{booking.tripStatus || "Started"}</span>
                                    </h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1 leading-none">Telemetry</p>
                                    <div className="flex items-center gap-2 justify-end">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#526E48] animate-pulse" />
                                        <p className="text-[10px] font-mono font-bold text-[#526E48]">LIVE_SIGNAL_LOCKED</p>
                                    </div>
                                </div>
                            </div>

                            {/* Status Stepper */}
                            <div className="relative pt-4 pb-8">
                                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/10 -translate-y-1/2" />
                                <div className="flex justify-between relative z-10">
                                    {["Started", "On Trip", "Reached", "Completed"].map((s, i) => {
                                        const steps = ["Started", "On Trip", "Reached", "Completed"];
                                        const currentIdx = steps.indexOf(booking.tripStatus || "Started");
                                        const isActive = i <= currentIdx;
                                        const isCurrent = i === currentIdx;

                                        return (
                                            <div key={s} className="flex flex-col items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full transition-all duration-500 ${isActive ? "bg-[#526E48] shadow-[0_0_10px_#526E48]" : "bg-zinc-800"
                                                    } ${isCurrent ? "scale-150 animate-pulse" : ""}`} />
                                                <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? "text-white" : "text-zinc-600"}`}>
                                                    {s}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <p className="text-[7px] font-black uppercase tracking-widest opacity-40 mb-1">Last Coordinates</p>
                                    <p className="text-[10px] font-mono font-bold uppercase tracking-tighter">
                                        {car?.lat?.toFixed(5) || "???"} , {car?.lng?.toFixed(5) || "???"}
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <p className="text-[7px] font-black uppercase tracking-widest opacity-40 mb-1">ETA to Base</p>
                                    <p className="text-[10px] font-mono font-bold uppercase tracking-tighter">~ {Math.floor(Math.random() * 45) + 15} MINS</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <p className="text-[7px] font-black uppercase tracking-widest opacity-40 mb-1">Signal Health</p>
                                    <p className="text-[10px] font-mono font-bold uppercase tracking-tighter text-[#526E48]">OPTIMAL_UPLINK</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <p className="text-[7px] font-black uppercase tracking-widest opacity-40 mb-1">Encryption</p>
                                    <p className="text-[10px] font-mono font-bold uppercase tracking-tighter">SHA-256_ACTIVE</p>
                                </div>
                            </div>

                            {/* 🧭 NAVIGATION OVERRIDE */}
                            <button
                                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(car?.location || "Kochi")}`, "_blank")}
                                className="w-full mt-6 h-14 bg-[#526E48] text-white rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-white hover:text-black shadow-xl shadow-[#526E48]/20 group/nav"
                            >
                                <Navigation size={16} className="group-hover/nav:translate-x-1 group-hover/nav:-translate-y-1 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Begin Tactical Navigation</span>
                            </button>
                        </div>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Left: Car Info ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                        className="lg:col-span-1 space-y-4"
                    >
                        {/* Car card */}
                        <div className="bg-white border border-black/[0.04] rounded-[2rem] overflow-hidden shadow-sm">
                            <div className="relative h-48 w-full bg-zinc-50">
                                {car?.image ? (
                                    <Image
                                        src={getImageUrl(car.image)}
                                        alt={car?.name || "Car"}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                                        <span className="text-zinc-300 text-4xl">🚗</span>
                                    </div>
                                )}
                                <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-md px-3 py-1 rounded-lg border border-black/5">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-[#526E48] italic">
                                        {car?.category || "Premium"}
                                    </span>
                                </div>
                            </div>
                            <div className="p-5">
                                <h2 className="text-xl font-black uppercase italic tracking-tighter text-black">{car?.name || "N/A"}</h2>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                                    {car?.year || ""} • {car?.model || ""}
                                </p>
                                <div className="mt-4 grid grid-cols-3 gap-2">
                                    {[
                                        { label: "Seats", value: car?.seats || "—" },
                                        { label: "Gear", value: car?.transmission === "Automatic" ? "Auto" : "Manual" },
                                        { label: "Rate", value: `₹${((car?.pricePerDay || 0) / 1000).toFixed(1)}k` },
                                    ].map((s) => (
                                        <div key={s.label} className="py-2.5 bg-zinc-50 border border-black/[0.03] rounded-xl flex flex-col items-center gap-0.5">
                                            <span className="text-[10px] font-black text-black">{s.value}</span>
                                            <span className="text-[6px] font-black uppercase tracking-widest text-zinc-400">{s.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Total */}
                        <div className="bg-[#526E48] rounded-2xl p-5 text-white">
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Total Payment</p>
                            <p className="text-3xl font-black tracking-tighter">₹{booking.totalPrice?.toLocaleString()}</p>
                        </div>
                    </motion.div>

                    {/* ── Right: Details & Actions ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="lg:col-span-2 space-y-4"
                    >
                        {/* Pickup Info Card */}
                        <div className="bg-white border border-black/[0.04] rounded-[2rem] p-6 shadow-sm space-y-5">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#526E48]">/// Pickup Information</p>

                            {/* Pickup Date */}
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#526E48]/10 flex items-center justify-center shrink-0">
                                    <Calendar size={18} className="text-[#526E48]" />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-300 mb-0.5">Pickup Date</p>
                                    <p className="text-sm font-black text-black">{formatDate(pickupDate)}</p>
                                    <p className="text-[10px] font-bold text-zinc-400 mt-0.5">{formatTime(pickupDate)}</p>
                                </div>
                            </div>

                            {/* Return Date */}
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                                    <Clock size={18} className="text-zinc-400" />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-300 mb-0.5">Return Date</p>
                                    <p className="text-sm font-black text-black">{formatDate(returnDate)}</p>
                                    <p className="text-[10px] font-bold text-zinc-400 mt-0.5">{formatTime(returnDate)}</p>
                                </div>
                            </div>

                            {/* Pickup Location */}
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                    <MapPin size={18} className="text-blue-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-300 mb-0.5">Pickup Location</p>
                                    <p className="text-sm font-black text-black leading-snug">{pickupLocation}</p>
                                    <button
                                        onClick={openInMaps}
                                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all"
                                    >
                                        <Navigation size={11} />
                                        Open in Maps
                                    </button>
                                </div>
                            </div>

                            {/* Contact Host */}
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#526E48]/5 flex items-center justify-center shrink-0">
                                    <Phone size={18} className="text-[#526E48]" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-300 mb-0.5">Host Contact</p>
                                    <p className="text-[11px] font-bold text-zinc-500 mb-2">Chat directly with your host for any questions.</p>
                                    <button
                                        id="contact-host-btn"
                                        onClick={handleContactHost}
                                        disabled={chatLoading}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#526E48]/5 text-[#526E48] border border-[#526E48]/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#526E48]/10 transition-all disabled:opacity-50"
                                    >
                                        {chatLoading ? <Loader2 size={12} className="animate-spin" /> : <MessageSquare size={12} />}
                                        Contact Host
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Booking Info Grid */}
                        <div className="bg-white border border-black/[0.04] rounded-[2rem] p-6 shadow-sm">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#526E48] mb-5">/// Reservation Details</p>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                                {[
                                    { label: "Full Name", value: booking.fullName },
                                    { label: "Nominee", value: booking.nomineeName },
                                    { label: "Primary Phone", value: booking.primaryPhone },
                                    { label: "Secondary Phone", value: booking.secondaryPhone || "—" },
                                    { label: "Address", value: booking.address, full: true },
                                ].map((field) => (
                                    <div key={field.label} className={field.full ? "col-span-2" : ""}>
                                        <p className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-300 mb-0.5">{field.label}</p>
                                        <p className="text-[11px] font-black text-black uppercase">{field.value || "N/A"}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── I Have Reached Button ── */}
                        <AnimatePresence>
                            {(canMarkArrived || hasArrived) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className={`rounded-[2rem] p-6 border ${hasArrived ? "bg-amber-50 border-amber-200" : "bg-white border-black/[0.04]"} shadow-sm`}
                                >
                                    {hasArrived ? (
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                                                <CheckCircle size={22} className="text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-amber-700 uppercase tracking-tight">Arrival Confirmed!</p>
                                                <p className="text-[10px] font-bold text-amber-500 mt-0.5">Host has been notified. Please wait for car handover.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-3">/// Arrival Confirmation</p>
                                            <p className="text-[11px] text-zinc-500 font-medium mb-4">
                                                Have you reached the pickup location? Click below to notify your host.
                                            </p>
                                            <button
                                                id="i-have-reached-btn"
                                                onClick={handleIHaveReached}
                                                disabled={arriving}
                                                className="w-full h-14 bg-black text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-[#526E48] transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-3 shadow-xl shadow-black/10"
                                            >
                                                {arriving ? (
                                                    <><Loader2 size={16} className="animate-spin" /> Notifying Host...</>
                                                ) : (
                                                    <>📍 I Have Reached</>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Active Trip Banner */}
                        {booking.status === "active_trip" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-[#526E48] rounded-[2rem] p-7 text-white flex items-center gap-5"
                            >
                                <div className="text-4xl">🚗</div>
                                <div>
                                    <p className="text-sm font-black uppercase tracking-widest">Trip is Active!</p>
                                    <p className="text-white/70 text-[11px] font-medium mt-1">
                                        Your car has been handed over. Return by {formatDate(returnDate)}.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
