"use client";

import { useEffect, useState, use } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/services/api";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// 🔱 Tactical Map Component (Client-side only)
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });
const Circle = dynamic(() => import("react-leaflet").then(mod => mod.Circle), { ssr: false });

export default function InterceptPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [telemetry, setTelemetry] = useState<{ lat: number; lng: number; speed: number; timestamp: Date } | null>(null);
    const [status, setStatus] = useState<"connecting" | "tracking" | "lost">("connecting");
    const [L, setL] = useState<any>(null);

    // 🔱 Load Leaflet for icons (Client-side)
    useEffect(() => {
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

    useEffect(() => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";
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
                    <div className="flex items-center gap-2">
                        <div className="bg-[#526E48] px-2 py-0.5 rounded text-[10px] text-white font-black italic -skew-x-12">RG</div>
                        <span className="text-xs font-black tracking-widest uppercase italic">Operational_<span className="text-[#526E48]">Theater</span></span>
                    </div>
                    <div className="h-6 w-[1px] bg-white/10" />
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-tighter italic">Mission: <span className="text-[#526E48]">RG-{id.slice(-8).toUpperCase()}</span></h1>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{booking?.carId?.name || "Asset"} // Agent: {booking?.userId?.name || "Unknown"}</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
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

                    {typeof window !== 'undefined' && MapContainer && (
                        <MapContainer 
                            center={[telemetry?.lat || 10.0081, telemetry?.lng || 76.3217]} 
                            zoom={15} 
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={false}
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            />
                            
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
                            <div className="bg-white/5 border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-10">
                                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                                </div>
                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Velocity</p>
                                <p className="text-3xl font-black italic">{telemetry?.speed || 0} <span className="text-[10px] text-zinc-500 font-bold not-italic">KM/H</span></p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">LAT</p>
                                    <p className="text-[11px] font-mono font-bold">{telemetry?.lat.toFixed(4) || "0.0000"}</p>
                                </div>
                                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">LNG</p>
                                    <p className="text-[11px] font-mono font-bold">{telemetry?.lng.toFixed(4) || "0.0000"}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="flex-1">
                        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6">Mission_Logs</h3>
                        <div className="space-y-3 h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {[1].map((_, i) => (
                                <div key={i} className="flex gap-3 items-start border-l border-[#526E48] pl-4 py-1">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#526E48]" />
                                    <div>
                                        <p className="text-[9px] font-black uppercase italic leading-none">Mission Deployed</p>
                                        <p className="text-[7px] font-bold text-zinc-500 uppercase mt-1">Status: HANDED_OVER // 14:24:00</p>
                                    </div>
                                </div>
                            ))}
                            {telemetry && (
                                <div className="flex gap-3 items-start border-l border-white/10 pl-4 py-1 animate-in fade-in slide-in-from-left-2 transition-all">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    <div>
                                        <p className="text-[9px] font-black uppercase italic leading-none">Latest Ping Received</p>
                                        <p className="text-[7px] font-bold text-zinc-500 uppercase mt-1">COORDS: {telemetry.lat.toFixed(2)}, {telemetry.lng.toFixed(2)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    <button 
                        onClick={() => window.alert("Emergency protocols restricted to Admin level-5.")}
                        className="w-full bg-red-600/10 border border-red-600/20 text-red-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95"
                    >
                        Initiate Emergency Intercept
                    </button>
                </aside>

            </main>

            <style jsx global>{`
                .unit-marker-filter {
                    filter: invert(1) hue-rotate(90deg) drop-shadow(0 0 10px rgba(82, 110, 72, 0.5));
                }
                .leaflet-container {
                    background: #0a0a0a !important;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 2px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(82, 110, 72, 0.3);
                }
            `}</style>
        </div>
    );
}
