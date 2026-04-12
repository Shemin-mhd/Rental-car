"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { apiFetch } from "@/services/api";
import Link from "next/link";
import {
    ChevronLeft,
    ShieldCheck,
    CloudUpload,
    Check,
    FileText,
    AlertCircle
} from "lucide-react";

export default function UserVerifyPage() {
    const router = useRouter();
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [licenseFront, setLicenseFront] = useState<File | null>(null);
    const [licenseBack, setLicenseBack] = useState<File | null>(null);
    const [frontPreview, setFrontPreview] = useState<string | null>(null);
    const [backPreview, setBackPreview] = useState<string | null>(null);

    const fetchStatus = async () => {
        try {
            const res = await apiFetch("/auth/status");
            if (res.ok) setStatus(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchStatus(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!licenseFront || !licenseBack) {
            setError("Both License Front and Back images are mandatory.");
            return;
        }
        
        setIsSubmitting(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append("licenseFront", licenseFront);
            formData.append("licenseBack", licenseBack);

            const res = await apiFetch("/auth/upload-docs", { method: "POST", body: formData });
            if (res.ok) {
                fetchStatus();
                alert("Identity documents submitted. Awaiting administrative audit.");
            } else {
                const data = await res.json();
                setError(data.message || "Shield Synchronization Rejected.");
            }
        } catch (err) { setError("Protocol link failure."); }
        finally { setIsSubmitting(false); }
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#14532d] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8F9FA] text-black font-sans flex flex-col">
            <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(20,83,45,0.03),transparent_70%)]" />

            <div className="flex-1 p-6 lg:p-12 relative z-10 max-w-4xl mx-auto w-full">
                <header className="mb-12 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard/customer" className="w-12 h-12 bg-white border border-black/5 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-black transition-all shadow-sm">
                            <ChevronLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black italic uppercase tracking-tighter">Identity_<span className="text-[#14532d]">Gate.</span></h1>
                            <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-30 mt-1">Vulnerability Protection Layer // Level 2</p>
                        </div>
                    </div>
                    {status?.verificationStatus && (
                        <div className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border ${status.verificationStatus === 'APPROVED' ? 'bg-green-50 border-green-100 text-green-600' : status.verificationStatus === 'PENDING' ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                            Status: {status.verificationStatus}
                        </div>
                    )}
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Status Info */}
                    <div className="space-y-8">
                        <div className="bg-white/70 backdrop-blur-xl border border-white p-8 rounded-[2.5rem] shadow-sm space-y-6">
                            <ShieldCheck size={32} className="text-[#14532d]" />
                            <h2 className="text-xl font-black italic uppercase text-black leading-tight">Verification Protocol Requirement</h2>
                            <p className="text-[10px] font-bold text-zinc-500 leading-relaxed italic">To ensure the integrity of the Elite Fleet Exchange, all commanders must verify their driving authority. Submit your Driving License (Front & Back) for administrative audit.</p>
                            
                            {status?.verificationStatus === 'REJECTED' && (
                                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 space-y-2">
                                    <div className="flex items-center gap-2 text-red-600">
                                        <AlertCircle size={14} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Audit Failed</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-red-500 italic">" {status.rejectionReason || "Documents provided were insufficient or illegible."} "</p>
                                </div>
                            )}

                             {status?.verificationStatus === 'APPROVED' && (
                                <div className="bg-green-50 p-6 rounded-2xl border border-green-100 space-y-2">
                                    <div className="flex items-center gap-2 text-green-600">
                                        <Check size={14} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Identity Secure</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-green-500 italic">Your tactical profile is fully authorized for all platform operations.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upload Section */}
                    {status?.verificationStatus !== 'APPROVED' && (
                        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-xl space-y-8">
                            <div className="space-y-6">
                                <section className="space-y-4">
                                    <h3 className="text-[9px] font-black uppercase tracking-[0.4em] opacity-30 italic">Registry Upload Hub</h3>
                                    
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <p className="text-[7.5px] font-black uppercase opacity-40 ml-1">License FRONT Image</p>
                                            <label className={`w-full h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${frontPreview ? 'border-[#14532d] bg-[#14532d]/5 shadow-inner' : 'border-black/5 hover:border-[#14532d]/20 bg-zinc-50/50 shadow-sm'}`}>
                                                {frontPreview ? <img src={frontPreview} className="w-full h-full object-contain p-4" /> : <><CloudUpload size={32} className="text-zinc-200" /><span className="text-[8px] font-black uppercase tracking-widest mt-3">Upload Front Side</span></>}
                                                <input type="file" onChange={e => { const f = e.target.files?.[0]; if(f){ setLicenseFront(f); setFrontPreview(URL.createObjectURL(f)); } }} className="hidden" />
                                            </label>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-[7.5px] font-black uppercase opacity-40 ml-1">License BACK Image</p>
                                            <label className={`w-full h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${backPreview ? 'border-[#14532d] bg-[#14532d]/5 shadow-inner' : 'border-black/5 hover:border-[#14532d]/20 bg-zinc-50/50 shadow-sm'}`}>
                                                {backPreview ? <img src={backPreview} className="w-full h-full object-contain p-4" /> : <><FileText size={32} className="text-zinc-200" /><span className="text-[8px] font-black uppercase tracking-widest mt-3">Upload Back Side</span></>}
                                                <input type="file" onChange={e => { const f = e.target.files?.[0]; if(f){ setLicenseBack(f); setBackPreview(URL.createObjectURL(f)); } }} className="hidden" />
                                            </label>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {error && <p className="text-[8px] font-black uppercase tracking-widest text-red-500 text-center">/ ALERT: {error}</p>}

                            <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white py-5 rounded-3xl text-[9px] font-black uppercase tracking-[0.5em] italic shadow-2xl hover:bg-[#14532d] transition-all disabled:opacity-50">
                                {isSubmitting ? "TRANSMITTING..." : "AUTHORIZE_IDENTITY"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
