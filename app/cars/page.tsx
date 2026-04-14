"use client";

import { Suspense, useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { apiFetch, getImageUrl } from "@/services/api";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/Select";
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
    isAvailable: boolean;
    availableFrom?: string;
    ownerId?: {
        name: string;
        role: string;
    };
}

const fetchCars = async ({ category, location, bookingType, startDate, endDate }: any) => {
    const query = new URLSearchParams({
        category: category === "All" ? "" : category,
        location: location === "All" ? "" : location,
        start: startDate,
        end: endDate,
    });
    const res = await apiFetch(`/cars?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch cars");
    return res.json();
};

export default function CarListingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#013220] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <CarListingContent />
        </Suspense>
    );
}

function CarListingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [category, setCategory] = useState("All");
    const [location, setLocation] = useState(searchParams.get("location") || "All");

    const [startDate, setStartDate] = useState(searchParams.get("start") || "");
    const [endDate, setEndDate] = useState(searchParams.get("end") || "");
    const fleetRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState("");
    const [showLogout, setShowLogout] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [pendingBookings, setPendingBookings] = useState<any[]>([]);
    const [hasConfirmed, setHasConfirmed] = useState(false);

    useEffect(() => {
        if (searchParams.get("payment") === "success") {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 5000);
        }
    }, [searchParams]);

    useEffect(() => {
        try {
            const token = localStorage.getItem("accessToken");
            const userStr = localStorage.getItem("user");
            setIsLoggedIn(!!token);

            if (userStr) {
                const userObj = JSON.parse(userStr);
                setUsername(userObj.name || userObj.username || userObj.email || "User");
            } else if (token) {
                const payload = JSON.parse(atob(token.split(".")[1]));
                setUsername(payload.name || payload.username || payload.email || "User");
            }

            // Fetch user's pending bookings for notification
            if (token) {
                apiFetch("/bookings/user/bookings")
                    .then(res => res.json())
                    .then(data => {
                        if (Array.isArray(data)) {
                            const pending = data.filter((b: any) => b.status !== 'Confirmed' && b.status !== 'Cancelled');
                            setPendingBookings(pending);
                            const confirmed = data.some((b: any) => b.status === 'Confirmed');
                            setHasConfirmed(confirmed);
                        }
                    })
                    .catch(() => { });
            }
        } catch { }
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        window.location.replace("/login");
    };

    const { data: cars = [], isLoading: loading, refetch } = useQuery({
        queryKey: ["cars", { category, location, startDate, endDate }],
        queryFn: () => fetchCars({ category, location, startDate, endDate }),
    });

    const categories = ["All", "Wedding", "Luxury", "Family", "SUV", "Vintage"];
    const locations = ["All", "Kochi", "Trivandrum", "Kozhikode", "Malappuram", "Thrissur", "Palakkad", "Kannur", "Alappuzha", "Kottayam", "Wayanad"];

    const handleSearch = () => {
        if (fleetRef.current) {
            fleetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        refetch();
    };

    const handleCategoryClick = (cat: string) => {
        setCategory(cat);
        setTimeout(() => {
            if (fleetRef.current) {
                fleetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }, 100);
    };

    const handleViewDetails = (carId: string) => {
        if (!isLoggedIn) {
            router.push("/register");
            return;
        }
        const detailsUrl = `/cars/${carId}?start=${startDate}&end=${endDate}`;
        router.push(detailsUrl);
    };

    return (
        <div className="min-h-screen bg-white text-black selection:bg-[#526E48]/30">
            {/* Elegant Fixed Navbar */}
            <nav className="fixed top-0 inset-x-0 z-50 border-b border-black/[0.04] bg-white/60 px-8 h-14 flex items-center backdrop-blur-xl">
                <div className="mx-auto flex w-full max-w-[1700px] items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="rounded bg-[#526E48] px-1.5 py-0.5 text-[9px] font-black italic text-white">RG</div>
                        <span className="text-base font-black italic uppercase tracking-tighter text-black">Rental_<span className="text-[#526E48]">Garage</span></span>
                    </div>
                    <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest">
                        <Link href="/" className="text-black hover:text-[#526E48] transition-colors italic">Home</Link>
                        {!isLoggedIn ? (
                            <div className="flex items-center gap-6">
                                <Link href="/register" className="bg-black text-white px-5 py-2 rounded-xl hover:bg-[#526E48] transition-all shadow-lg italic">Request_Access</Link>
                            </div>
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
                    </div>
                </div>
            </nav>

            <div className="mx-auto max-w-[1700px] px-8 pt-24 pb-40">
                <header className="mb-6 flex flex-col md:flex-row items-center justify-center border-b border-black/[0.03] pb-6">
                    <div className="text-center">
                        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-xl lg:text-3xl font-black uppercase italic leading-tight tracking-tight text-black">
                            Explore <span className="text-[#526E48]">Elite</span> Archive
                        </motion.h1>
                        <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-zinc-400">Premium Asset Exchange • Kerala HQ</p>
                    </div>
                </header>

                <section className="mb-10 flex justify-center relative z-50">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[1100px] rounded-[2rem] border border-black/[0.05] bg-zinc-50 p-2 shadow-2xl border-b-2 border-b-[#526E48]/20 flex flex-col lg:flex-row items-center gap-3">
                        {/* Location */}
                        <div className="w-full lg:w-48 bg-white rounded-2xl h-14 flex items-center overflow-hidden shrink-0 border border-black/5">
                            <Select value={location} onValueChange={setLocation}>
                                <SelectTrigger className="border-none bg-transparent h-full w-full px-5 text-[10px] font-black uppercase tracking-widest">
                                    <div className="flex flex-col items-start gap-0.5">
                                        <span className="text-[7px] text-[#526E48] font-black tracking-widest">LOCATION</span>
                                        <SelectValue placeholder="Vector Origin" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-black/5">
                                    {locations.map(loc => (
                                        <SelectItem key={loc} value={loc} className="text-[10px] font-black uppercase py-3">
                                            {loc}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Pick-up */}
                        <div className="w-full lg:w-52 h-14 bg-white rounded-2xl border border-black/5 px-2 flex items-center">
                            <LuxuryDatePicker 
                                label="DEPLOYMENT" 
                                value={startDate} 
                                onChange={setStartDate} 
                                placeholder="Pick-up Date"
                            />
                        </div>

                        {/* Drop-off */}
                        <div className="w-full lg:w-52 h-14 bg-white rounded-2xl border border-black/5 px-2 flex items-center">
                            <LuxuryDatePicker 
                                label="RETRACTION" 
                                value={endDate} 
                                onChange={setEndDate} 
                                placeholder="Drop-off Date" 
                                minDate={startDate}
                            />
                        </div>

                        <div className="flex-1 flex flex-col md:flex-row items-center gap-3 w-full">
                            <button onClick={handleSearch} className="flex-1 h-14 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#526E48] transition-all active:scale-95 whitespace-nowrap shadow-xl">
                                Search Archive
                            </button>

                            {isLoggedIn && (
                                <button
                                    onClick={() => router.push(hasConfirmed ? '/bookings/history' : '/bookings/status')}
                                    className="flex-1 h-14 px-8 bg-white border border-black/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-[#526E48] hover:text-black transition-all flex items-center justify-center gap-3 whitespace-nowrap group shadow-sm"
                                >
                                    {hasConfirmed ? 'History Log' : 'View Status'}
                                    {pendingBookings.length > 0 ? (
                                        <div className="bg-[#526E48] text-white text-[8px] px-2 py-1 rounded-lg animate-pulse">
                                            {pendingBookings.length}
                                        </div>
                                    ) : (
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#526E48]/20 group-hover:bg-[#526E48] transition-colors" />
                                    )}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </section>

                {/* Fleet Hub with Reduced Margin */}
                <section ref={fleetRef} className="space-y-8">
                    <div className="flex flex-col items-center gap-6">
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                            {categories.map(cat => (
                                <button key={cat} onClick={() => handleCategoryClick(cat)} className={`px-4 py-1.5 whitespace-nowrap rounded-lg text-[8px] font-black uppercase border transition-all ${category === cat ? "bg-black border-transparent text-white shadow-xl" : "border-black/5 text-zinc-400 hover:text-black hover:bg-black/5"}`}>
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="w-6 h-[1px] bg-[#526E48]/20" />
                            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[#526E48] italic">{cars.length} Elite Assets Online</p>
                            <span className="w-6 h-[1px] bg-[#526E48]/20" />
                        </div>
                    </div>

                    <AnimatePresence mode="popLayout">
                        {loading ? (
                            <div className="flex flex-col items-center gap-6 py-32">
                                <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#526E48] border-t-transparent" />
                                <p className="text-[10px] font-black tracking-[0.4em] text-[#526E48] animate-pulse uppercase">Syncing Fleet...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {cars.map((car: Car, idx: number) => (
                                    <motion.article key={car._id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="group relative border border-black/[0.05] bg-[#F8F9F3] rounded-[2.8rem] overflow-hidden hover:border-[#526E48]/40 transition-all shadow-xl">
                                        <div className="relative h-64 w-full overflow-hidden">
                                            <Image src={getImageUrl(car.image)} alt={car.name} fill className="object-cover transition-transform duration-1000 group-hover:scale-[1.05]" unoptimized />
                                            <div className="absolute top-5 left-5 bg-white/60 backdrop-blur-md px-4 py-1.5 rounded-xl border border-black/5 flex items-center gap-2">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-[#526E48] italic px-1">{car.category}</span>
                                                {car.ownerId?.role === 'customer' && (
                                                    <div className="flex items-center gap-1.5 ml-1 border-l border-black/10 pl-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-blue-500">Host Provided</span>
                                                    </div>
                                                )}
                                                {!car.isAvailable && (
                                                    <>
                                                        <div className="w-px h-3 bg-white/10 mx-1" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-red-500 italic px-1">Booked</span>
                                                    </>
                                                )}
                                            </div>
                                            {!car.isAvailable && (
                                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
                                                    <div className="border-2 border-red-500/50 px-6 py-2 rounded-full transform -rotate-12 flex flex-col items-center">
                                                        <span className="text-2xl font-black uppercase tracking-[0.2em] text-red-500/90 italic">Booked</span>
                                                        {car.availableFrom && (
                                                            <span className="text-[10px] font-bold text-red-500/80 uppercase tracking-widest mt-1">Available on {new Date(car.availableFrom).toLocaleDateString()}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className={`p-7 space-y-7 ${!car.isAvailable ? 'opacity-50' : ''}`}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-xl font-black uppercase italic tracking-tighter group-hover:text-[#526E48] transition-colors text-black">{car.name}</h3>
                                                    <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest mt-1">{car.year} • {car.model}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-black text-[#526E48] italic">₹{car.pricePerDay.toLocaleString()}</p>
                                                    <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest mt-1">/ Day</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    { v: car.seats, l: "Seats" },
                                                    { v: car.transmission === 'Automatic' ? 'Auto' : 'Manual', l: "Gear" },
                                                    { v: "4.9", l: "Elite", olive: true }
                                                ].map((s, i) => (
                                                    <div key={i} className="py-3 bg-black/[0.02] border border-black/[0.04] rounded-2xl flex flex-col items-center gap-1">
                                                        <span className={`text-[11px] font-black ${s.olive ? 'text-[#526E48]' : 'text-black'}`}>{s.v}</span>
                                                        <span className="text-[7px] font-black uppercase tracking-widest text-zinc-600">{s.l}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <button
                                                onClick={() => car.isAvailable && handleViewDetails(car._id)}
                                                disabled={!car.isAvailable}
                                                className={`w-full h-11 border border-black/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] transition-all shadow-xl ${!car.isAvailable
                                                    ? 'bg-red-500/10 text-red-500/70 border-red-500/20 cursor-not-allowed'
                                                    : 'bg-white text-[#526E48] hover:bg-[#526E48] hover:text-white hover:border-transparent'
                                                    }`}
                                            >
                                                {car.isAvailable ? 'Complete Details' : `Return: ${car.availableFrom ? new Date(car.availableFrom).toLocaleDateString() : 'TBD'}`}
                                            </button>
                                        </div>
                                    </motion.article>
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                </section>
            </div>
        </div>
    );
}
