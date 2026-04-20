"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { apiFetch, getImageUrl } from "@/services/api";
import LuxuryDatePicker from "@/components/ui/DatePicker";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });
const Circle = dynamic(() => import("react-leaflet").then(mod => mod.Circle), { ssr: false });

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
    lat?: number;
    lng?: number;
    ownerId?: any;
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

// ── Kerala City Coordinates Lookup ──────────────────────────────────────────
const KERALA_CITY_COORDS: Record<string, [number, number]> = {
    "MALAPPURAM": [11.0730, 76.0740],
    "KOZHIKODE": [11.2588, 75.7804],
    "CALICUT": [11.2588, 75.7804],
    "THRISSUR": [10.5276, 76.2144],
    "PALAKKAD": [10.7867, 76.6548],
    "KANNUR": [11.8745, 75.3704],
    "KASARAGOD": [12.4996, 74.9869],
    "KOTTAYAM": [9.5916, 76.5222],
    "ALAPPUZHA": [9.4981, 76.3388],
    "ALLEPPEY": [9.4981, 76.3388],
    "KOLLAM": [8.8932, 76.6141],
    "TRIVANDRUM": [8.5241, 76.9366],
    "THIRUVANANTHAPURAM": [8.5241, 76.9366],
    "IDUKKI": [9.9189, 76.9726],
    "ERNAKULAM": [10.0081, 76.3217],
    "WAYANAD": [11.6854, 76.1320],
    "PATHANAMTHITTA": [9.2648, 76.7870],
    "KOCHI": [10.0081, 76.3217],
};

function resolveCityCoords(location: string): [number, number] | null {
    const key = location.toUpperCase().trim();
    if (KERALA_CITY_COORDS[key]) return KERALA_CITY_COORDS[key];
    for (const city of Object.keys(KERALA_CITY_COORDS)) {
        if (key.includes(city)) return KERALA_CITY_COORDS[city];
    }
    return null;
}
// ────────────────────────────────────────────────────────────────────────────

