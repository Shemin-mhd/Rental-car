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

// 🔱 Tactical Map Component (Client-side only)
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });
const Circle = dynamic(() => import("react-leaflet").then(mod => mod.Circle), { ssr: false });

const useMap = dynamic(() => import("react-leaflet").then(mod => mod.useMap as any), { ssr: false });

const MapFollower = ({ center }: { center: [number, number] }) => {
    const { useMap } = require("react-leaflet");
    const map = useMap();
    useEffect(() => { map.setView(center, map.getZoom(), { animate: true }); }, [center, map]);
    return null;
};

export default function CustomerInterceptPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const [telemetry, setTelemetry] = useState<{ lat: number; lng: number; speed: number; timestamp: Date } | null>(null);
    const [totalDistance, setTotalDistance] = useState(0); // in KM
    const [status, setStatus] = useState<"connecting" | "tracking" | "lost" | "stationary">("connecting");
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

    useEffect(() => {
        setIsMounted(true);
        // @ts-ignore
        import("leaflet").then((leaflet) => {
            setL(leaflet.default);
        });
    }, []);

    const { data: car } = useQuery({
        queryKey: ["carDetail", id],
        queryFn: async () => {
            const res = await apiFetch(`/cars/${id}`);
            return res.json();
        }
    });

    const { data: activeBk } = useQuery({
        queryKey: ["activeBookingForCar", id],
        queryFn: async () => {
            const res = await apiFetch("/bookings/host/bookings");
            const data = await res.json();
            if (Array.isArray(data)) {
                // Must return null (not undefined) for React Query
                return data.find((b: any) => b.carId._id === id && b.status !== 'Completed' && b.status !== 'Cancelled') ?? null;
            }
            return null;
        }
    });

    // 🛰️ Simulation Engine (For Owner Preview)
    useEffect(() => {
        if (!isSimulating) return;

        let lastPos = telemetry || { lat: car?.lat || 10.0081, lng: car?.lng || 76.3217 };
        setStatus("tracking");

        const interval = setInterval(() => {
            const oldLat = lastPos.lat;
            const oldLng = lastPos.lng;
            const mockLat = oldLat + (Math.random() - 0.5) * 0.0008;
            const mockLng = oldLng + (Math.random() - 0.5) * 0.0008;
            const newSpeed = Math.floor(Math.random() * 40) + 40;

            lastPos = { lat: mockLat, lng: mockLng };
            const dist = calculateDistance(oldLat, oldLng, mockLat, mockLng);
            setTotalDistance(prev => prev + dist);
            setTelemetry({ lat: mockLat, lng: mockLng, speed: newSpeed, timestamp: new Date() });
        }, 3000);

        return () => clearInterval(interval);
    }, [isSimulating, car, telemetry]);

    // Live Socket Connection
    useEffect(() => {
        if (isSimulating || !activeBk) {
            if (!activeBk && !isSimulating && car?.lat && car?.lng) {
                setTelemetry({ lat: car.lat, lng: car.lng, speed: 0, timestamp: new Date() });
                setStatus("stationary");
            } else if (!activeBk && !isSimulating) {
                // Default coordinates if no lat/lng
                setTelemetry({ lat: 10.0081, lng: 76.3217, speed: 0, timestamp: new Date() });
                setStatus("stationary");
            }
            return;
        }

        const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "https://rental-car-backend-7np6.onrender.com";
        const socket = io(API_URL, { transports: ["websocket"] });

        socket.on("connect", () => {
            socket.emit("joinMission", activeBk._id);
            setStatus("tracking");
        });

        socket.on("locationUpdate", (data) => {
            setTelemetry(prev => {
                if (prev) {
                    const dist = calculateDistance(prev.lat, prev.lng, data.lat, data.lng);
                    setTotalDistance(d => d + dist);
                }
                return data;
            });
            setStatus("tracking");
        });

        socket.on("disconnect", () => setStatus("lost"));

        return () => { socket.disconnect(); };
    }, [activeBk, isSimulating, car]);

    const unitIcon = L ? new L.Icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
        className: 'unit-marker-filter'
    }) : null;

    return (
        <div className="h-screen w-full bg-[#FDFDFD] text-black flex flex-col overflow-hidden font-sans">
            {/* ── Command Header ── */}
            <header className="h-24 border-b border-black/[0.04] flex items-center justify-between px-10 relative z-50 bg-white shadow-sm">
                <div className="flex items-center gap-8">
                    <button
                        onClick={() => router.push("/dashboard/customer")}
                        className="p-3 hover:bg-zinc-50 rounded-2xl transition-all group border border-transparent hover:border-black/[0.04]"
                    >
                        <ChevronLeft size={20} className="text-zinc-400 group-hover:text-black transition-colors" />
                    </button>
                    <div className="h-8 w-[1px] bg-black/[0.04]" />
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tighter italic">Live Radar: <span className="text-[#526E48]">{car?.name || "Asset"}</span></h1>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Asset ID: RG-{id.slice(-6).toUpperCase()} // {activeBk ? "ACTIVE_TRIP" : "STATIONARY"}</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setIsSimulating(!isSimulating)}
                        className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all shadow-sm ${isSimulating ? 'bg-red-50 text-red-500 border-red-200 animate-pulse' : 'bg-white text-zinc-500 border-zinc-200 hover:border-black hover:text-black'}`}
                    >
                        {isSimulating ? "🛑 Stop Tracking Demo" : "🚀 Run Live Demo"}
                    </button>
                    <div className="text-right">
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.3em]">Signal Status</p>
                        <div className="flex items-center gap-2 justify-end">
                            <span className={`text-[11px] font-black uppercase italic ${status === 'tracking' ? 'text-[#526E48]' : status === 'stationary' ? 'text-zinc-400' : 'text-red-500'}`}>
                                {status === 'tracking' ? "Locked On" : status === 'stationary' ? "Stationary Base" : "Signal Lost"}
                            </span>
                            <div className={`w-2 h-2 rounded-full ${status === 'tracking' ? 'bg-[#526E48] animate-pulse' : status === 'stationary' ? 'bg-zinc-300' : 'bg-red-500'}`} />
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Main Operations ── */}
            <main className="flex-1 relative flex">
                {/* 🔙 Floating Back Button */}
                <div className="absolute top-5 left-5 z-[1000]">
                    <button
                        onClick={() => router.push("/dashboard/customer")}
                        className="flex items-center gap-3 bg-white/95 backdrop-blur-sm border border-black/[0.08] text-black px-5 py-3 rounded-2xl shadow-xl hover:shadow-2xl hover:border-black/20 transition-all group"
                    >
                        <ChevronLeft size={18} className="text-zinc-500 group-hover:text-black transition-colors group-hover:-translate-x-0.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-black transition-colors">Dashboard</span>
                    </button>
                </div>

                {/* 🗺️ Tactical Map Layer */}
                <div className="flex-1 relative bg-zinc-100 z-10">
                    <AnimatePresence>
                        {(!telemetry && status === "tracking") && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-16 h-16 border-4 border-[#526E48]/20 border-t-[#526E48] rounded-full animate-spin mx-auto mb-6 shadow-xl" />
                                    <p className="text-[12px] font-black uppercase tracking-[0.4em] italic text-zinc-400">Awaiting GPS Ping...</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {isMounted && typeof window !== 'undefined' && MapContainer && (
                        <MapContainer
                            center={[telemetry?.lat || 10.0081, telemetry?.lng || 76.3217]}
                            zoom={16}
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={false}
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                attribution='&copy; CARTO'
                            />

                            {telemetry && unitIcon && (
                                <>
                                    <MapFollower center={[telemetry.lat, telemetry.lng]} />
                                    <Circle
                                        center={[telemetry.lat, telemetry.lng]}
                                        radius={300}
                                        pathOptions={{ fillColor: '#526E48', fillOpacity: 0.05, color: '#526E48', weight: 2 }}
                                    />
                                    <Marker position={[telemetry.lat, telemetry.lng]} icon={unitIcon}>
                                        <Popup>
                                            <div className="p-1">
                                                <p className="text-[10px] font-black text-black">ASSET: {car?.name}</p>
                                                <p className="text-[9px] font-bold text-zinc-500 mt-1">SPEED: {telemetry.speed || 0} KM/H</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                </>
                            )}
                        </MapContainer>
                    )}
                </div>

                {/* 📊 Telemetry HUD */}
                <aside className="w-[340px] bg-white border-l border-black/[0.04] p-8 flex flex-col gap-8 relative z-50 shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
                    <section>
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-6">Live Telemetry</h3>
                        <div className="space-y-4">
                            <div className="bg-[#526E48] p-6 rounded-[2rem] shadow-xl text-white relative overflow-hidden group">
                                <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em] mb-2">Live Velocity</p>
                                <p className="text-5xl font-black tracking-tighter">{telemetry?.speed || 0} <span className="text-sm font-bold opacity-50">KM/H</span></p>
                            </div>

                            <div className="bg-zinc-50 border border-black/[0.03] p-6 rounded-[2rem] relative overflow-hidden group">
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-2">Distance Covered</p>
                                <p className="text-4xl font-black text-black tracking-tighter">{totalDistance.toFixed(2)} <span className="text-sm font-bold text-zinc-400">KM</span></p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white border border-black/[0.04] shadow-sm p-5 rounded-2xl">
                                    <p className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2">Latitude</p>
                                    <p className="text-[12px] font-mono font-black text-black">{telemetry?.lat.toFixed(4) || "0.0000"}</p>
                                </div>
                                <div className="bg-white border border-black/[0.04] shadow-sm p-5 rounded-2xl">
                                    <p className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2">Longitude</p>
                                    <p className="text-[12px] font-mono font-black text-black">{telemetry?.lng.toFixed(4) || "0.0000"}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="flex-1">
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-6">Event Logs</h3>
                        <div className="space-y-4 h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            <div className="flex gap-4 items-start border-l-2 border-zinc-200 pl-4 py-2">
                                <div className="mt-1.5 w-2 h-2 rounded-full bg-zinc-300 -ml-[21px]" />
                                <div>
                                    <p className="text-[10px] font-black uppercase text-black leading-none">System Initialized</p>
                                    <p className="text-[8px] font-bold text-zinc-400 uppercase mt-1.5">Asset Registry Locked</p>
                                </div>
                            </div>
                            {telemetry && (
                                <div className="flex gap-4 items-start border-l-2 border-[#526E48] pl-4 py-2 animate-in fade-in slide-in-from-left-2 transition-all">
                                    <div className="mt-1.5 w-2 h-2 rounded-full bg-[#526E48] animate-pulse -ml-[21px] shadow-[0_0_10px_#526E48]" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-black leading-none">{car?.isMoving ? "GPS Broadcast Received" : "GPS Locked"}</p>
                                        <p className="text-[8px] font-bold text-[#526E48] uppercase mt-1.5 font-mono">LAT: {telemetry.lat.toFixed(2)} / LNG: {telemetry.lng.toFixed(2)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </aside>
            </main>

            <style jsx global>{`
                .unit-marker-filter {
                    filter: drop-shadow(0 10px 15px rgba(0, 0, 0, 0.4));
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
