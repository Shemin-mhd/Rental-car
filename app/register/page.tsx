"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.6 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

export default function Register() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <RegisterContent />
        </Suspense>
    );
}

function RegisterContent() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get("redirect");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (!role) {
            setError("Please select an account type");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://rental-car-backend-7np6.onrender.com/api";
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, role }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Uplink denied: Protocol registration failed.");
            // If there's a redirect, carry it over to login
            const loginUrl = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login";
            router.push(loginUrl);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex overflow-hidden bg-white font-sans text-black selection:bg-[#526E48]/30">
            {/* ── Back to Login Arrow ── */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="absolute top-8 right-8 z-50"
            >
                <Link
                    href="/login"
                    className="group flex items-center justify-center bg-black/5 hover:bg-[#526E48] border border-black/5 hover:border-[#526E48] w-12 h-12 rounded-full transition-all duration-300 backdrop-blur-md cursor-pointer"
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-[#526E48] group-hover:text-white transition-colors"
                    >
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </Link>
            </motion.div>

            {/* ── Full-screen background background ── */}
            <motion.div
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="absolute inset-0 z-0"
            >
                <Image
                    src="/lamborghini_night.jpg"
                    alt="Lamborghini Night"
                    fill
                    className="object-cover object-center grayscale opacity-10"
                    priority
                />
                {/* Dark overlay gradients */}
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/60" />
                <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-white/50" />
            </motion.div>

            {/* ── Elite Olive glow ── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.05 }}
                transition={{ delay: 1.5, duration: 2 }}
                className="absolute bottom-[5%] right-[20%] w-[600px] h-[400px] bg-[#526E48] rounded-full blur-[160px] pointer-events-none z-0"
            />

            {/* ── Top Logo Branding ── */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="absolute top-8 left-6 lg:top-10 lg:left-14 z-50 flex items-center gap-3"
            >
                <div className="bg-[#526E48] px-2 py-1 rounded-lg text-white font-black italic text-sm -skew-x-6">RG</div>
                <span className="text-black font-black text-xl italic tracking-tight uppercase">Rental_<span className="text-[#526E48]">Garage</span></span>
            </motion.div>

            {/* ── LEFT: Branding panel ── */}
            <div className="relative z-10 hidden lg:flex flex-col justify-start w-1/2 xl:w-[55%] px-14 pt-16 pb-14">

                {/* Hero text */}
                <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="mt-16"
                >
                    <p className="text-[#526E48] text-[10px] font-black uppercase tracking-[0.4em] mb-5 italic">{"/// Acquire_Registry"}</p>
                    <h1 className="text-6xl xl:text-7xl font-black uppercase italic leading-[0.88] text-black mb-6 tracking-tighter shadow-sm">
                        Go<br />
                        Beyond<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#526E48] to-black">Limits.</span>
                    </h1>
                    <p className="text-black text-[10px] uppercase font-black italic tracking-widest leading-relaxed max-w-xs">
                        Join the Rental_Garage fleet. Exclusive vehicles, clinical registration, and unmatched performance — awaiting your authorization.
                    </p>
                </motion.div>

                {/* Bottom stats */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.3, duration: 0.8 }}
                    className="flex items-center gap-10"
                >
                    {[["50+", "Assets"], ["24/7", "Protocol"], ["100%", "Elite"]].map(([val, label]) => (
                        <div key={label}>
                            <p className="text-black font-black text-xl italic tracking-tighter">{val}</p>
                            <p className="text-black/40 text-[8px] uppercase tracking-[0.3em] font-black italic">{label}</p>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* ── RIGHT: Register form ── */}
            <div className="relative z-10 flex items-start justify-center w-full lg:w-1/2 xl:w-[45%] px-6 pt-16 pb-12 overflow-y-auto scrollbar-hide">
                <motion.div
                    initial={{ opacity: 0, x: 60 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.9, ease: "easeOut" }}
                    className="w-full max-w-[420px]"
                >

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="mb-6 text-left"
                    >
                        <h2 className="text-4xl font-black text-black italic uppercase leading-[1.1] tracking-tighter mb-4">
                            Get Started with Your Account
                        </h2>
                        <p className="text-black text-[10px] uppercase font-black italic tracking-widest max-w-sm">Input your identification sequence to join the fleet.</p>
                    </motion.div>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-red-50 text-red-500 text-[10px] uppercase font-black italic rounded-2xl px-6 py-5 mb-8 border border-red-100 shadow-sm tracking-widest"
                            >
                                [Error]: {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.form
                        onSubmit={handleRegister}
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="space-y-4"
                    >
                        {/* Full Name */}
                        <motion.div variants={itemVariants} className="space-y-2">
                            <label className="block text-[8px] uppercase font-black tracking-[0.4em] text-black ml-1 italic">Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-zinc-50 border border-black/[0.03] hover:border-[#526E48]/30 focus:border-[#526E48] text-black rounded-2xl px-6 py-4 focus:outline-none transition-all placeholder:text-black/40 text-xs font-black italic tracking-widest shadow-inner"
                                placeholder="Enter the name"
                            />
                        </motion.div>

                        {/* Email */}
                        <motion.div variants={itemVariants} className="space-y-2">
                            <label className="block text-[8px] uppercase font-black tracking-[0.4em] text-black ml-1 italic">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-zinc-50 border border-black/[0.03] hover:border-[#526E48]/30 focus:border-[#526E48] text-black rounded-2xl px-6 py-4 focus:outline-none transition-all placeholder:text-black/40 text-xs font-black italic tracking-widest shadow-inner"
                                placeholder="Enter the Email"
                            />
                        </motion.div>

                        {/* Password */}
                        <motion.div variants={itemVariants} className="space-y-2 relative">
                            <label className="block text-[8px] uppercase font-black tracking-[0.4em] text-black ml-1 italic">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-zinc-50 border border-black/[0.03] hover:border-[#526E48]/30 focus:border-[#526E48] text-black rounded-2xl px-6 py-4 focus:outline-none transition-all placeholder:text-black/40 text-xs font-black italic tracking-widest shadow-inner"
                                placeholder="••••••••••••"
                            />
                        </motion.div>

                        {/* Confirm Password */}
                        <motion.div variants={itemVariants} className="space-y-2">
                            <label className="block text-[8px] uppercase font-black tracking-[0.4em] text-black ml-1 italic">Confirm_Password</label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-zinc-50 border border-black/[0.03] hover:border-[#526E48]/30 focus:border-[#526E48] text-black rounded-2xl px-6 py-4 focus:outline-none transition-all placeholder:text-black/40 text-xs font-black italic tracking-widest shadow-inner"
                                placeholder="••••••••••••"
                            />
                        </motion.div>

                        {/* Role Selection */}
                        <motion.div variants={itemVariants} className="space-y-2">
                            <label className="block text-[8px] uppercase font-black tracking-[0.4em] text-black ml-1 italic">Vocation_Protocol</label>
                            <select
                                required
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full bg-zinc-50 border border-black/[0.03] hover:border-[#526E48]/30 focus:border-[#526E48] text-black rounded-2xl px-6 py-4 focus:outline-none transition-all text-[10px] font-black uppercase italic tracking-widest shadow-inner appearance-none cursor-pointer"
                            >
                                <option value="" disabled>SELECT Account</option>
                                <option value="user" className="text-black">search for car (rent)</option>
                                <option value="customer" className="text-black">list your car (listing)</option>
                            </select>
                        </motion.div>

                        {/* Submit Button */}
                        <motion.div variants={itemVariants}>
                            <motion.button
                                whileHover={{ scale: 1.01, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="w-full mt-6 bg-black text-white hover:bg-[#526E48] font-black rounded-2xl px-6 py-5 text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all disabled:opacity-50 cursor-pointer shadow-2xl shadow-black/10"
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>Register</span>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    </motion.form>

                    {/* Divider */}
                    <div className="flex items-center gap-6 my-10">
                        <div className="flex-1 h-px bg-black/[0.03]" />
                        <span className="text-black/30 text-[8px] font-black uppercase tracking-[0.5em] italic">Or</span>
                        <div className="flex-1 h-px bg-black/[0.03]" />
                    </div>

                    {/* Google Login Button */}
                    <motion.button
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.05 }}
                        type="button"
                        onClick={() => {
                            if (!role) {
                                setError("Vocation protocol required for Google synchronization.");
                                return;
                            }
                            const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://rental-car-backend-7np6.onrender.com/api";
                            const callbackUrl = redirect ? `&redirect=${encodeURIComponent(redirect)}` : "";
                            window.location.href = `${API_BASE}/auth/google?role=${role}${callbackUrl}`;
                        }}
                        className="w-full mb-8 bg-zinc-50 border border-black/[0.03] hover:border-[#526E48]/30 hover:bg-white text-zinc-500 hover:text-black font-black rounded-2xl px-6 py-4 text-[9px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all italic shadow-sm"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google Authentication
                    </motion.button>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="text-center text-black/50 text-[10px] font-black uppercase tracking-widest italic"
                    >
                        {/* Registered_Agent?{" "}
                        <Link href={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login"} className="text-[#526E48] hover:text-black font-black transition-colors border-b border-[#526E48]/20 hover:border-[#526E48]">
                            Establish_Uplink →
                        </Link> */}
                    </motion.p>
                </motion.div>
            </div>
        </div>
    );
}