function CarDetailsContent() {
    const params = useParams();
    const id = params?.id as string;
    const searchParams = useSearchParams();
    const router = useRouter();
    const [car, setCar] = useState<Car | null>(null);
    const [resolvedCoords, setResolvedCoords] = useState<[number, number] | null>(null);
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

                // 📡 Smart Location Sync
                // Priority: 1) Hardcoded Kerala city table (from location name)
                //           2) DB coords if they differ meaningfully from Kochi default
                //           3) Nominatim geocoding
                //           4) Default Kochi fallback
                const KOCHI_LAT = 10.0081;
                const KOCHI_LNG = 76.3217;

                // 1️⃣ Always try hardcoded table first — fast, reliable, no network
                if (data.location) {
                    const hardcoded = resolveCityCoords(data.location);
                    if (hardcoded) {
                        console.log(`✅ [MAP] "${data.location}" → hardcoded [${hardcoded}]`);
                        setResolvedCoords(hardcoded);
                        setCar(data);
                        if (data.image) setActiveImage(getImageUrl(data.image));
                        setLoading(false);
                        return;
                    }
                }

                // 2️⃣ Use DB coords if they are NOT the default Kochi placeholder
                const distFromKochi = Math.abs((data.lat ?? KOCHI_LAT) - KOCHI_LAT) + Math.abs((data.lng ?? KOCHI_LNG) - KOCHI_LNG);
                if (distFromKochi > 0.01) {
                    console.log(`✅ [MAP] Using DB coords: [${data.lat}, ${data.lng}]`);
                    setResolvedCoords([data.lat, data.lng]);
                    setCar(data);
                    if (data.image) setActiveImage(getImageUrl(data.image));
                    setLoading(false);
                    return;
                }

                // 3️⃣ Nominatim as last resort for unknown city names
                if (data.location) {
                    try {
                        const geoRes = await fetch(
                            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(data.location + ', Kerala, India')}&limit=1`,
                            { headers: { 'Accept-Language': 'en' } }
                        );
                        const geoData = await geoRes.json();
                        if (geoData && geoData.length > 0) {
                            const coords: [number, number] = [parseFloat(geoData[0].lat), parseFloat(geoData[0].lon)];
                            console.log(`✅ [MAP] "${data.location}" → Nominatim [${coords}]`);
                            setResolvedCoords(coords);
                            setCar(data);
                            if (data.image) setActiveImage(getImageUrl(data.image));
                            setLoading(false);
                            return;
                        }
                    } catch (e) { console.warn("[MAP] Nominatim failed:", e); }
                }

                // 4️⃣ Absolute fallback
                setResolvedCoords([KOCHI_LAT, KOCHI_LNG]);
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

    const [chatLoading, setChatLoading] = useState(false);
    const handleContactHost = async () => {
        if (!isLoggedIn) { router.push("/login"); return; }
        setChatLoading(true);
        try {
            const res = await apiFetch("/chat/create", {
                method: "POST",
                body: JSON.stringify({ carId: id }),
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

    const [L, setL] = useState<any>(null);
    useEffect(() => {
        if (typeof window !== "undefined") {
            // @ts-ignore
            import("leaflet").then((leaflet) => { setL(leaflet.default); });
        }
    }, []);

    const carIcon = L ? new L.Icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
        className: 'unit-marker-filter'
    }) : null;

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
            <style dangerouslySetInnerHTML={{ __html: mapStyles }} />
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
                        <div className="relative">
                            <button onClick={() => setShowLogout(!showLogout)} className="w-8 h-8 rounded-full border border-red-500/20 bg-red-500/5 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg">
                                <svg className="w-3.5 h-3.5 text-red-500 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            </button>
                            {showLogout && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute right-0 top-full mt-2 z-[200] w-32"
                                >
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center justify-center py-2 bg-red-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors"
                                    >
                                        Logout
                                    </button>
                                </motion.div>
                            )}
                        </div>
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

                            {/* 🗺️ Location Map */}
                            <div className="space-y-4 pt-4 border-t border-black/[0.03]">
                                <h2 className="text-sm font-black uppercase italic tracking-tighter flex items-center gap-3 text-black">
                                    <div className="w-8 h-0.5 bg-[#526E48]" /> Regional Deployment
                                </h2>
                                <div className="h-[300px] w-full rounded-[2rem] overflow-hidden border border-black/5 bg-zinc-50 relative">
                                    {typeof window !== 'undefined' && MapContainer && (
                                        <MapContainer
                                            center={resolvedCoords || [10.0081, 76.3217]}
                                            zoom={15}
                                            style={{ height: '100%', width: '100%' }}
                                            zoomControl={false}
                                            maxBounds={[[8.17, 74.85], [12.87, 77.52]]}
                                            minZoom={7}
                                        >
                                            <TileLayer
                                                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                            />
                                            {carIcon && (
                                                <>
                                                    <Circle
                                                        center={resolvedCoords || [10.0081, 76.3217]}
                                                        radius={1000}
                                                        pathOptions={{ fillColor: '#526E48', fillOpacity: 0.1, color: '#526E48', weight: 1 }}
                                                    />
                                                    <Marker position={resolvedCoords || [10.0081, 76.3217]} icon={carIcon}>
                                                        <Popup>
                                                            <div className="p-2 text-[10px] font-black uppercase italic">
                                                                {car.name} Deployment Zone
                                                            </div>
                                                        </Popup>
                                                    </Marker>
                                                </>
                                            )}
                                        </MapContainer>
                                    )}
                                    <div className="absolute bottom-4 left-4 z-[1000] bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl border border-black/5 shadow-sm">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-[#526E48] mb-0.5">Assigned Sector</p>
                                        <p className="text-[10px] font-black uppercase italic text-black">{car.location}, KERALA</p>
                                    </div>
                                </div>
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
                                            <span className="text-black text-right">{car.location}<br />{pickupDate ? new Date(pickupDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'} - 10:00 AM</span>
                                        </div>
                                        <div className="flex justify-between items-start text-[10px] font-bold text-zinc-500 tracking-widest uppercase mt-2">
                                            <span>Return</span>
                                            <span className="text-black text-right">{dropDate ? new Date(dropDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : (plan !== "custom" ? new Date(new Date().setDate(new Date().getDate() + days - 1)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD')} - 6:00 PM</span>
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

                                <div className="space-y-3">
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
                                        className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase italic tracking-[0.2em] transition-all ${!car.isAvailable ? "bg-red-500/10 text-red-500" : "bg-[#526E48] text-white shadow-lg rotate-hover hover:scale-[1.02]"}`}
                                    >
                                        {!car.isAvailable ? "Booked — Elite Hold" : "Instant Reservation"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

const mapStyles = `
    .unit-marker-filter {
        filter: invert(1) hue-rotate(90deg) drop-shadow(0 0 10px rgba(82, 110, 72, 0.5));
    }
    .leaflet-container {
        background: #f8f9fa !important;
        cursor: crosshair !important;
    }
`;
