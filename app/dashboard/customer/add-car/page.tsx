"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/services/api";
import Link from "next/link";
import Image from "next/image";
import {
    ChevronLeft,
    CheckCircle2,
    Plus,
    Activity,
    ShieldCheck,
    CloudUpload,
    Check,
    FileText
} from "lucide-react";

export default function AddCarPage() {
    const router = useRouter();
    const [step, setStep] = useState(0); 
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [images, setImages] = useState<(File | null)[]>([null, null, null]);
    const [previews, setPreviews] = useState<(string | null)[]>([null, null, null]);
    
    // 🛡️ RC Document States
    const [rcFront, setRcFront] = useState<File | null>(null);
    const [rcBack, setRcBack] = useState<File | null>(null);
    const [rcFrontPreview, setRcFrontPreview] = useState<string | null>(null);
    const [rcBackPreview, setRcBackPreview] = useState<string | null>(null);

    const [carData, setCarData] = useState({
        name: "", model: "", year: new Date().getFullYear(), pricePerDay: "", seats: "4",
        transmission: "Auto", location: "", category: "Luxury", selfDrive: true, withDriver: false,
        fuelType: "Petrol", engine: "", hp: "", topSpeed: "", acceleration: "",
        description: "",
        features: [] as string[]
    });

    const commonFeatures = ["Sunroof", "ADAS", "Premium Sound", "Heated Seats", "360 Camera", "Venom Brakes", "Adaptive Lights"];

    useEffect(() => {
        const role = localStorage.getItem("role");
        if (role !== "customer") router.push("/login");
    }, [router]);

    const toggleFeature = (feat: string) => {
        setCarData(prev => ({
            ...prev,
            features: prev.features.includes(feat) ? prev.features.filter(f => f !== feat) : [...prev.features, feat]
        }));
    };

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

            // 🛡️ Append RC Documents
            if (rcFront) formData.append("rcFront", rcFront);
            if (rcBack) formData.append("rcBack", rcBack);

            const res = await apiFetch("/cars/host/listing", { method: "POST", body: formData });
            if (res.ok) {
                setStep(2);
            } else {
                const data = await res.json();
                setError(data.message || "Registry Synchronization Rejected.");
            }
        } catch (err) {
            setError("Protocol Connection Error.");
        } finally {
            setIsSubmitting(false);
        }
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
                                                    {previews[i] ? (
                                                        <img src={previews[i]!} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Preview" />
                                                    ) : (
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

                                    {/* 🛡️ RC Book Section */}
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
                                                        <input type="file" className="hidden" onChange={e => {
                                                            const f = e.target.files?.[0];
                                                            if(f) { d.s(f); d.sp(URL.createObjectURL(f)); }
                                                        }} />
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
                                                    {["Petrol", "Electric", "Hybrid"].map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
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

                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-2">
                                                    {[{ l: "SELF-DRIVE", v: carData.selfDrive, s: true }, { l: "WITH PILOT", v: carData.withDriver, s: false }].map(opt => (
                                                        <button key={opt.l} type="button" onClick={() => setCarData({ ...carData, selfDrive: opt.s, withDriver: !opt.s })} className={`py-3 rounded-xl text-[7.5px] font-black tracking-[0.2em] border transition-all ${opt.v ? "bg-black text-white border-black shadow-lg" : "bg-zinc-50/50 text-black border-black/5 hover:border-black/10"}`}>{opt.l}</button>
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {["Auto", "Manual"].map(t => (
                                                        <button key={t} type="button" onClick={() => setCarData({ ...carData, transmission: t })} className={`py-3 rounded-xl text-[7.5px] font-black tracking-[0.2em] border transition-all ${carData.transmission === t ? "bg-[#14532d] text-white border-[#14532d]" : "bg-zinc-50/50 text-black border-black/5"}`}>{t.toUpperCase()}</button>
                                                    ))}
                                                </div>
                                                <input required value={carData.location} onChange={e => setCarData({ ...carData, location: e.target.value })} placeholder="DEPLOYMENT BASE (CITY)" className="w-full bg-zinc-50/50 border border-black/5 rounded-xl px-4 py-3.5 text-[8px] font-black uppercase tracking-[0.3em] outline-none text-center shadow-inner text-black placeholder:text-zinc-300" />
                                            </div>

                                            <button type="submit" className="w-full bg-black text-white py-4 rounded-2xl text-[9px] font-black tracking-[0.4em] shadow-2xl hover:bg-[#14532d] transition-all active:scale-95 italic text-zinc-100">PROCEED_TO_VERIFY</button>
                                        </section>
                                    </div>
                                </div>
                            </motion.form>
                        )}

                        {step === 1 && (
                            <motion.div key="review" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto space-y-10 pb-24">
                                {error && <p className="bg-red-50 text-red-500 text-[10px] font-black uppercase p-4 rounded-2xl tracking-widest italic border border-red-100 shadow-sm text-center">/ ALERT: {error}</p>}
                                <div className="grid grid-cols-3 gap-4">
                                    {previews.map((p, i) => p && (
                                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="aspect-video bg-zinc-100 rounded-[1.5rem] overflow-hidden shadow-sm border border-black/5">
                                            <img src={p} className="w-full h-full object-cover" alt="Review" />
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="bg-white/70 backdrop-blur-xl border border-white p-10 rounded-[2.5rem] shadow-sm space-y-8">
                                    <div className="flex justify-between items-start border-b border-black/[0.02] pb-8">
                                        <div>
                                            <p className="text-[7.5px] font-black text-[#14532d] mb-1.5 uppercase italic tracking-widest">Asset Dossier Finalized</p>
                                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-black">{carData.name} <span className="text-zinc-300">/ {carData.model}</span></h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[7.5px] font-black text-black mb-1.5 uppercase tracking-widest opacity-30">UNIT_YIELD</p>
                                            <p className="text-2xl font-black italic text-black tracking-tight">₹{Number(carData.pricePerDay).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-8 border-b border-black/[0.02] pb-8">
                                        <div className="space-y-3">
                                            <p className="text-[7.5px] font-black text-black uppercase tracking-widest opacity-30 italic text-black">Ownership Records Attached</p>
                                            <div className="flex gap-4">
                                                <div className="flex items-center gap-2 bg-zinc-50 px-3 py-2 rounded-xl border border-black/5"><FileText size={12} className="text-[#14532d]" /><span className="text-[8px] font-black uppercase text-black">REG_FRONT</span></div>
                                                <div className="flex items-center gap-2 bg-zinc-50 px-3 py-2 rounded-xl border border-black/5"><FileText size={12} className="text-[#14532d]" /><span className="text-[8px] font-black uppercase text-black">REG_BACK</span></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-6">
                                        {[
                                            { l: "YEAR", v: carData.year }, { l: "GEAR", v: carData.transmission },
                                            { l: "CAPACITY", v: carData.seats + " SEATS" }, { l: "ENERGY", v: carData.fuelType }
                                        ].map(s => (
                                            <div key={s.l} className="space-y-1">
                                                <p className="text-[6.5px] font-black text-black uppercase tracking-widest italic opacity-30 text-black">{s.l}</p>
                                                <p className="text-[10px] font-black italic text-black uppercase">{s.v}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-4 justify-center">
                                        <button onClick={() => setStep(0)} className="w-32 border border-black/5 py-4 rounded-2xl text-[8px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all italic text-black">Abort / Edit</button>
                                        <button disabled={isSubmitting} onClick={handleSubmit} className="w-64 bg-black text-white py-4 rounded-2xl text-[9px] font-black tracking-[0.5em] shadow-2xl hover:bg-[#14532d] transition-all flex items-center justify-center gap-4 italic group">
                                            {isSubmitting ? "SYNCHRONIZING..." : (<><ShieldCheck size={16} className="text-[#14532d]" /> AUTHORIZE_REGISTRY</>)}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center space-y-10">
                                <div className="relative">
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="w-20 h-20 bg-[#14532d] text-white rounded-[2rem] flex items-center justify-center text-3xl font-black italic shadow-[0_20px_60px_rgba(20,83,45,0.4)] relative z-10">
                                        <Check size={32} strokeWidth={3} />
                                    </motion.div>
                                    <div className="absolute -inset-10 bg-[#14532d]/10 rounded-full blur-3xl animate-pulse" />
                                </div>

                                <div className="space-y-3">
                                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-black">Asset Commissioned Successfully.</h2>
                                    <p className="text-[8px] font-black uppercase tracking-[0.8em] text-black italic opacity-40">Data synchronized. Asset is now live in the global registry.</p>
                                </div>

                                <div className="flex gap-4">
                                    <Link href="/dashboard/customer" className="bg-black text-white px-10 py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.5em] shadow-2xl hover:bg-[#14532d] transition-all italic text-zinc-100">DASHBOARD</Link>
                                    <button onClick={() => { setStep(0); setPreviews([null, null, null]); setRcFront(null); setRcBack(null); }} className="px-10 py-4 border border-black/5 rounded-2xl text-[9px] font-black uppercase tracking-[0.4em] text-black hover:text-[#14532d] hover:border-[#14532d]/20 transition-all italic">New Record</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { display: none; }
                input[type="number"]::-webkit-inner-spin-button, 
                input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
            `}</style>
        </div>
    );
}
