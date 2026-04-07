"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/services/api";
import Link from "next/link";

export default function AddCarPage() {
    const router = useRouter();
    const [step, setStep] = useState(0); // 0: Fill, 1: Review, 2: Success  
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [images, setImages] = useState<(File | null)[]>([null, null, null]);
    const [previews, setPreviews] = useState<(string | null)[]>([null, null, null]);

    const [carData, setCarData] = useState({
        name: "", model: "", year: new Date().getFullYear(), pricePerDay: "", seats: "4", 
        transmission: "Auto", location: "", category: "Luxury", selfDrive: true, withDriver: false,
        fuelType: "Petrol", engine: "", hp: "", topSpeed: "", acceleration: "", 
        description: "",
        features: [] as string[]
    });

    const commonFeatures = ["Sunroof", "ADAS", "Premium Sound", "Heated Seats", "360 Camera", "Venom Brakes"];

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
        if (!carData.name || !carData.model || images[0] === null) { setError("Primary Technical Registry Required."); return; }
        setError(null); setStep(1);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true); setError(null);
        try {
            const formData = new FormData();
            Object.entries(carData).forEach(([key, value]) => {
                if (key === 'features') formData.append(key, JSON.stringify(value));
                else formData.append(key, String(value));
            });
            if (images[0]) formData.append("image", images[0]);
            images.slice(1).forEach(img => { if (img) formData.append("gallery", img); });
            const res = await apiFetch("/cars/host/listing", { method: "POST", body: formData });
            if (res.ok) { setStep(2); }
            else { setError("Commission Denied."); setStep(0); }
        } catch (err) { setError("Protocol Error."); setStep(0); }
        finally { setIsSubmitting(false); }
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] text-black p-4 lg:p-8 font-sans selection:bg-[#C5A037]">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8 flex items-center justify-between border-b border-black/[0.1] pb-6">
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                         <h1 className="text-xl font-black italic uppercase tracking-tighter">ASSET <span className="text-[#C5A037]">{step === 2 ? "REGISTRY SUCCESS" : step === 0 ? "REGISTRY" : "VERIFY"}</span></h1>
                    </motion.div>
                    <div className="flex gap-1.5">
                        {[0, 1, 2].map(i => <div key={i} className={`h-0.5 w-6 transition-all duration-500 ${step === i ? "bg-[#C5A037] w-10" : "bg-black/10"}`} />)}
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {step === 0 && (
                        <motion.form key="filling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleReview} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-7 space-y-12">
                                <section className="space-y-4">
                                    <h2 className="text-[9px] font-black uppercase tracking-[0.4em] text-black italic">Images Of Your Car</h2>
                                    <div className="grid grid-cols-3 gap-3">
                                        {["img1", "img2", "img3"].map((label, i) => (
                                            <label key={i} className="group relative aspect-square bg-zinc-50 border border-black/10 rounded-2xl overflow-hidden cursor-pointer hover:border-[#C5A037] transition-all">
                                                {previews[i] ? <img src={previews[i]!} className="w-full h-full object-cover" /> : (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                                        <span className="text-[7px] font-black uppercase tracking-widest text-black group-hover:text-[#C5A037]">{label}</span>
                                                    </div>
                                                )}
                                                <input type="file" onChange={e => handleFileChange(i, e)} className="hidden" accept="image/*" />
                                            </label>
                                        ))}
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <h2 className="text-[9px] font-black uppercase tracking-[0.4em] text-black italic">Technical Spec</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[{l:"Brand",k:"name"},{l:"Model",k:"model"}].map(f => (
                                            <div key={f.k} className="space-y-1.5">
                                                <label className="text-[7px] font-black uppercase text-black ml-1">{f.l}</label>
                                                <input required value={(carData as any)[f.k]} onChange={e => setCarData({...carData, [f.k]: e.target.value})} className="w-full bg-white border border-black/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase transition-all focus:border-[#C5A037] outline-none" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[{l:"Year",k:"year"},{l:"Seats",k:"seats"}].map(f => (
                                            <div key={f.k} className="space-y-1.5">
                                                <label className="text-[7px] font-black uppercase text-black ml-1">{f.l}</label>
                                                <input type="number" value={(carData as any)[f.k]} onChange={e => setCarData({...carData, [f.k]: e.target.value})} className="w-full bg-white border border-black/10 rounded-xl px-4 py-2.5 text-[10px] font-black transition-all outline-none" />
                                            </div>
                                        ))}
                                        <div className="space-y-1.5">
                                            <label className="text-[7px] font-black uppercase text-black ml-1">Energy</label>
                                            <select value={carData.fuelType} onChange={e => setCarData({...carData, fuelType: e.target.value})} className="w-full bg-white border border-black/10 rounded-xl px-4 py-2 text-[10px] font-black appearance-none outline-none">
                                                {["Petrol", "Hybrid", "Electric"].map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <div className="flex flex-wrap gap-1.5">
                                        {commonFeatures.map(feat => (
                                            <button key={feat} type="button" onClick={() => toggleFeature(feat)} className={`px-3 py-1.5 rounded-lg text-[7px] font-black uppercase tracking-widest border transition-all ${carData.features.includes(feat) ? 'bg-black text-[#C5A037] border-black shadow-lg scale-105' : 'bg-transparent border-black/5 text-black hover:opacity-100 hover:border-black/30'}`}>{feat}</button>
                                        ))}
                                    </div>
                                    <textarea rows={3} value={carData.description} onChange={e => setCarData({...carData, description: e.target.value})} placeholder="Description About Your Car" className="w-full bg-zinc-50 border border-black/5 rounded-2xl px-6 py-4 text-[10px] font-bold italic text-black placeholder:text-black/30 outline-none shadow-inner" />
                                </section>
                            </div>

                            <div className="lg:col-span-5 relative">
                                <div className="bg-white border border-black/10 p-8 rounded-[2rem] space-y-8 sticky top-8 shadow-xl">
                                    <div className="text-center">
                                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-black mb-2 italic">Price</p>
                                        <div className="relative inline-block mx-auto">
                                            <input type="number" required value={carData.pricePerDay} onChange={e => setCarData({...carData, pricePerDay: e.target.value})} className="w-32 bg-transparent text-3xl font-black italic text-black text-center outline-none" />
                                            <span className="absolute -left-4 top-1 text-xs font-bold text-[#C5A037]">₹</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-2">
                                            {[{l:"SELF-DRIVE",v:carData.selfDrive,s:true}, {l:"WITH DRIVER",v:carData.withDriver,s:false}].map(opt => (
                                                <button key={opt.l} type="button" onClick={() => setCarData({...carData, selfDrive: opt.s, withDriver: !opt.s})} className={`py-3 rounded-xl text-[8px] font-black tracking-widest border transition-all ${opt.v ? "bg-black text-[#C5A037] border-black shadow-lg" : "bg-zinc-50 text-black border-black/10"}`}>{opt.l}</button>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {["Auto", "Manual"].map(t => (
                                                <button key={t} type="button" onClick={() => setCarData({...carData, transmission: t})} className={`py-3 rounded-xl text-[8px] font-black tracking-widest border transition-all ${carData.transmission === t ? "bg-[#C5A037] text-black border-[#C5A037]" : "bg-zinc-50 text-black border-black/10"}`}>{t.toUpperCase()}</button>
                                            ))}
                                        </div>
                                        <input required value={carData.location} onChange={e => setCarData({...carData, location: e.target.value})} placeholder="Enter The Location" className="w-full bg-zinc-50 border border-black/10 rounded-xl px-4 py-3 text-[9px] font-black tracking-widest outline-none text-center shadow-inner" />
                                    </div>
                                    <button type="submit" className="w-full bg-black text-white py-4 rounded-xl text-[9px] font-black tracking-[0.4em] shadow-lg hover:bg-[#C5A037] hover:text-black transition-all">ADD TO FLEET</button>
                                </div>
                            </div>
                        </motion.form>
                    )}

                    {step === 1 && (
                        <motion.div key="review" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8 pb-12">
                            <div className="grid grid-cols-3 gap-3">
                                {previews.map((p, i) => p && <div key={i} className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg"><img src={p} className="w-full h-full object-cover" /></div>)}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                <div className="lg:col-span-3 bg-white border border-black/10 p-8 rounded-[2.5rem] space-y-8 shadow-xl">
                                    <div>
                                        <p className="text-[8px] font-black uppercase text-[#C5A037] mb-1 italic">Asset Profile</p>
                                        <h3 className="text-3xl font-black italic uppercase tracking-tight text-black">{carData.name} <span className="text-zinc-400">{carData.model}</span></h3>
                                    </div>

                                    <div className="grid grid-cols-5 gap-4 border-y border-black/5 py-6">
                                        {[
                                            {l:"YEAR", v:carData.year}, {l:"SEATS", v:carData.seats}, 
                                            {l:"ENERGY", v:carData.fuelType}, {l:"GEAR", v:carData.transmission},
                                            {l:"PILOT", v:carData.selfDrive ? "SELF" : "STAFF"}
                                        ].map(s => (
                                            <div key={s.l}>
                                                <p className="text-[7px] font-black text-black mb-0.5">{s.l}</p>
                                                <p className="text-[11px] font-black italic text-black">{s.v}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[8px] font-black italic uppercase text-black">Equipment Suite</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {carData.features.length > 0 ? carData.features.map(f => <span key={f} className="px-3 py-1 bg-black text-[#C5A037] rounded-full text-[8px] font-black uppercase">{f}</span>) : <span className="text-[10px] italic text-zinc-300">Standard Spec</span>}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-black/10">
                                        <p className="text-[9px] font-black italic text-black leading-snug max-w-xl">"{carData.description || "No narrative listed."}"</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-black text-white p-8 rounded-[2rem] space-y-6 shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-[#C5A037]/10 rounded-full blur-2xl" />
                                        <div className="text-center">
                                            <p className="text-[8px] font-black text-[#C5A037] mb-1 tracking-widest">YIELD PROTOCOL</p>
                                            <p className="text-3xl font-black italic tracking-tighter">₹{Number(carData.pricePerDay).toLocaleString()}</p>
                                        </div>
                                        <div className="space-y-2 pt-4 border-t border-white/5 text-[8px] font-black uppercase text-center tracking-widest text-[#C5A037]">
                                            <p>LOCATION / {carData.location}</p>
                                            <p className="text-white">STATUS / ACTIVE</p>
                                        </div>
                                    </div>

                                    <button onClick={() => setStep(0)} className="w-full bg-white border border-black/10 py-3 rounded-xl text-[9px] font-black tracking-widest hover:bg-black hover:text-white transition-all shadow-md text-black">EDIT RECORD</button>
                                    <button disabled={isSubmitting} onClick={handleSubmit} className="w-full bg-[#C5A037] text-black py-4 rounded-xl text-[9px] font-black tracking-[0.3em] shadow-lg hover:shadow-[#C5A037]/20 transition-all font-sans">{isSubmitting ? "SYNC..." : "CONFIRM"}</button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-24 text-center space-y-10">
                            <div className="w-20 h-20 bg-black text-[#C5A037] rounded-full flex items-center justify-center text-3xl font-black italic shadow-2xl animate-bounce">✓</div>
                            <div className="space-y-4">
                                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-black">CAR ADDED TO THE FLEET.</h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 italic">Asset commission verified and operational in the registry.</p>
                            </div>
                            
                            <Link href="/cars" className="group flex items-center gap-6 bg-black text-white px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.6em] transition-all hover:bg-[#C5A037] hover:text-black shadow-2xl">
                                VIEW FLEET LISTING
                                <span className="text-2xl transition-transform group-hover:translate-x-3">→</span>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
