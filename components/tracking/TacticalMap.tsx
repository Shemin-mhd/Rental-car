"use client";

import { useEffect, useState, useRef } from "react";
import { getSocket } from "@/components/providers/ChatSocketProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation, Map as MapIcon, Layers, Crosshair } from "lucide-react";

// 🔱 We'll use a clean Leaflet implementation via a dynamic script approach to ensure zero-config
export default function TacticalMap({ carId, hostCars }: { carId?: string, hostCars?: string[] }) {
    const [locations, setLocations] = useState<Record<string, any>>({});
    const [selectedCar, setSelectedCar] = useState<string | null>(null);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<Record<string, any>>({});
    const socket = getSocket();

    // 🗺️ Initialize Leaflet Map
    useEffect(() => {
        if (typeof window === "undefined") return;

        // Load Leaflet CSS/JS dynamically
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);

        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => {
            const L = (window as any).L;
            if (!L || mapRef.current) return;

            // 🔱 Initialize Map centered on Kerala (Kochi)
            mapRef.current = L.map("leaflet-map-container", {
                zoomControl: false,
                attributionControl: false
            }).setView([10.0159, 76.3419], 10);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                maxZoom: 20
            }).addTo(mapRef.current);

            // Add Zoom Control at bottom right
            L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
        };
        document.head.appendChild(script);

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // 📡 Handle Live Telemetry
    useEffect(() => {
        if (!socket) return;

        const subscribe = () => {
            if (carId) {
                socket.emit("join-tracking", carId);
            } else if (hostCars && hostCars.length > 0) {
                hostCars.forEach(id => socket.emit("join-tracking", id));
            }
        };

        subscribe();
        socket.on("connect", subscribe);

        const handleUpdate = (data: any) => {
            const L = (window as any).L;
            if (!L || !mapRef.current) return;

            setLocations(prev => ({ ...prev, [data.carId]: data }));

            // 🏎️ Create or Update Marker
            if (!markersRef.current[data.carId]) {
                const customIcon = L.divIcon({
                    className: 'custom-div-icon',
                    html: `
                        <div class="relative">
                            <div class="absolute -inset-4 bg-[#14532d]/20 rounded-full animate-ping"></div>
                            <div class="w-8 h-8 bg-[#14532d] rounded-full border-4 border-white shadow-2xl flex items-center justify-center">
                                <div class="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                        </div>
                    `,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });

                markersRef.current[data.carId] = L.marker([data.lat, data.lng], { icon: customIcon })
                    .addTo(mapRef.current);
                
                // 🔱 Force Fly-To on first detected signal
                mapRef.current.flyTo([data.lat, data.lng], 16, { duration: 2 });
            } else {
                markersRef.current[data.carId].setLatLng([data.lat, data.lng]);
            }

            if (!selectedCar) setSelectedCar(data.carId);
        };

        socket.on("car-location-updated", handleUpdate);
        socket.on("global-car-movement", handleUpdate);

        return () => {
            socket.off("connect", subscribe);
            socket.off("car-location-updated", handleUpdate);
            socket.off("global-car-movement", handleUpdate);
        };
    }, [socket, carId, hostCars, selectedCar]);

    const recenterMap = () => {
        const firstLoc = Object.values(locations)[0] as any;
        if (firstLoc && mapRef.current) {
            mapRef.current.flyTo([firstLoc.lat, firstLoc.lng], 17);
        }
    };

    return (
        <div className="w-full h-full bg-[#FAFAFA] relative rounded-[3rem] overflow-hidden border border-zinc-100 shadow-2xl group">
            {/* 🔱 The Leaflet Container */}
            <div id="leaflet-map-container" className="absolute inset-0 z-0 bg-zinc-50" />

            <style jsx global>{`
                .custom-div-icon { background: none !important; border: none !important; }
                .leaflet-container { font-family: inherit; }
            `}</style>

            {/* 🔱 Modern Overlay UI */}
            <div className="absolute top-8 left-8 z-10 flex flex-col gap-4">
                <div className="bg-white/95 backdrop-blur-xl p-6 rounded-[2.5rem] border border-zinc-100 shadow-2xl w-64">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-[#14532d]/5 rounded-xl">
                            <MapIcon className="text-[#14532d]" size={18} />
                        </div>
                        <h3 className="text-[11px] font-black italic uppercase tracking-tighter text-black leading-none">Fleet_Uplink</h3>
                    </div>
                    
                    <div className="space-y-4">
                        {Object.keys(locations).length === 0 ? (
                            <div className="flex flex-col items-center py-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse mb-2" />
                                <p className="text-[8px] font-black uppercase text-zinc-400 tracking-widest italic">Waiting for Signal...</p>
                            </div>
                        ) : (
                            Object.values(locations).map((loc: any) => (
                                <motion.div 
                                    key={loc.carId}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => mapRef.current?.flyTo([loc.lat, loc.lng], 16)}
                                    className="p-3 bg-white rounded-2xl border border-zinc-100 shadow-sm cursor-pointer hover:border-[#14532d]/20 transition-all group/item"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-zinc-50 rounded-lg flex items-center justify-center text-[#14532d] group-hover/item:bg-[#14532d] group-hover/item:text-white transition-all">
                                            <Navigation size={14} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-[10px] font-black uppercase italic text-black truncate">{loc.carName}</p>
                                            <p className="text-[7px] font-bold text-[#14532d] uppercase">ACTIVE_TELEMETRY</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* 🔱 Navigation Controls */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
                <button 
                    onClick={recenterMap}
                    className="bg-white/95 backdrop-blur-xl px-6 py-4 rounded-2xl border border-zinc-100 shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all text-[#14532d]"
                >
                    <Crosshair size={18} />
                    <span className="text-[9px] font-black uppercase tracking-widest italic pt-0.5">Recenter_Signal</span>
                </button>
            </div>
        </div>
    );
}
