"use client";

import { useEffect, useState, use, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, getImageUrl } from "@/services/api";

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
}

// ─── Validation helpers ───────────────────────────────────────────────────────

const PHONE_RE = /^[6-9]\d{9}$/; // Indian 10-digit mobile
const NAME_RE = /^[a-zA-Z\s.'-]{2,60}$/;
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function validateForm(
    formData: { fullName: string; nomineeName: string; primaryPhone: string; secondaryPhone: string; address: string },
    idFiles: { Front: File | null; Back: File | null }
) {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
        errors.fullName = "Full name is required.";
    } else if (!NAME_RE.test(formData.fullName.trim())) {
        errors.fullName = "Enter a valid name (2-60 characters, letters only).";
    }

    if (!formData.nomineeName.trim()) {
        errors.nomineeName = "Nominee name is required.";
    } else if (!NAME_RE.test(formData.nomineeName.trim())) {
        errors.nomineeName = "Enter a valid nominee name.";
    }

    if (!formData.primaryPhone.trim()) {
        errors.primaryPhone = "Primary mobile number is required.";
    } else if (!PHONE_RE.test(formData.primaryPhone.replace(/\s/g, ""))) {
        errors.primaryPhone = "Enter a valid 10-digit Indian mobile number.";
    }

    if (formData.secondaryPhone.trim() && !PHONE_RE.test(formData.secondaryPhone.replace(/\s/g, ""))) {
        errors.secondaryPhone = "Enter a valid 10-digit Indian mobile number.";
    }

    if (formData.primaryPhone.trim() && formData.secondaryPhone.trim() &&
        formData.primaryPhone.replace(/\s/g, "") === formData.secondaryPhone.replace(/\s/g, "")) {
        errors.secondaryPhone = "Secondary number must differ from primary.";
    }

    if (!formData.address.trim()) {
        errors.address = "Residential address is required.";
    } else if (formData.address.trim().length < 3) {
        errors.address = "Please enter a valid address.";
    }

    // ID files
    (["Front", "Back"] as const).forEach(side => {
        const file = idFiles[side];
        if (!file) {
            errors[`id${side}`] = `${side} side of ID proof is required.`;
        } else if (!ALLOWED_TYPES.includes(file.type)) {
            errors[`id${side}`] = "Only JPG, PNG, WebP or PDF allowed.";
        } else if (file.size > MAX_FILE_BYTES) {
            errors[`id${side}`] = "File size must be under 5 MB.";
        }
    });

    return errors;
}

// ─── Progress step indicator ───────────────────────────────────────────────────

const STEPS = ["Personal Info", "ID Upload", "Confirm"];

