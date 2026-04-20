"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/services/api";
import Link from "next/link";
import {
    ChevronLeft,
    CloudUpload,
    Check,
    FileText,
    Navigation2,
    MapPin,
    Search,
    ShieldCheck
} from "lucide-react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// 🛰️ Dynamic Map Components (SSR: false)
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Circle = dynamic(() => import("react-leaflet").then(mod => mod.Circle), { ssr: false });

// 🛰️ Map Engine Sub-Components
function MapEngine({ center, onClick }: { center: [number, number], onClick: (lat: number, lng: number) => void }) {
    const [RL, setRL] = useState<any>(null);

    useEffect(() => {
        // Load react-leaflet dynamically on client
        import("react-leaflet").then(mod => setRL(mod));
    }, []);

    if (!RL) return null;

    // Internal component to safely use hooks inside MapContainer context
    const InternalEngine = () => {
        const map = RL.useMap();

        RL.useMapEvents({
            click: (e: any) => onClick(e.latlng.lat, e.latlng.lng)
        });

        useEffect(() => {
            if (map && center) {
                map.flyTo(center, map.getZoom());
            }
        }, [map, center]);

        return null;
    };

    return <InternalEngine />;
}

export default function AddCarPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [images, setImages] = useState<(File | null)[]>([null, null, null]);
    const [previews, setPreviews] = useState<(string | null)[]>([null, null, null]);
    const [isClient, setIsClient] = useState(false);

    const [rcFront, setRcFront] = useState<File | null>(null);
    const [rcBack, setRcBack] = useState<File | null>(null);
    const [rcFrontPreview, setRcFrontPreview] = useState<string | null>(null);
    const [rcBackPreview, setRcBackPreview] = useState<string | null>(null);

    const [carData, setCarData] = useState({
        name: "", model: "", year: new Date().getFullYear(), pricePerDay: "", seats: "4",
        transmission: "Auto", location: "", category: "Luxury",
        fuelType: "Petrol", engine: "", hp: "", topSpeed: "", acceleration: "",
        description: "",
        features: [] as string[],
        lat: 10.0081,
        lng: 76.3217,
        isLive: false
    });

    const [searchQuery, setSearchQuery] = useState("");

    const resolveAddress = async (lat: number, lng: number) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`);
            const data = await res.json();
            const city = data.address.city || data.address.town || data.address.village || data.address.district || "";
            if (city) setCarData(prev => ({ ...prev, location: city.toUpperCase() }));
        } catch { }
    };

    const handleLocationSearch = async (query?: string) => {
        const q = query || searchQuery;
        if (!q.trim()) return;
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&accept-language=en`);
            const data = await res.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                setCarData(prev => ({ ...prev, lat, lng: lon, isLive: false }));
                if (!query) resolveAddress(lat, lon);
            }
        } catch { }
    };

    useEffect(() => {
        setIsClient(true);
        const role = localStorage.getItem("role");
        if (role !== "customer") router.push("/login");
    }, [router]);

    useEffect(() => {
        if (!navigator.geolocation || !carData.isLive) return;
        const watchId = navigator.geolocation.watchPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setCarData(prev => ({ ...prev, lat: latitude, lng: longitude }));
                resolveAddress(latitude, longitude);
            },
            () => { console.warn("Live Location Refused"); },
            { enableHighAccuracy: true }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, [carData.isLive]);

    const [L, setL] = useState<any>(null);
    useEffect(() => {
        if (typeof window !== "undefined") {
            // @ts-ignore
            import("leaflet").then((leaflet) => { setL(leaflet.default); });
        }
    }, []);

    const [liveIcon, setLiveIcon] = useState<any>(null);
    useEffect(() => {
        if (L) {
            setLiveIcon(new L.Icon({
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png',
                iconSize: [30, 30],
                iconAnchor: [15, 15],
                className: 'live-pulse-icon'
            }));
        }
    }, [L]);

    const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const newImages = [...images]; newImages[index] = file; setImages(newImages);
            const newPreviews = [...previews]; newPreviews[index] = URL.createObjectURL(file); setPreviews(newPreviews);
        }
    };

    const handleReview = (e: React.FormEvent) => {
        e.preventDefault();
        if (!carData.name || !carData.model || !images[0]) {
            setError("Primary Technical Data & Main Image Required.");
            return;
        }
        if (!rcFront || !rcBack) {
            setError("Both RC Book Front and Back images are mandatory.");
            return;
        }
        setError(null);
        setStep(1);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const formData = new FormData();
            Object.entries(carData).forEach(([key, value]) => {
                if (key === 'features') formData.append(key, JSON.stringify(value));
                else formData.append(key, String(value));
            });
            if (images[0]) formData.append("image", images[0]);
            images.slice(1).forEach(img => { if (img) formData.append("gallery", img); });
            if (rcFront) formData.append("rcFront", rcFront);
            if (rcBack) formData.append("rcBack", rcBack);
            const res = await apiFetch("/cars/host/listing", { method: "POST", body: formData });
            if (res.ok) setStep(2);
            else {
                const data = await res.json();
                setError(data.message || "Registry Synchronization Rejected.");
            }
        } catch (err) { setError("Protocol Connection Error."); }
        finally { setIsSubmitting(false); }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] text-black font-sans flex overflow-hidden">
            <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(20,83,45,0.03),transparent_70%)]" />
            <div className="flex-1 h-screen overflow-y-scroll p-6 lg:p-10 relative z-10 custom-scrollbar">
                <div className="max-w-[1000px] mx-auto w-full">
                    <header className="mb-8 flex items-center justify-between border-b border-black/[0.02] pb-6">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard/customer" className="w-10 h-10 bg-white/50 backdrop-blur-md border border-black/5 rounded-xl flex items-center justify-center text-zinc-400 hover:text-black transition-all shadow-sm">
                                <ChevronLeft size={16} />
                            </Link>
                            <div>
                                <h1 className="text-base font-black italic uppercase tracking-tighter">
                                    ASSET_<span className="text-[#14532d]">{step === 2 ? "DEPLOYED" : "DRAFTS"}</span>
                                </h1>
                                <p className="text-[7.5px] font-black uppercase tracking-[0.4em] text-black opacity-30 mt-0.5">Operational Step {step + 1} of 3</p>
                            </div>
                        </div>
                        <div className="flex gap-1.5">
                            {[0, 1, 2].map(i => <div key={i} className={`h-1 w-6 rounded-full transition-all duration-500 ${step >= i ? "bg-[#14532d]" : "bg-black/5"}`} />)}
                        </div>
                    </header>

                    <AnimatePresence mode="wait">
                        {step === 0 && (
                            <motion.form key="filling" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleReview} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                <div className="lg:col-span-12">{error && <p className="bg-red-50 text-red-500 text-[10px] font-black uppercase p-4 rounded-2xl mb-4 tracking-widest italic border border-red-100 shadow-sm">/ ALERT: {error}</p>}</div>
                                <div className="lg:col-span-7 space-y-8">
                                    <section className="space-y-4">
                                        <h2 className="text-[9px] font-black uppercase tracking-[0.4em] text-black italic opacity-30">Visual Spec Registry</h2>
                                        <div className="grid grid-cols-3 gap-4">
                                            {[0, 1, 2].map(i => (
                                                <label key={i} className="group aspect-video bg-white/50 backdrop-blur-md border border-black/[0.02] rounded-2xl overflow-hidden cursor-pointer hover:border-[#14532d]/30 transition-all flex flex-col items-center justify-center gap-2 relative shadow-sm">
                                                    {previews[i] ? <img src={previews[i]!} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Preview" /> : (
                                                        <>
                                                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                                                <CloudUpload size={14} className="text-zinc-300 group-hover:text-[#14532d]" />
                                                            </div>
                                                            <span className="text-[7px] font-black text-black uppercase tracking-widest italic opacity-50">SLOT_{i + 1}</span>
                                                        </>
                                                    )}
                                                    <input type="file" onChange={e => handleFileChange(i, e)} className="hidden" accept="image/*" />
                                                </label>
                                            ))}
                                        </div>
                                    </section>
                                    <section className="space-y-4">
                                        <h2 className="text-[9px] font-black uppercase tracking-[0.4em] text-black italic opacity-30">Vehicle Ownership Verification</h2>
                                        <div className="grid grid-cols-2 gap-4">
                                            {[{ l: "RC FRONT IMAGE", v: rcFront, p: rcFrontPreview, s: setRcFront, sp: setRcFrontPreview }, { l: "RC BACK IMAGE", v: rcBack, p: rcBackPreview, s: setRcBack, sp: setRcBackPreview }].map(d => (
                                                <div key={d.l} className="space-y-2">
                                                    <label className="text-[7.5px] font-black uppercase text-black ml-1 italic opacity-40">{d.l} (MANDATORY)</label>
                                                    <label className={`w-full h-32 bg-white/50 border border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${d.v ? 'border-[#14532d] bg-[#14532d]/5' : 'border-black/10 hover:border-[#14532d]/30 shadow-sm'}`}>
                                                        {d.p ? <img src={d.p} className="w-full h-full object-cover rounded-2xl" /> : (
                                                            <>
                                                                <FileText size={20} className="text-zinc-200" />
                                                                <span className="text-[8px] font-black uppercase opacity-50 tracking-widest">Upload Image</span>
                                                            </>
                                                        )}
                                                        <input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { d.s(f); d.sp(URL.createObjectURL(f)); } }} />
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                    <section className="space-y-4">
                                        <h2 className="text-[9px] font-black uppercase tracking-[0.4em] text-black italic opacity-30">Technical Meta</h2>
                                        <div className="grid grid-cols-2 gap-4">
                                            {[{ l: "Brand Name", k: "name", p: "e.g. Porsche" }, { l: "Technical Model", k: "model", p: "e.g. Taycan Turbo" }].map(f => (
                                                <div key={f.k} className="space-y-1.5">
                                                    <label className="text-[7.5px] font-black uppercase text-black ml-1 italic opacity-40">{f.l}</label>
                                                    <input required value={(carData as any)[f.k]} onChange={e => setCarData({ ...carData, [f.k]: e.target.value })} placeholder={f.p} className="w-full bg-white/50 backdrop-blur-md border border-black/[0.02] rounded-xl px-5 py-3 text-[9px] font-black uppercase focus:border-[#14532d]/20 transition-all outline-none shadow-sm" />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            {[{ l: "Build Year", k: "year", t: "number" }, { l: "Seating", k: "seats", t: "number" }].map(f => (
                                                <div key={f.k} className="space-y-1.5">
                                                    <label className="text-[7.5px] font-black uppercase text-black ml-1 italic opacity-40">{f.l}</label>
                                                    <input type={f.t} value={(carData as any)[f.k]} onChange={e => setCarData({ ...carData, [f.k]: e.target.value })} className="w-full bg-white/50 backdrop-blur-md border border-black/[0.02] rounded-xl px-5 py-3 text-[9px] font-black focus:border-[#14532d]/20 transition-all outline-none shadow-sm" />
                                                </div>
                                            ))}
                                            <div className="space-y-1.5">
                                                <label className="text-[7.5px] font-black uppercase text-black ml-1 italic opacity-40">Energy Class</label>
                                                <select value={carData.fuelType} onChange={e => setCarData({ ...carData, fuelType: e.target.value })} className="w-full bg-white/50 backdrop-blur-md border border-black/[0.02] rounded-xl px-5 py-3 text-[9px] font-black appearance-none outline-none shadow-sm capitalize">
                                                    {["Petrol", "Electric", "Diesel"].map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                <div className="lg:col-span-5">
                                    <div className="bg-white/70 backdrop-blur-xl border border-white p-6 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.02)] sticky top-6">
                                        <section className="space-y-6">
                                            <div className="text-center space-y-3 pb-6 border-b border-black/[0.02]">
                                                <p className="text-[7.5px] font-black uppercase tracking-[0.4em] text-[#14532d] italic">Temporal Yield Target</p>
                                                <div className="flex items-center justify-center gap-1">
                                                    <span className="text-[14px] font-black text-zinc-200 mt-1">₹</span>
                                                    <input type="number" required value={carData.pricePerDay} onChange={e => setCarData({ ...carData, pricePerDay: e.target.value })} className="w-28 bg-transparent text-3xl font-black italic text-black text-center outline-none tracking-tighter" placeholder="000" />
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="relative group">
                                                    <input
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleLocationSearch())}
                                                        placeholder="SEARCH FOR A LOCATION..."
                                                        className="w-full bg-white border border-black/5 rounded-xl px-4 py-3 text-[8px] font-black uppercase tracking-widest outline-none pr-12 shadow-sm focus:border-[#14532d]/20 transition-all font-sans"
                                                    />
                                                    <button onClick={() => handleLocationSearch()} type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-300 hover:text-[#14532d] transition-colors"><Search size={14} /></button>
                                                </div>

                                                <div className="h-48 w-full rounded-2xl overflow-hidden border border-black/5 bg-zinc-50 relative">
                                                    {isClient && MapContainer && (
                                                        <MapContainer
                                                            center={[carData.lat, carData.lng]}
                                                            zoom={15}
                                                            style={{ height: '100%', width: '100%' }}
                                                            zoomControl={false}
                                                            attributionControl={false}
                                                        >
                                                            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                                            <MapEngine center={[carData.lat, carData.lng]} onClick={(lat, lng) => {
                                                                setCarData(prev => ({ ...prev, lat, lng, isLive: false }));
                                                                resolveAddress(lat, lng);
                                                            }} />
                                                            {liveIcon && (
                                                                <>
                                                                    <Circle center={[carData.lat, carData.lng]} radius={400} pathOptions={{ color: '#14532d', fillColor: '#14532d', fillOpacity: 0.1, weight: 1 }} />
                                                                    <Marker
                                                                        position={[carData.lat, carData.lng]}
                                                                        icon={liveIcon}
                                                                        draggable={true}
                                                                        eventHandlers={{
                                                                            dragend: (e) => {
                                                                                const marker = e.target;
                                                                                const position = marker.getLatLng();
                                                                                setCarData(prev => ({ ...prev, lat: position.lat, lng: position.lng, isLive: false }));
                                                                                resolveAddress(position.lat, position.lng);
                                                                            },
                                                                        }}
                                                                    />
                                                                </>
                                                            )}
                                                        </MapContainer>
                                                    )}
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setCarData(prev => ({ ...prev, isLive: !prev.isLive }))}
                                                        className={`flex-1 py-3.5 rounded-xl text-[8px] font-black tracking-widest border transition-all ${carData.isLive ? 'bg-[#14532d] text-white border-[#14532d]' : 'bg-white text-zinc-400 border-black/5'}`}
                                                    >
                                                        {carData.isLive ? 'LIVE GPS ACTIVE' : 'ENABLE LIVE GPS'}
                                                    </button>
                                                </div>

                                                <div className="bg-zinc-50/50 p-4 rounded-xl border border-black/5 space-y-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <MapPin size={10} className="text-[#14532d]" />
                                                        <span className="text-[7px] font-black uppercase text-black opacity-40 tracking-widest">Selected Deployment Base</span>
                                                    </div>
                                                    <input
                                                        required
                                                        value={carData.location}
                                                        onChange={e => setCarData({ ...carData, location: e.target.value })}
                                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleLocationSearch(carData.location))}
                                                        placeholder="CLICK MAP OR ENTER CITY..."
                                                        className="w-full bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-[0.2em] outline-none text-black placeholder:text-zinc-200"
                                                    />
                                                    <div className="flex justify-between text-[6px] font-black uppercase opacity-20 tracking-widest">
                                                        <span>{carData.lat.toFixed(4)} N</span>
                                                        <span>{carData.lng.toFixed(4)} E</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button type="submit" className="w-full bg-black text-white py-4 rounded-2xl text-[9px] font-black tracking-[0.4em] shadow-2xl hover:bg-[#14532d] transition-all italic text-zinc-100">PROCEED_TO_VERIFY</button>
                                        </section>
                                    </div>
                                </div>
                            </motion.form>
                        )}
                        {step === 1 && (
                            <motion.div key="review" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto space-y-10 pb-24">
                                <div className="bg-white/70 backdrop-blur-xl border border-white p-10 rounded-[2.5rem] shadow-sm space-y-8 text-black">
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">{carData.name} <span className="text-zinc-300">/ {carData.model}</span></h3>
                                    <div className="flex gap-4 justify-center">
                                        <button onClick={() => setStep(0)} className="w-32 border border-black/5 py-4 rounded-2xl text-[8px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all">Abort / Edit</button>
                                        <button disabled={isSubmitting} onClick={handleSubmit} className="w-64 bg-black text-white py-4 rounded-2xl text-[9px] font-black tracking-[0.5em] shadow-2xl hover:bg-[#14532d] transition-all flex items-center justify-center gap-4">
                                            {isSubmitting ? "SYNCHRONIZING..." : "AUTHORIZE_REGISTRY"}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        {step === 2 && (
                            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center space-y-10">
                                <div className="w-20 h-20 bg-[#14532d] text-white rounded-[2rem] flex items-center justify-center text-3xl font-black italic shadow-2xl"><Check size={32} strokeWidth={3} /></div>
                                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-black">Asset Commissioned Successfully.</h2>
                                <Link href="/dashboard/customer" className="bg-black text-white px-10 py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.5em] shadow-2xl hover:bg-[#14532d] transition-all">DASHBOARD</Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { display: none; }
                .live-pulse-icon { filter: invert(1) hue-rotate(90deg); animation: pulse-ring 2s infinite; }
                @keyframes pulse-ring { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
            `}</style>
        </div>
    );
}
