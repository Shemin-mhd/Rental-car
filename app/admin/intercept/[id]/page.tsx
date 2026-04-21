"use client";

import { useEffect, useState, use } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/services/api";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// 🔱 Tactical Map Components (Client-side only)
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });
const Circle = dynamic(() => import("react-leaflet").then(mod => mod.Circle), { ssr: false });

// 🎯 Tactical Component: Resilient View Controller
// This component sits inside MapContainer and handles re-centering without remounting the map
const MapViewController = ({ center }: { center: [number, number] }) => {
    // @ts-ignore - Dynamically imported via MapContainer context
    const { useMap } = require("react-leaflet");
    const map = useMap();
    
    useEffect(() => {
        if (center && center[0] !== 0) {
            map.setView(center, map.getZoom(), { animate: true });
        }
    }, [center, map]);
    
    return null;
};

// 🏘️ Smart Location Mapping
const cityCoordinates: { [key: string]: [number, number] } = {
    'kochi': [10.0081, 76.3217],
    'ernakulam': [10.0081, 76.3217],
    'trivandrum': [8.5241, 76.9366],
    'thiruvananthapuram': [8.5241, 76.9366],
    'calicut': [11.2588, 75.7804],
    'kozhikode': [11.2588, 75.7804],
    'thrissur': [10.5276, 76.2144],
    'malappuram': [11.0510, 76.0711],
    'kannur': [11.8745, 75.3704],
    'kottayam': [9.5916, 76.5221],
    'alappuzha': [9.4981, 76.3388],
    'palakkad': [10.7867, 76.6547],
    'idukki': [9.8500, 76.9667],
    'wayanad': [11.6854, 76.1320],
    'kasaragod': [12.5101, 74.9852],
    'pathanamthitta': [9.2648, 76.7870],
    'kollam': [8.8932, 76.6141]
};