function StepIndicator({ current }: { current: number }) {
    return (
        <div className="flex items-center gap-0 mb-10">
            {STEPS.map((label, i) => (
                <div key={label} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black border transition-all duration-300 ${i < current
                            ? "bg-[#C5A059] border-[#C5A059] text-black"
                            : i === current
                                ? "border-[#C5A059] text-[#C5A059] bg-transparent"
                                : "border-white/10 text-zinc-600 bg-transparent"
                            }`}>
                            {i < current ? (
                                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                            ) : i + 1}
                        </div>
                        <span className={`text-[7px] font-black uppercase tracking-widest whitespace-nowrap ${i <= current ? "text-zinc-400" : "text-zinc-700"}`}>{label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div className={`flex-1 h-[1px] mx-2 mb-4 transition-all duration-500 ${i < current ? "bg-[#C5A059]/50" : "bg-white/5"}`} />
                    )}
                </div>
            ))}
        </div>
    );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────

function Field({ label, error, children, required }: { label: string; error?: string; children: React.ReactNode; required?: boolean }) {
    return (
        <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-zinc-500 ml-1">
                {label}
                {required && <span className="text-red-500/70">*</span>}
            </label>
            {children}
            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-center gap-1.5 text-[9px] font-bold text-red-400 ml-1"
                    >
                        <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
                        </svg>
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function BookingConfirmPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <BookingConfirmContent id={params.id} />
        </Suspense>
    );
}

function BookingConfirmContent({ id }: { id: string }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [car, setCar] = useState<Car | null>(null);
    const [loading, setLoading] = useState(true);

    const [startDate] = useState(searchParams.get("start") || "");
    const [endDate] = useState(searchParams.get("end") || "");
    const [submitted, setSubmitted] = useState(false); // show errors only after first attempt

    const [formData, setFormData] = useState({
        fullName: "",
        nomineeName: "",
        primaryPhone: "",
        secondaryPhone: "",
        address: ""
    });

    const [idFiles, setIdFiles] = useState<{ Front: File | null; Back: File | null }>({
        Front: null,
        Back: null,
    });

    // Object URL previews for image files
    const [previews, setPreviews] = useState<{ Front: string | null; Back: string | null }>({
        Front: null,
        Back: null,
    });

    // Generate / revoke object URLs when files change
    useEffect(() => {
        (["Front", "Back"] as const).forEach(side => {
            const file = idFiles[side];
            if (file && file.type.startsWith("image/")) {
                const url = URL.createObjectURL(file);
                setPreviews(prev => ({ ...prev, [side]: url }));
                return () => URL.revokeObjectURL(url);
            } else {
                setPreviews(prev => ({ ...prev, [side]: null }));
            }
        });
    }, [idFiles]);

    // Live errors (computed, not stored)
    const errors = submitted ? validateForm(formData, idFiles) : {};
    const isValid = Object.keys(validateForm(formData, idFiles)).length === 0;

    // Determine current step for indicator
    const personalDone =
        NAME_RE.test(formData.fullName.trim()) &&
        NAME_RE.test(formData.nomineeName.trim()) &&
        PHONE_RE.test(formData.primaryPhone.replace(/\s/g, "")) &&
        formData.address.trim().length >= 3;
    const uploadsDone = !!idFiles.Front && !!idFiles.Back;
    const currentStep = !personalDone ? 0 : !uploadsDone ? 1 : 2;

    const days = startDate && endDate
        ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24)))
        : 1;
    const baseTotal = car ? car.pricePerDay * days : 0;

    useEffect(() => {
        if (!startDate || !endDate) {
            router.push(`/cars/${id}`);
            return;
        }
        apiFetch(`/cars/${id}`)
            .then(r => r.json())
            .then(setCar)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id, startDate, endDate, router]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirm = async () => {
        setSubmitted(true);
        if (!isValid) {
            const el = document.querySelector("[data-error=\"true\"]");
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }

        setIsSubmitting(true);
        try {
            const formDataToSubmit = new FormData();
            formDataToSubmit.append("carId", id);
            formDataToSubmit.append("startDate", startDate);
            formDataToSubmit.append("endDate", endDate);

            formDataToSubmit.append("fullName", formData.fullName);
            formDataToSubmit.append("nomineeName", formData.nomineeName);
            formDataToSubmit.append("primaryPhone", formData.primaryPhone);
            formDataToSubmit.append("secondaryPhone", formData.secondaryPhone);
            formDataToSubmit.append("address", formData.address);

            if (idFiles.Front) formDataToSubmit.append("idFront", idFiles.Front);
            if (idFiles.Back) formDataToSubmit.append("idBack", idFiles.Back);

            const res = await apiFetch("/bookings", {
                method: "POST",
                body: formDataToSubmit,
            });

            const data = await res.json();
            if (res.ok) {
                const p = new URLSearchParams({ start: startDate, end: endDate });
                router.push(`/bookings/payment/${data.bookingId}?${p.toString()}`);
            } else {
                alert(data.message || "Archive transmission failed");
            }
        } catch (err) {
            alert("Elite Network failure. Please check your uplink.");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || !car) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#526E48] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-white text-black selection:bg-[#526E48]/30 pb-24 font-sans">
            {/* Navbar */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-white/60 backdrop-blur-xl border-b border-black/[0.03]">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href={`/cars/${id}`} className="p-2 hover:bg-black/5 rounded-full transition-colors flex items-center gap-2 group">
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-black transition-colors">Go Back</span>
                    </Link>
                    <div className="flex items-center gap-2.5">
                        <div className="bg-[#526E48] px-1.5 py-0.5 rounded-sm text-[8px] text-white font-black -skew-x-12">RG</div>
                        <span className="text-sm font-black tracking-tighter uppercase italic text-black">Rental_<span className="text-[#526E48]">Garage</span></span>
                    </div>
                    <div className="w-10" />
                </div>
            </nav>

            <div className="max-w-6xl mx-auto pt-32 px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:items-start">
                    {/* ── Left Form ── */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* Header */}
                        <header className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-50 border border-black/[0.03]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#526E48] animate-pulse" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-[#526E48]">Secure Verification Pathway</span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-black tracking-tighter uppercase italic leading-none text-black">
                                Finalize <span className="text-[#526E48]">Reservation</span>
                            </h1>
                        </header>

                        {/* Step indicator */}
                        <div className="flex items-center gap-0 mb-10">
                            {STEPS.map((label, i) => (
                                <div key={label} className="flex items-center flex-1 last:flex-none">
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black border transition-all duration-300 ${i < currentStep
                                            ? "bg-[#526E48] border-[#526E48] text-white"
                                            : i === currentStep
                                                ? "border-[#526E48] text-[#526E48] bg-transparent"
                                                : "border-black/5 text-zinc-300 bg-transparent"
                                            }`}>
                                            {i < currentStep ? (
                                                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                                            ) : i + 1}
                                        </div>
                                        <span className={`text-[7px] font-black uppercase tracking-widest whitespace-nowrap ${i <= currentStep ? "text-zinc-500" : "text-zinc-300"}`}>{label}</span>
                                    </div>
                                    {i < STEPS.length - 1 && (
                                        <div className={`flex-1 h-[1px] mx-2 mb-4 transition-all duration-500 ${i < currentStep ? "bg-[#526E48]/30" : "bg-black/[0.05]"}`} />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* ── Personal Details ── */}
                        <div className="space-y-5">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#526E48] flex items-center gap-3 italic">
                                /// Personal_Registry
                            </p>

                            <div className="grid grid-cols-2 gap-6">
                                <Field label="Full Name" error={errors.fullName} required>
                                    <input
                                        data-error={!!errors.fullName || undefined}
                                        className={`w-full h-12 bg-zinc-50 border rounded-xl px-4 text-xs font-bold outline-none transition-all placeholder:text-zinc-300 ${errors.fullName ? "border-red-500/30 focus:border-red-500 bg-red-50/30" : "border-black/[0.03] focus:border-[#526E48]/30"}`}
                                        placeholder="Enter your full name"
                                        value={formData.fullName}
                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                </Field>
                                <Field label="Nominee Name" error={errors.nomineeName} required>
                                    <input
                                        data-error={!!errors.nomineeName || undefined}
                                        className={`w-full h-12 bg-zinc-50 border rounded-xl px-4 text-xs font-bold outline-none transition-all placeholder:text-zinc-300 ${errors.nomineeName ? "border-red-500/30 focus:border-red-500 bg-red-50/30" : "border-black/[0.03] focus:border-[#526E48]/30"}`}
                                        placeholder="Emergency contact name"
                                        value={formData.nomineeName}
                                        onChange={e => setFormData({ ...formData, nomineeName: e.target.value })}
                                    />
                                </Field>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <Field label="Primary Mobile" error={errors.primaryPhone} required>
                                    <input
                                        data-error={!!errors.primaryPhone || undefined}
                                        className={`w-full h-12 bg-zinc-50 border rounded-xl px-4 text-xs font-bold outline-none transition-all placeholder:text-zinc-300 ${errors.primaryPhone ? "border-red-500/30 focus:border-red-500 bg-red-50/30" : "border-black/[0.03] focus:border-[#526E48]/30"}`}
                                        placeholder="10-digit mobile"
                                        maxLength={10}
                                        value={formData.primaryPhone}
                                        onChange={e => setFormData({ ...formData, primaryPhone: e.target.value.replace(/\D/g, "") })}
                                    />
                                </Field>
                                <Field label="Secondary Mobile" error={errors.secondaryPhone}>
                                    <input
                                        data-error={!!errors.secondaryPhone || undefined}
                                        className={`w-full h-12 bg-zinc-50 border rounded-xl px-4 text-xs font-bold outline-none transition-all placeholder:text-zinc-300 ${errors.secondaryPhone ? "border-red-500/30 focus:border-red-500 bg-red-50/30" : "border-black/[0.03] focus:border-[#526E48]/30"}`}
                                        placeholder="Emergency number (optional)"
                                        maxLength={10}
                                        value={formData.secondaryPhone}
                                        onChange={e => setFormData({ ...formData, secondaryPhone: e.target.value.replace(/\D/g, "") })}
                                    />
                                </Field>
                            </div>

                            <Field label="Residential Address" error={errors.address} required>
                                <textarea
                                    data-error={!!errors.address || undefined}
                                    rows={3}
                                    className={`w-full bg-zinc-50 border rounded-xl p-4 text-xs font-bold outline-none transition-all placeholder:text-zinc-300 resize-none ${errors.address ? "border-red-500/30 focus:border-red-500 bg-red-50/30" : "border-black/[0.03] focus:border-[#526E48]/30"}`}
                                    placeholder="House / Flat No., Street, City, State, PIN"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </Field>
                        </div>

                        {/* ── ID Proof Upload ── */}
                        <div className="space-y-5">
                            <div className="flex justify-between items-end">
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#526E48] flex items-center gap-3 italic">
                                    /// Verification_Assets
                                    <span className="text-red-500/70">*</span>
                                </p>
                                <p className="text-[7px] font-black uppercase text-zinc-300 tracking-[0.2em]">Max 5 MB · JPG / PNG / PDF</p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {(["Front", "Back"] as const).map(side => {
                                    const err = errors[`id${side}`];
                                    const file = idFiles[side];
                                    const previewUrl = previews[side];
                                    const isPdf = file?.type === "application/pdf";
                                    return (
                                        <div key={side} className="space-y-2">
                                            <label
                                                data-error={!!err || undefined}
                                                className={`relative overflow-hidden rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all duration-500 shadow-sm ${file ? "h-52 border-2 border-[#526E48]/20 bg-white" : "h-40 border border-dashed border-black/[0.05] bg-zinc-50 hover:bg-white"
                                                    } ${err
                                                        ? "border-red-500/20 bg-red-50/[0.02]"
                                                        : "hover:border-[#526E48]/30"
                                                    }`}
                                            >
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp,application/pdf"
                                                    className="hidden"
                                                    onChange={e => {
                                                        const f = e.target.files?.[0] ?? null;
                                                        setIdFiles(prev => ({ ...prev, [side]: f }));
                                                    }}
                                                />

                                                {/* ── Image preview ── */}
                                                {previewUrl && !isPdf && (
                                                    <>
                                                        <Image
                                                            src={previewUrl}
                                                            alt={`${side} ID`}
                                                            fill
                                                            className="object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                                                        />
                                                        <div className="absolute inset-0 bg-black/5 hover:bg-black/20 transition-all z-10" />
                                                        {/* Badge */}
                                                        <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between px-3 py-2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-black/[0.01]">
                                                            <p className="text-[8px] font-black text-black uppercase tracking-tight truncate">{file!.name}</p>
                                                            <svg width="12" height="12" fill="none" stroke="#526E48" strokeWidth="3" viewBox="0 0 24 24" className="shrink-0"><path d="M5 13l4 4L19 7" /></svg>
                                                        </div>
                                                    </>
                                                )}

                                                {/* ── PDF preview ── */}
                                                {isPdf && file && (
                                                    <div className="flex flex-col items-center justify-center gap-3 px-6 w-full text-center">
                                                        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center shadow-sm border border-red-100">
                                                            <svg width="24" height="24" fill="none" stroke="#f87171" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-black uppercase tracking-tight truncate w-40">{file.name}</p>
                                                            <p className="text-[8px] text-zinc-300 font-bold uppercase tracking-widest mt-1">Ready for transport</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* ── Empty state ── */}
                                                {!file && (
                                                    <>
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${err ? "bg-red-50" : "bg-white shadow-sm border border-black/[0.03]"}`}>
                                                            <svg width="20" height="20" fill="none" stroke={err ? "#f87171" : "#526E48"} strokeWidth="2" viewBox="0 0 24 24">
                                                                <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                            </svg>
                                                        </div>
                                                        <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${err ? "text-red-500" : "text-black"}`}>
                                                            {side} Side
                                                        </p>
                                                        <p className="text-[7px] text-zinc-300 font-bold uppercase tracking-widest mt-1">Secure Load</p>
                                                    </>
                                                )}
                                            </label>
                                            <AnimatePresence>
                                                {err && (
                                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 text-[9px] font-black text-red-500 ml-2 uppercase italic tracking-tighter">✕ {err}</motion.p>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── Submit ── */}
                        <div className="space-y-4 pt-4 border-t border-black/[0.03]">
                            <AnimatePresence>
                                {submitted && !isValid && (
                                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-4 px-6 py-4 bg-red-50 rounded-2xl border border-red-100">
                                        <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shrink-0 font-black italic">!</div>
                                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest italic">Authorization denied: Complete all required registries.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                onClick={handleConfirm}
                                disabled={isSubmitting}
                                className={`relative w-full py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all active:scale-[0.98] shadow-2xl ${isValid
                                    ? "bg-black text-white hover:bg-[#526E48]"
                                    : "bg-zinc-50 border border-black/[0.03] text-zinc-300 cursor-not-allowed"
                                    } ${isSubmitting ? "opacity-70" : ""}`}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-4">
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        Transmitting_Uplink...
                                    </span>
                                ) : (
                                    isValid ? "Authorize Reservation →" : "Dossier Incomplete"
                                )}
                            </button>

                            <p className="text-center text-[8px] text-zinc-300 font-black uppercase tracking-[0.4em] pt-4 italic">
                                /// Secure_Node_Protocol_Active
                            </p>
                        </div>
                    </div>

                    {/* ── Right: Car Summary ── */}
                    <div className="lg:col-span-5">
                        <div className="bg-white border border-black/[0.03] rounded-[3rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.06)] sticky top-28">
                            <div className="relative h-64 lg:h-72 bg-zinc-50 border-b border-black/[0.03]">
                                <Image src={getImageUrl(car.image)} alt={car.name} fill className="object-cover group-hover:scale-110 transition-transform duration-[3000ms]" unoptimized />
                                <div className="absolute top-6 right-6">
                                    <span className="bg-[#526E48] text-white text-[8px] font-black uppercase px-3 py-1.5 rounded-xl tracking-widest italic shadow-xl">{car.category}</span>
                                </div>
                            </div>

                            <div className="p-10 space-y-10">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h2 className="text-2xl font-black italic tracking-tighter text-black uppercase">{car.name}</h2>
                                        <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mt-1 italic">{car.model} /// {car.year}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1 italic">Diurnal_Rate</p>
                                        <p className="text-xl font-black italic text-[#526E48]">₹{car.pricePerDay.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-10 py-8 border-y border-black/[0.03]">
                                    <div className="space-y-1.5">
                                        <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest italic">Deployment</p>
                                        <p className="text-[11px] font-black text-black uppercase tracking-tighter italic">{startDate ? new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "Pending"}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest italic">Retraction</p>
                                        <p className="text-[11px] font-black text-black uppercase tracking-tighter italic">{endDate ? new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "Pending"}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400 italic">
                                        <span>Duration_Factor ({days} Cycles)</span>
                                        <span className="text-black">₹{baseTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="h-px bg-black/[0.03]" />
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-[11px] font-black uppercase tracking-widest text-[#526E48] italic">Toll_Requirement</span>
                                        <span className="text-3xl font-black italic text-black tracking-tighter">₹{baseTotal.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Validation checklist */}
                                <div className="space-y-3 pt-6 border-t border-black/[0.03]">
                                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-200 mb-4 italic">Submission_Checklist</p>
                                    {[
                                        { label: "Principal registry", done: personalDone },
                                        { label: "V-ID Front loaded", done: !!idFiles.Front && !errors.idFront },
                                        { label: "V-ID Back loaded", done: !!idFiles.Back && !errors.idBack },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all shadow-sm ${item.done ? "bg-[#526E48]" : "bg-zinc-50 border border-black/[0.03]"}`}>
                                                {item.done && <svg width="10" height="10" fill="none" stroke="white" strokeWidth="4" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${item.done ? "text-black" : "text-zinc-200"}`}>{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
