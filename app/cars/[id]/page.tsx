"use client";

import { useEffect, useState, use, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/services/api";
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
}

const LUXURY_PLACEHOLDERS = [
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=2000",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=2000",
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=2000",
    "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=2000",
];

const getImageUrl = (img?: string) => {
    if (!img || img === "" || img === "null") return LUXURY_PLACEHOLDERS[0];
    if (img.startsWith("http")) return img;
    return `http://localhost:5000/uploads/${img}`;
};

export default function CarDetailsPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#526E48] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <CarDetailsContent id={params.id} />
        </Suspense>
    );
}

function CarDetailsContent({ id }: { id: string }) {
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
                } else {
                    const payload = JSON.parse(atob(token.split(".")[1]));
                    setUsername(payload.name || payload.username || payload.email || "User");
                }
            } else {
                setIsLoggedIn(false);
            }
        } catch { }
    }, []);

    const [plan, setPlan] = useState<"daily" | "weekly" | "monthly" | "custom">("daily");
    const [serviceType, setServiceType] = useState<"self" | "driver">((searchParams.get("type") || "self") as "self" | "driver");
    const [pickupDate, setPickupDate] = useState(searchParams.get("start") || "");
    const [dropDate, setDropDate] = useState(searchParams.get("end") || "");

    const getDaysForPlan = () => {
        if (plan === "monthly") return 30;
        if (plan === "weekly") return 7;
        if (plan === "daily") return 1;
        if (pickupDate && dropDate) {
            return Math.max(1, Math.ceil((new Date(dropDate).getTime() - new Date(pickupDate).getTime()) / (1000 * 3600 * 24)) + 1);
        }
        return 1;
    };
    const days = getDaysForPlan();

    // Surgical Multi-Rate Plan Logic - Silently Applying
    const getMultiplier = () => {
        if (plan === "monthly") return 0.75; // 25% Off Silently
        if (plan === "weekly") return 0.85;  // 15% Off Silently
        return 1.0;
    };

    const currentRate = car ? Math.round(car.pricePerDay * getMultiplier()) : 0;
    const baseTotal = currentRate * days;
    const grandTotal = baseTotal;



    useEffect(() => {
        const fetchCarDetails = async () => {
            try {
                const res = await apiFetch(`/cars/${id}`);
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

    if (loading || !car) return null;

    const userGallery = [car.image, ...(car.gallery || [])].filter(Boolean);
    const displayGallery = [...userGallery, ...LUXURY_PLACEHOLDERS].slice(0, 3);

    return (
        <div className="relative min-h-screen bg-white text-black selection:bg-[#526E48]/30 overflow-x-hidden font-sans antialiased text-[10px]">
            {/* Header / Navbar */}
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
                            <span className="text-[10px] uppercase font-black tracking-widest text-[#526E48] leading-none truncate max-w-[120px]">{username || "User"}</span>
                        </div>
                        <div className="h-6 w-px bg-black/10" />
                        <div className="relative">
                            <button
                                onClick={() => setShowLogout(!showLogout)}
                                className="group flex items-center justify-center w-8 h-8 rounded-full border border-red-500/20 bg-red-500/5 hover:bg-red-500 hover:border-red-500 transition-all active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                                title="Logout"
                            >
                                <svg className="w-3.5 h-3.5 text-red-500 group-hover:text-white transition-colors ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                            {showLogout && (
                                <div className="absolute right-0 top-full mt-2 z-50">
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-red-500/40 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] text-red-500 hover:bg-red-500 hover:text-white transition-all whitespace-nowrap shadow-2xl"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            <main className="max-w-[1300px] mx-auto pt-28 px-8 pb-40">
                {/* Balanced Breadcrumb */}
                <div className="flex items-center gap-3 mb-10 text-[8px] font-black uppercase tracking-[0.25em] text-zinc-500">
                    <span className="hover:text-black transition-colors cursor-pointer uppercase">{car.location}, KERALA</span>
                    <span className="text-black/5">/</span>
                    <span className="hover:text-black transition-colors cursor-pointer uppercase">{car.category}</span>
                    <span className="text-black/5">/</span>
                    <span className="text-[#526E48]/70 uppercase">{car.name}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Hero Left */}
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
                                    <AnimatePresence mode="wait">
                                        <motion.div key={activeImage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                                            <Image src={activeImage || getImageUrl(car.image)} alt={car.name} fill className="object-cover group-hover:scale-[1.02] transition-transform duration-[3000ms]" priority unoptimized />
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {displayGallery.map((img, i) => (
                                        <button key={i} onClick={() => setActiveImage(getImageUrl(img))} className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all ${activeImage === getImageUrl(img) ? 'border-[#526E48]' : 'border-black/5 opacity-50 hover:opacity-100 hover:border-black/20'}`}>
                                            <Image src={getImageUrl(img)} alt={`thumb-${i}`} fill className="object-cover" unoptimized />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    { icon: "🪑", label: "Capacity", value: `${car.seats} Seats` },
                                    { icon: "⚙️", label: "Transmission", value: car.transmission },
                                    { icon: "⛽", label: "Fuel Type", value: "Hybrid" },
                                    { icon: "🏎️", label: "Max Power", value: "Premium" },
                                ].map((spec) => (
                                    <div key={spec.label} className="bg-white border border-black/5 rounded-xl p-4 flex flex-col items-center gap-1 hover:border-[#526E48]/30 transition-colors pointer-events-none">
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
                                    {car.description || `The ${car.name} ${car.model} is maintained to showroom perfection. Available for premium rental in ${car.location}. Meticulously cleaned and sanitized for your safety.`}
                                </p>
                            </div>
                        </section>
                    </div>

                    {/* Right Col: Booking Sidebar with Plan Switching Logic */}
                    <div className="lg:col-span-5">
                        <div className="sticky top-28 bg-white border border-black/5 rounded-[2.5rem] p-7 space-y-7 shadow-xl">
                            <div className="flex justify-between items-end border-b border-black/5 pb-6">
                                <div>
                                    <h3 className="text-2xl font-black italic tracking-tighter text-[#526E48]">₹{currentRate.toLocaleString()} <span className="text-zinc-500 text-[8px] uppercase not-italic tracking-widest font-black ml-1.5">/ {plan === 'daily' ? 'Day' : plan === 'weekly' ? 'Weekly Rate' : 'Monthly Rate'}</span></h3>
                                </div>
                                <div className="bg-[#526E48]/10 px-3 py-1 rounded-full border border-[#526E48]/20">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-[#526E48]">Elite Status</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Select Booking Duration</p>
                                        <span className="text-[7px] font-black uppercase tracking-tighter text-[#526E48]">Plan rate active</span>
                                    </div>
                                    <div className="flex gap-2 bg-white p-1 rounded-xl border border-black/5">
                                        {["daily", "weekly", "monthly", "custom"].map((p) => (
                                            <button key={p} onClick={() => setPlan(p as any)} className={`flex-1 py-2.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${plan === p ? "bg-[#526E48] text-white shadow-lg shadow-[#526E48]/20 font-bold" : "text-black/40 hover:text-black"}`}>{p}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Service Logic</p>
                                    <div className="flex gap-2 bg-white p-1 rounded-xl border border-black/5">
                                        <button onClick={() => setServiceType("self")} className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${serviceType === "self" ? "bg-[#526E48] text-white shadow-lg shadow-[#526E48]/20" : "text-black/40 hover:text-black"}`}>Self Drive</button>
                                        <button onClick={() => setServiceType("driver")} className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${serviceType === "driver" ? "bg-[#526E48] text-white shadow-lg shadow-[#526E48]/20" : "text-black/40 hover:text-black"}`}>With Driver</button>
                                    </div>
                                </div>

                                {plan === "custom" && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <LuxuryDatePicker
                                            label="Pick-Up"
                                            placeholder="Select Date"
                                            value={pickupDate}
                                            onChange={setPickupDate}
                                            minDate={new Date().toISOString().split("T")[0]}
                                        />
                                        <LuxuryDatePicker
                                            label="Return"
                                            placeholder="Select Date"
                                            value={dropDate}
                                            onChange={setDropDate}
                                            minDate={pickupDate || new Date().toISOString().split("T")[0]}
                                        />
                                    </div>
                                )}



                                <div className="bg-white p-5 rounded-2xl border border-black/5 space-y-3">
                                    <div className="flex justify-between items-center text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                        <span>Plan Calculation ({days} {days === 1 ? 'Day' : 'Days'})</span>
                                        <span className="text-black">₹{baseTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="h-px bg-black/5" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-black uppercase tracking-widest italic">Proceed to Pay</span>
                                        <span className="text-2xl font-black italic text-[#526E48]">₹{grandTotal.toLocaleString()}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        if (!car.isAvailable) return;
                                        if (!isLoggedIn) {
                                            router.push("/register");
                                            return;
                                        }

                                        let finalPickup = pickupDate;
                                        let finalDrop = dropDate;

                                        if (plan !== "custom") {
                                            finalPickup = new Date().toISOString().split("T")[0];
                                            const dropDateObj = new Date();
                                            dropDateObj.setDate(dropDateObj.getDate() + days - 1);
                                            finalDrop = dropDateObj.toISOString().split("T")[0];
                                        } else if (!pickupDate || !dropDate) {
                                            return;
                                        }

                                        const params = new URLSearchParams({ start: finalPickup, end: finalDrop, type: serviceType, plan });
                                        router.push(`/bookings/confirm/${car._id}?${params.toString()}`);
                                    }}
                                    disabled={!car.isAvailable || (plan === "custom" && (!pickupDate || !dropDate))}
                                    className={`w-full py-4.5 rounded-2xl text-[10px] font-black uppercase italic tracking-[0.2em] shadow-lg transition-all active:scale-95 ${!car.isAvailable
                                        ? "bg-red-500/10 text-red-500/70 border border-red-500/20 cursor-not-allowed"
                                        : (plan === "custom" && (!pickupDate || !dropDate))
                                            ? "bg-black/5 text-zinc-400 border border-black/5 cursor-not-allowed opacity-50 shadow-none"
                                            : "bg-[#526E48] text-white shadow-[#526E48]/20 hover:bg-[#3E5336]"
                                        }`}
                                >
                                    {!car.isAvailable
                                        ? "Currently Booked — Elite Hold"
                                        : (plan === "custom" && (!pickupDate || !dropDate))
                                            ? "Select Rental Window"
                                            : `Instant Reservation — ₹${grandTotal.toLocaleString()}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recommended Rides */}
                {similarCars.length > 0 && (
                    <section className="mt-32 pt-20 border-t border-black/5 space-y-10">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black uppercase italic tracking-tighter">Recommended <span className="text-[#526E48]">Rides</span></h2>
                            <Link href="/cars" className="text-[8px] font-black uppercase tracking-widest text-[#526E48] border-b border-[#526E48]/30">Explore Entire Fleet</Link>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {similarCars.map((sc) => (
                                <Link key={sc._id} href={`/cars/${sc._id}`} className="group space-y-4 flex flex-col">
                                    <div className="relative aspect-[4/3] rounded-[1.5rem] overflow-hidden bg-white border border-black/[0.03] group-hover:border-[#526E48]/40 transition-all duration-500 shadow-xl">
                                        <Image src={getImageUrl(sc.image)} alt={sc.name} fill className="object-cover group-hover:scale-110 transition-transform duration-[2000ms] opacity-80 group-hover:opacity-100" unoptimized />
                                    </div>

                                    <button className="w-full bg-white group-hover:bg-[#526E48] border border-black/5 group-hover:border-[#526E48] text-[#526E48] group-hover:text-white py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all duration-300 shadow-md">
                                        Complete Details →
                                    </button>

                                    <div className="px-2 space-y-1">
                                        <h3 className="text-[10px] font-black uppercase italic tracking-tighter group-hover:text-[#526E48] transition-colors duration-300 text-black">{sc.name}</h3>
                                        <div className="flex items-center justify-between mt-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[#526E48] font-black italic text-[11px]">₹{sc.pricePerDay.toLocaleString()}</span>
                                                <span className="text-[6px] font-bold text-zinc-500 uppercase tracking-widest">/ Day</span>
                                            </div>
                                            <span className="text-[7px] font-black uppercase tracking-widest text-black bg-[#526E48]/5 px-2 py-0.5 rounded-sm border border-[#526E48]/10">Elite</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}