export default function InterceptPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const [telemetry, setTelemetry] = useState<{ lat: number; lng: number; speed: number; timestamp: Date } | null>(null);
    const [totalDistance, setTotalDistance] = useState(0); // in KM
    const [status, setStatus] = useState<"connecting" | "tracking" | "lost">("connecting");
    const [L, setL] = useState<any>(null);
    const [isSimulating, setIsSimulating] = useState(false);

    // 🔱 Utility: Calculate distance between two points (KM)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Earth's radius in KM
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // 🔱 Load Leaflet (Client-side)
    useEffect(() => {
        setIsMounted(true);
        // @ts-ignore
        import("leaflet").then((leaflet) => {
            setL(leaflet.default);
        });
    }, []);

    const { data: booking } = useQuery({
        queryKey: ["missionDetail", id],
        queryFn: async () => {
            const res = await apiFetch(`/bookings/${id}`);
            return res.json();
        }
    });

    const resolvedCoords: [number, number] = (() => {
        const city = (booking?.carId?.city || booking?.carId?.pickupLocation || "kochi").toLowerCase().trim();
        if (city && cityCoordinates[city]) return cityCoordinates[city];
        for (const [key, coords] of Object.entries(cityCoordinates)) {
            if (city.includes(key)) return coords;
        }
        if (booking?.carId?.lat && booking?.carId?.lng) return [booking.carId.lat, booking.carId.lng];
        return [10.0081, 76.3217]; // Kochi Default
    })();

    // 🛰️ Simulation Engine (Syncs with Backend Registry)
    useEffect(() => {
        if (!isSimulating) return;

        let lastPos = { lat: resolvedCoords[0], lng: resolvedCoords[1] };

        const interval = setInterval(async () => {
            const oldLat = lastPos.lat;
            const oldLng = lastPos.lng;
            const mockLat = oldLat + (Math.random() - 0.5) * 0.0008;
            const mockLng = oldLng + (Math.random() - 0.5) * 0.0008;

            lastPos = { lat: mockLat, lng: mockLng };
            const dist = calculateDistance(oldLat, oldLng, mockLat, mockLng);
            setTotalDistance(prev => prev + dist);

            try {
                await apiFetch(`/bookings/${id}/location`, {
                    method: "POST",
                    body: JSON.stringify({
                        lat: mockLat,
                        lng: mockLng,
                        speed: Math.floor(Math.random() * 40) + 40
                    })
                });
            } catch (err) { }
        }, 3000);

        return () => clearInterval(interval);
    }, [isSimulating, id, resolvedCoords]);

    useEffect(() => {
        const isLocal = typeof window !== 'undefined' && window.location.hostname === "localhost";
        const API_URL = isLocal ? "https://rental-garage.duckdns.org" : (process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "https://rental-garage.duckdns.org");
        const socket = io(API_URL, { transports: ["websocket"] });

        socket.on("connect", () => {
            socket.emit("joinMission", id);
            setStatus("tracking");
        });

        socket.on("locationUpdate", (data) => {
            setTelemetry(data);
            setStatus("tracking");
        });

        socket.on("disconnect", () => setStatus("lost"));

        return () => { socket.disconnect(); };
    }, [id]);

    const unitIcon = L ? new L.Icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
        className: 'unit-marker-filter'
    }) : null;

    return (
        <div className="h-screen w-full bg-[#0a0a0a] text-white flex flex-col overflow-hidden font-sans">

            {/* ── Command Header ── */}
            <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 relative z-50 bg-black/80 backdrop-blur-xl">
                <div className="flex items-center gap-8">
                    <button
                        onClick={() => router.push("/dashboard/admin")}
                        className="p-2 hover:bg-white/5 rounded-xl transition-all group border border-transparent hover:border-white/10"
                    >
                        <ChevronLeft size={20} className="text-zinc-500 group-hover:text-white transition-colors" />
                    </button>
                    <div className="h-6 w-[1px] bg-white/10" />
                    <div className="flex items-center gap-2">
                        <div className="bg-[#526E48] px-2 py-0.5 rounded text-[10px] text-white font-black italic -skew-x-12">RG</div>
                        <span className="text-xs font-black tracking-widest uppercase italic">Rental_<span className="text-[#526E48]">Garage</span></span>
                    </div>
                    <div className="h-6 w-[1px] bg-white/10" />
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-tighter italic">Mission: <span className="text-[#526E48]">RG-{id.slice(-8).toUpperCase()}</span></h1>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{booking?.carId?.name || "Asset"} // Agent: {booking?.userId?.name || "Unknown"}</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={async () => {
                            const confirmed = confirm("⚠️ IMMEDIATE TERMINATE: End this mission and assess for fines?");
                            if (!confirmed) return;
                            try {
                                await apiFetch(`/bookings/${id}/trip-status`, {
                                    method: "PATCH",
                                    body: JSON.stringify({ tripStatus: "Completed" })
                                });
                                router.push("/dashboard/admin");
                            } catch (err) { alert("Termination Failure."); }
                        }}
                        className="px-4 py-2 bg-red-600/10 border border-red-500/20 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-lg"
                    >
                        🏁 Terminate Mission
                    </button>

                    <button
                        onClick={() => setIsSimulating(!isSimulating)}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${isSimulating ? 'bg-[#526E48] text-white border-[#526E48]' : 'bg-white/5 text-zinc-400 border-white/10 hover:border-[#526E48]/40'}`}
                    >
                        {isSimulating ? "🛰️ Simulation_Active" : "📡 Start_Simulator"}
                    </button>

                    <div className="text-right">
                        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.3em]">Signal_Status</p>
                        <div className="flex items-center gap-2 justify-end">
                            <span className={`text-[10px] font-black uppercase italic ${status === 'tracking' ? 'text-[#526E48]' : 'text-red-500'}`}>
                                {status === 'tracking' ? "Locked_On" : "Signal_Lost"}
                            </span>
                            <div className={`w-1.5 h-1.5 rounded-full ${status === 'tracking' ? 'bg-[#526E48] animate-pulse' : 'bg-red-500'}`} />
                        </div>
                    </div>
                    <button onClick={() => window.close()} className="bg-white/5 p-3 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all border border-white/5">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>
            </header>

            {/* ── Main Operations ── */}
            <main className="flex-1 relative flex">

                {/* 🗺️ Tactical Map Layer */}
                <div className="flex-1 relative bg-zinc-900">
                    <AnimatePresence>
                        {(!telemetry && status === "tracking") && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-12 h-12 border-2 border-[#526E48]/20 border-t-[#526E48] rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] italic text-[#526E48]">Awaiting Unit Ping...</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {isMounted && (
                        <MapContainer
                            center={[resolvedCoords[0], resolvedCoords[1]]}
                            zoom={15}
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={false}
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            />

                            <MapViewController center={isSimulating ? [resolvedCoords[0], resolvedCoords[1]] : [telemetry?.lat || resolvedCoords[0], telemetry?.lng || resolvedCoords[1]]} />

                            {telemetry && unitIcon && (
                                <>
                                    <Circle
                                        center={[telemetry.lat, telemetry.lng]}
                                        radius={200}
                                        pathOptions={{ fillColor: '#526E48', fillOpacity: 0.1, color: '#526E48', weight: 1 }}
                                    />
                                    <Marker position={[telemetry.lat, telemetry.lng]} icon={unitIcon}>
                                        <Popup>
                                            <div className="bg-zinc-900 text-white p-2 text-[10px] font-bold">
                                                MISSION ASSET: {booking?.carId?.name}
                                            </div>
                                        </Popup>
                                    </Marker>
                                </>
                            )}
                        </MapContainer>
                    )}
                </div>

                {/* 📊 Telemetry HUD */}
                <aside className="w-80 bg-black border-l border-white/5 p-8 flex flex-col gap-8 relative z-50">
                    <section>
                        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6">Unit_Telemetry</h3>
                        <div className="space-y-4">
                            <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Live_Velocity</p>
                                <p className="text-3xl font-black italic">{telemetry?.speed || 0} <span className="text-[10px] text-zinc-500 font-bold not-italic">KM/H</span></p>
                            </div>
                            <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Distance_Covered</p>
                                <p className="text-3xl font-black italic">{totalDistance.toFixed(2)} <span className="text-[10px] text-zinc-500 font-bold not-italic">KM</span></p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Latitude</p>
                                    <p className="text-[11px] font-mono font-bold">{telemetry?.lat.toFixed(4) || "0.0000"}</p>
                                </div>
                                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Longitude</p>
                                    <p className="text-[11px] font-mono font-bold">{telemetry?.lng.toFixed(4) || "0.0000"}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="flex-1">
                        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6">Mission_Logs</h3>
                        <div className="space-y-3 h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            <div className="flex gap-3 items-start border-l border-[#526E48] pl-4 py-1">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#526E48]" />
                                <div>
                                    <p className="text-[9px] font-black uppercase italic leading-none">Mission Deployed</p>
                                    <p className="text-[7px] font-bold text-zinc-500 uppercase mt-1">Status: HANDED_OVER</p>
                                </div>
                            </div>
                            {telemetry && (
                                <div className="flex gap-3 items-start border-l border-white/10 pl-4 py-1">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    <div>
                                        <p className="text-[9px] font-black uppercase italic leading-none">Latest Ping Received</p>
                                        <p className="text-[7px] font-bold text-zinc-500 uppercase mt-1">COORDS: {telemetry.lat.toFixed(2)}, {telemetry.lng.toFixed(2)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </aside>
            </main>

            <style jsx global>{`
                .unit-marker-filter { filter: invert(1) hue-rotate(90deg) drop-shadow(0 0 10px rgba(82, 110, 72, 0.5)); }
                .leaflet-container { background: #0a0a0a !important; }
                .custom-scrollbar::-webkit-scrollbar { width: 2px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(82, 110, 72, 0.3); }
            `}</style>
        </div>
    );
}
