"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { apiFetch, getImageUrl } from "@/services/api";
import Link from "next/image";
import { 
    ChevronLeft, 
    Save, 
    Trash2, 
    Zap,
    AlertCircle
} from "lucide-react";

const commonFeatures = ["GPS", "Bluetooth", "Sunroof", "Leather Seats", "Rear Camera", "Heated Seats", "Apple CarPlay", "Android Auto"];

export default function EditCarPage() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [carData, setCarData] = useState<any>(null);

    useEffect(() => {
        const fetchCar = async () => {
            try {
                const res = await apiFetch(`/cars/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setCarData(data);
                } else {
                    setError("Asset not found in registry.");
                }
            } catch (err) {
                setError("Protocol Error.");
            } finally {
                setLoading(false);
            }
        };
        fetchCar();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await apiFetch(`/cars/${id}`, {
                method: "PUT",
                body: JSON.stringify(carData),
                headers: { "Content-Type": "application/json" }
            });
            if (res.ok) router.push("/dashboard/customer");
            else setError("Update Rejected.");
        } catch (err) {
            setError("Sync Error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Decommission this asset from global registry?")) return;
        try {
            const res = await apiFetch(`/cars/${id}`, { method: "DELETE" });
            if (res.ok) router.push("/dashboard/customer");
        } catch (err) {
            setError("Decommissioning Failed.");
        }
    };

    if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" /></div>;
    if (!carData) return <div className="min-h-screen bg-white flex items-center justify-center text-red-500 font-black uppercase italic">Dossier Missing.</div>;

    return (
        <div className="min-h-screen bg-[#FDFDFD] text-black p-6 lg:p-12 font-sans selection:bg-[#14532d]/10">
            <div className="max-w-4xl mx-auto space-y-12">
                
                <header className="flex items-center justify-between border-b border-black/[0.05] pb-8">
                    <div className="flex items-center gap-6">
                        <button onClick={() => router.back()} className="w-12 h-12 bg-white border border-black/5 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-black transition-all">
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-black italic uppercase tracking-tighter">EDIT_<span className="text-[#14532d]">REGISTRY</span></h1>
                            <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mt-1">Node ID: {id}</p>
                        </div>
                    </div>
                    <button onClick={handleDelete} className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-100 opacity-60 transition-all">
                        <Trash2 size={14} /> Decommission Asset
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-8 space-y-10">
                        <div className="grid grid-cols-2 gap-6">
                            {[{l:"Brand",k:"name"},{l:"Model",k:"model"}].map(f => (
                                <div key={f.k} className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 italic">{f.l}</label>
                                    <input required value={carData[f.k]} onChange={e => setCarData({...carData, [f.k]: e.target.value})} className="w-full bg-white border border-black/5 rounded-2xl px-5 py-3 text-[11px] font-black uppercase focus:border-[#14532d]/20 transition-all outline-none" />
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                            {[{l:"Price / Day",k:"pricePerDay"},{l:"Year",k:"year"},{l:"Seats",k:"seats"}].map(f => (
                                <div key={f.k} className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 italic">{f.l}</label>
                                    <input type="number" required value={carData[f.k]} onChange={e => setCarData({...carData, [f.k]: e.target.value})} className="w-full bg-white border border-black/5 rounded-2xl px-5 py-3 text-[11px] font-black focus:border-[#14532d]/20 transition-all outline-none" />
                                </div>
                            ))}
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 italic">Tactical Narrative</label>
                            <textarea rows={4} value={carData.description} onChange={e => setCarData({...carData, description: e.target.value})} className="w-full bg-zinc-50 border border-black/5 rounded-3xl px-6 py-5 text-[11px] font-bold italic outline-none focus:border-[#14532d]/20" />
                        </div>
                    </div>

                    <div className="lg:col-span-4 lg:pt-6">
                        <div className="bg-white border border-black/5 p-8 rounded-[2.5rem] shadow-sm space-y-8 sticky top-32">
                             <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 italic">Deployment Status</label>
                                <div className="flex bg-zinc-50 rounded-2xl p-1.5 border border-black/[0.03]">
                                    {[true, false].map(avail => (
                                        <button key={avail.toString()} type="button" onClick={() => setCarData({...carData, isAvailable: avail})} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${carData.isAvailable === avail ? "bg-black text-white" : "text-zinc-400"}`}>
                                            {avail ? "Ready" : "On Trip"}
                                        </button>
                                    ))}
                                </div>
                             </div>
                             <button type="submit" disabled={isSubmitting} className="w-full bg-[#14532d] text-white py-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-[#14532d]/10 hover:scale-[1.02] active:scale-95 transition-all">
                                {isSubmitting ? "SYNC..." : "AUTHORIZED_UPDATE"}
                             </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
