"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { apiFetch, getImageUrl } from "@/services/api";
import LuxuryDatePicker from "@/components/ui/DatePicker";

interface Car {
    _id: string;
    name: string;
    model: string;
    year: number;
    pricePerDay: number;
    seats: number;
    transmission: string;
    location: string;
    category: string;
    image: string;
    gallery?: string[];
    selfDrive: boolean;
    withDriver: boolean;
    description?: string;
    isAvailable: boolean;
    availableFrom?: string;
}

const LUXURY_PLACEHOLDERS = [
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=2000",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=2000",
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=2000",
    "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=2000",
];

export default function CarDetailsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#526E48] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <CarDetailsContent />
        </Suspense>
    );
}

function CarDetailsContent() {
    const params = useParams();
    const id = params?.id as string;
    const searchParams = useSearchParams();
    const router = useRouter();
    const [car, setCar] = useState<Car | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState<string>("");
    const [username, setUsername] = useState("");
    const [similarCars, setSimilarCars] = useState<Car[]>([]);
    const [showLogout, setShowLogout] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        try {
            const token = localStorage.getItem("accessToken");
            if (token) {
                const userStr = localStorage.getItem("user");
                setIsLoggedIn(true);
                if (userStr) {
                    const userObj = JSON.parse(userStr);
                    setUsername(userObj.name || userObj.username || userObj.email || "User");
                }
            } else {
                setIsLoggedIn(false);
            }
        } catch { }
    }, []);

    const initialStart = searchParams.get("start") || "";
    const initialEnd = searchParams.get("end") || "";
    const [plan, setPlan] = useState<"daily" | "weekly" | "monthly" | "custom">(
        initialStart && initialEnd ? "custom" : "daily"
    );
    const [serviceType] = useState<"self">("self");
    const [pickupDate, setPickupDate] = useState(initialStart);
    const [dropDate, setDropDate] = useState(initialEnd);

    const getDaysForPlan = () => {
        if (plan === "monthly") return 30;
        if (plan === "weekly") return 7;
        if (plan === "daily") return 1;
        if (pickupDate && dropDate) {
            return Math.max(1, Math.ceil((new Date(dropDate).getTime() - new Date(pickupDate).getTime()) / (1000 * 3600 * 24)));
        }
        return 1;
    };
    const days = getDaysForPlan();

    const getMultiplier = () => {
        if (plan === "monthly") return 0.75;
        if (plan === "weekly") return 0.85;
        return 1.0;
    };

    const currentRate = car ? Math.round(car.pricePerDay * getMultiplier()) : 0;
    const baseTotal = currentRate * days;
    const grandTotal = baseTotal;

    useEffect(() => {
        const fetchCarDetails = async () => {
            if (!id) return;
            try {
                const res = await apiFetch(`/cars/${id}`);
                if (!res.ok) throw new Error("Car not found");
                const data = await res.json();
                setCar(data);
                if (data.image) setActiveImage(getImageUrl(data.image));
            } catch (err: any) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCarDetails();
    }, [id]);

    useEffect(() => {
        if (!car) return;
        const fetchSimilar = async () => {
            try {
                const query = new URLSearchParams({ category: car.category });
                const res = await apiFetch(`/cars?${query.toString()}`);
                const data: Car[] = await res.json();
                setSimilarCars(data.filter((c) => c._id !== car._id).slice(0, 4));
            } catch { }
        };
        fetchSimilar();
    }, [car]);

    const handleLogout = () => {
        localStorage.clear();
        window.location.replace("/login");
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#526E48] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!car) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
            <h1 className="text-2xl font-black uppercase italic tracking-tighter text-black">Elite Asset <span className="text-red-500">Not Found</span></h1>
            <Link href="/cars" className="bg-black text-white px-8 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest hover:bg-[#526E48] transition-all">Return to Fleet</Link>
        </div>
    );

    const userGallery = [car.image, ...(car.gallery || [])].filter(Boolean);
    const displayGallery = [...userGallery, ...LUXURY_PLACEHOLDERS].slice(0, 3);

    return (
        <div className="relative min-h-screen bg-white text-black selection:bg-[#526E48]/30 overflow-x-hidden font-sans antialiased text-[10px]">
            {/* Navbar */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-white/60 backdrop-blur-xl border-b border-black/[0.04] px-8 h-14 flex items-center justify-between">
                <Link href="/cars" className="p-2 border border-black/10 rounded-full hover:bg-[#526E48] hover:text-white transition-all text-[#526E48]">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                </Link>
                <div className="flex items-center gap-3">
                    <div className="bg-[#526E48] px-2 py-0.5 rounded text-[9px] text-white font-black italic -skew-x-12">RG</div>
                    <span className="text-base font-black tracking-tighter uppercase italic text-black">Rental_<span className="text-[#526E48]">Garage</span></span>
                </div>
                {!isLoggedIn ? (
                    <div className="w-8 h-8" />
                ) : (
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-[7px] font-bold text-zinc-500 tracking-[0.2em] leading-none mb-1">Signed In</span>
                            <span className="text-[10px] uppercase font-black tracking-widest text-[#526E48] leading-none truncate max-w-[120px]">{username}</span>
                        </div>
                        <button onClick={() => setShowLogout(!showLogout)} className="w-8 h-8 rounded-full border border-red-500/20 bg-red-500/5 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                            <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                    </div>
                )}
            </nav>

            <main className="max-w-[1300px] mx-auto pt-28 px-8 pb-40">
                <div className="flex items-center gap-3 mb-10 text-[8px] font-black uppercase tracking-[0.25em] text-zinc-500">
                    <span className="uppercase">{car.location}, KERALA</span>
                    <span className="text-black/5">/</span>
                    <span className="uppercase">{car.category}</span>
                    <span className="text-black/5">/</span>
                    <span className="text-[#526E48]/70 uppercase">{car.name}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-7 space-y-10">
                        <section className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-4">
                                    <span className="bg-[#526E48] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-sm italic">{car.category}</span>
                                    <span className="text-zinc-600 text-[9px] font-black uppercase tracking-widest">{car.year} • Verified Elite Fleet</span>
                                </div>
                                <h1 className="text-3xl lg:text-4xl font-black uppercase italic tracking-tighter leading-none text-black">
                                    {car.name} <span className="text-[#526E48]">{car.model}</span>
                                </h1>
                            </div>

                            <div className="space-y-4">
                                <div className="relative aspect-[16/9] rounded-[2rem] overflow-hidden bg-white border border-black/5 flex items-center justify-center shadow-xl group">
                                    <Image src={activeImage || getImageUrl(car.image)} alt={car.name} fill className="object-cover group-hover:scale-[1.02] transition-transform duration-[3000ms]" priority unoptimized />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {displayGallery.map((img, i) => (
                                        <button key={i} onClick={() => setActiveImage(getImageUrl(img))} className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all ${activeImage === getImageUrl(img) ? 'border-[#526E48]' : 'border-black/5 opacity-50 hover:opacity-100'}`}>
                                            <Image src={getImageUrl(img)} alt={`thumb-${i}`} fill className="object-cover" unoptimized />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    { icon: "🪑", label: "Capacity", value: `${car.seats} Seats` },
                                    { icon: "⚙️", label: "Transmission", value: car.transmission },
                                    { icon: "⛽", label: "Fuel", value: "Premium" },
                                    { icon: "🏎️", label: "Ride", value: "Elite" },
                                ].map((spec) => (
                                    <div key={spec.label} className="bg-white border border-black/5 rounded-xl p-4 flex flex-col items-center gap-1">
                                        <span className="text-xl mb-0.5">{spec.icon}</span>
                                        <span className="text-[10px] font-black uppercase italic text-black">{spec.value}</span>
                                        <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest">{spec.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4 pt-4 border-t border-black/[0.03]">
                                <h2 className="text-sm font-black uppercase italic tracking-tighter flex items-center gap-3 text-black">
                                    <div className="w-8 h-0.5 bg-[#526E48]" /> Overview
                                </h2>
                                <p className="text-[10px] leading-relaxed text-zinc-500 font-medium whitespace-pre-wrap max-w-xl">
                                    {car.description || `The ${car.name} is maintained to showroom perfection.`}
                                </p>
                            </div>
                        </section>
                    </div>

                    <div className="lg:col-span-5">
                        <div className="sticky top-28 bg-white border border-black/5 rounded-[2.5rem] p-7 space-y-7 shadow-xl">
                            <div className="flex justify-between items-end border-b border-black/5 pb-6">
                                <div>
                                    <h3 className="text-2xl font-black italic tracking-tighter text-[#526E48]">₹{currentRate.toLocaleString()} <span className="text-zinc-500 text-[8px] uppercase not-italic tracking-widest font-black ml-1.5">/ {plan}</span></h3>
                                </div>
                                <div className="bg-[#526E48]/10 px-3 py-1 rounded-full border border-[#526E48]/20">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-[#526E48]">Elite Status</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Duration</p>
                                    <div className="flex gap-1 bg-white p-1 rounded-xl border border-black/5">
                                        {["daily", "weekly", "monthly", "custom"].map((p) => (
                                            <button key={p} onClick={() => setPlan(p as any)} className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest ${plan === p ? "bg-[#526E48] text-white" : "text-black/40 hover:text-black"}`}>{p}</button>
                                        ))}
                                    </div>
                                </div>



                                {plan === "custom" && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <LuxuryDatePicker label="Pick-Up" placeholder="Date" value={pickupDate} onChange={setPickupDate} />
                                        <LuxuryDatePicker label="Return" placeholder="Date" value={dropDate} onChange={setDropDate} />
                                    </div>
                                )}

                                <div className="bg-[#F8F9F3] p-6 rounded-2xl border border-black/5 space-y-4">
                                    <div className="pb-4 border-b border-black/[0.03]">
                                        <h4 className="text-sm font-black uppercase italic tracking-tighter text-black">{car.name} <span className="text-[#526E48]">{car.model}</span></h4>
                                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">{car.transmission} • {car.category} • {car.seats} Seats</p>
                                    </div>
                                    <div className="space-y-2.5">
                                        <div className="flex justify-between items-start text-[10px] font-bold text-zinc-500 tracking-widest uppercase">
                                            <span>Pickup</span>
                                            <span className="text-black text-right">{car.location}<br/>{pickupDate ? new Date(pickupDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : 'TBD'} - 10:00 AM</span>
                                        </div>
                                        <div className="flex justify-between items-start text-[10px] font-bold text-zinc-500 tracking-widest uppercase mt-2">
                                            <span>Return</span>
                                            <span className="text-black text-right">{dropDate ? new Date(dropDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : (plan !== "custom" ? new Date(new Date().setDate(new Date().getDate() + days - 1)).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : 'TBD')} - 6:00 PM</span>
                                        </div>
                                    </div>
                                    <div className="h-px bg-black/[0.03] my-4" />
                                    <div className="space-y-2.5">
                                        <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 tracking-widest uppercase">
                                            <span>Duration</span>
                                            <span className="text-black">{days} {days === 1 ? 'Day' : 'Days'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 tracking-widest uppercase">
                                            <span>Price / Day</span>
                                            <span className="text-black">₹{currentRate.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="h-px bg-black/5 my-4" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] font-black text-black uppercase tracking-widest italic">Total Investment</span>
                                        <span className="text-3xl font-black italic text-[#526E48]">₹{grandTotal.toLocaleString()}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        if (!car.isAvailable) return;
                                        if (!isLoggedIn) { router.push("/register"); return; }
                                        let finalPickup = pickupDate || new Date().toISOString().split("T")[0];
                                        let finalDrop = dropDate || new Date().toISOString().split("T")[0];
                                        if (plan !== "custom") {
                                            const dObj = new Date(); dObj.setDate(dObj.getDate() + days - 1);
                                            finalDrop = dObj.toISOString().split("T")[0];
                                        }
                                        const params = new URLSearchParams({ start: finalPickup, end: finalDrop, plan });
                                        router.push(`/bookings/confirm/${car._id}?${params.toString()}`);
                                    }}
                                    disabled={!car.isAvailable || (plan === "custom" && (!pickupDate || !dropDate))}
                                    className={`w-full py-4.5 rounded-2xl text-[10px] font-black uppercase italic tracking-[0.2em] transition-all ${!car.isAvailable ? "bg-red-500/10 text-red-500" : "bg-[#526E48] text-white shadow-lg"}`}
                                >
                                    {!car.isAvailable ? "Booked — Elite Hold" : `Instant Reservation — ₹${grandTotal.toLocaleString()}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
