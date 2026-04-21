"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function Login() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <LoginContent />
        </Suspense>
    );
}

function LoginContent() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [forgotMessage, setForgotMessage] = useState("");
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get("redirect");
    const sessionExpired = searchParams.get("session") === "expired";

    useEffect(() => {
        if (sessionExpired) {
            setError("Your session has expired. Please login again.");
        }
    }, [sessionExpired]);

    const handleGoogleLogin = () => {
        // Redirect to backend Google auth endpoint with redirect URL
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://rental-garage.duckdns.org/api";
        const callbackUrl = redirect ? `?redirect=${encodeURIComponent(redirect)}` : "";
        window.location.href = `${API_BASE}/auth/google${callbackUrl}`;
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://rental-garage.duckdns.org/api";
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            
            // Check for non-JSON responses before parsing
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error(`Satellite link failed: Expected JSON but received ${contentType || "HTML"}. Verify the backend is operational.`);
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Uplink denied: Credential verification failed.");

            // 🔐 Save tokens and user data
            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);
            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("role", data.user.role);

            // 🏎️ Redirect to previous page or based on role
            if (redirect) {
                router.push(redirect);
            } else if (data.user.role === "admin") {
                router.push("/dashboard/admin");
            } else if (data.user.role === "customer") {
                router.push("/dashboard/customer");
            } else {
                router.push("/");
            }


        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setForgotMessage("");
        try {
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://rental-garage.duckdns.org/api";
            const res = await fetch(`${API_BASE}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error(`Protocol mismatch: Expected JSON but received ${contentType || "HTML/Text"}. Protocol update required.`);
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Uplink denied: Protocol transmission failed.");
            setForgotMessage(data.message || "Password reset link sent to your email.");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex overflow-hidden bg-white font-sans text-black selection:bg-[#526E48]/30">
            {/* ── Back to Home Arrow ── */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="absolute top-8 right-8 z-50"
            >
                <Link
                    href="/"
                    className="group flex items-center justify-center bg-black/5 hover:bg-[#526E48] border border-black/5 hover:border-[#526E48] w-12 h-12 rounded-full transition-all duration-300 backdrop-blur-md"
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

            {/* ── Full-screen background car image ── */}
            <motion.div
                initial={{ scale: 1.08, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.6, ease: "easeOut" }}
                className="absolute inset-0 z-0"
            >
                <Image
                    src="/teal_supercar.jpg"
                    alt="Teal Supercar"
                    fill
                    className="object-cover object-center grayscale opacity-10"
                    priority
                />
                {/* Clinical gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/60" />
                <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-white/40" />
            </motion.div>

            {/* ── Animated accent glow (Olive subtle) ── */}
            <motion.div
                initial={{ opacity: 0, x: -60 }}
                animate={{ opacity: 0.05, x: 0 }}
                transition={{ delay: 1, duration: 1.5 }}
                className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-[#526E48] rounded-full blur-[140px] pointer-events-none z-0"
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
            <div className="relative z-10 hidden lg:flex flex-col justify-start w-1/2 px-14 pt-24 pb-14">

                {/* Hero text */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 1 }}
                    className="mt-16"
                >
                    <p className="text-[#526E48] text-[10px] font-black uppercase tracking-[0.4em] mb-4 italic">{"/// Protocol_Gateway"}</p>
                    <h1 className="text-6xl font-black uppercase italic leading-[0.9] text-black mb-6 tracking-tighter">
                        Drive the<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#526E48] to-black">Extraordinary.</span>
                    </h1>
                    <p className="text-black text-[10px] uppercase font-black leading-relaxed max-w-sm italic tracking-widest">
                        Access the world&apos;s most exclusive automotive collection. Every journey, a clinical statement of authority.
                    </p>
                </motion.div>

                {/* Bottom badge */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="flex items-center gap-3"
                >
                    <div className="h-px w-10 bg-black/10" />
                    <p className="text-black/50 text-[9px] uppercase tracking-[0.5em] font-black italic">Registry Established // 2024</p>
                </motion.div>
            </div>

            {/* ── RIGHT: Login form panel ── */}
            <div className="relative z-10 flex items-start justify-center w-full lg:w-1/2 px-6 pt-24 pb-12 overflow-y-auto scrollbar-hide">
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
                        className="mb-8 text-left"
                    >
                        <h2 className="text-4xl font-black text-black italic uppercase leading-[1.1] tracking-tighter mb-4">
                            {isForgotPassword ? "Reset Password." : "Welcome Back."}
                        </h2>
                        <p className="text-black text-[10px] uppercase font-black italic tracking-widest max-w-sm">
                            {isForgotPassword ? "Enter your credentials to receive a reset sequence." : "Sign in to access your elite fleet assets."}
                        </p>
                    </motion.div>

                    {/* Error & Success Messages */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-red-50 text-red-500 text-[10px] uppercase font-black italic rounded-2xl px-6 py-5 mb-8 border border-red-100 shadow-sm tracking-widest leading-loose"
                            >
                                [Error]: {error}
                            </motion.div>
                        )}
                        {forgotMessage && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-[#526E48]/5 text-[#526E48] text-[10px] uppercase font-black italic rounded-2xl px-6 py-5 mb-8 border border-[#526E48]/10 shadow-sm tracking-widest leading-loose"
                            >
                                [Success]: {forgotMessage}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={isForgotPassword ? handleForgotPassword : handleLogin} className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="space-y-3"
                        >
                            <label className="block text-[8px] uppercase font-black tracking-[0.4em] text-black ml-1 italic">Email</label>
                            <input
                                suppressHydrationWarning
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-zinc-50 border border-black/[0.03] hover:border-[#526E48]/30 focus:border-[#526E48] text-black rounded-2xl px-6 py-4 focus:outline-none transition-all placeholder:text-black/40 text-xs font-black italic tracking-widest shadow-inner"
                                placeholder="Enter the Email"
                            />
                        </motion.div>

                        <AnimatePresence>
                            {!isForgotPassword && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, overflow: "hidden" }}
                                    animate={{ opacity: 1, height: "auto", overflow: "visible" }}
                                    exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="space-y-3 mt-6">
                                        <div className="flex justify-between items-center ml-1 pr-1">
                                            <label className="block text-[8px] uppercase font-black tracking-[0.4em] text-black italic">Password</label>
                                            <button
                                                suppressHydrationWarning
                                                type="button"
                                                onClick={() => { setIsForgotPassword(true); setError(""); setForgotMessage(""); }}
                                                className="text-[8px] text-black/40 hover:text-[#526E48] transition-colors font-black uppercase tracking-[0.3em] italic"
                                            >
                                                LOST_CREDENTIALS?
                                            </button>
                                        </div>
                                        <input
                                            suppressHydrationWarning
                                            type="password"
                                            required={!isForgotPassword}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-zinc-50 border border-black/[0.03] hover:border-[#526E48]/30 focus:border-[#526E48] text-black rounded-2xl px-6 py-4 focus:outline-none transition-all placeholder:text-black/40 text-xs font-black italic tracking-widest shadow-inner"
                                            placeholder="••••••••••••"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.0 }}
                        >
                            <motion.button
                                whileHover={{ scale: 1.01, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                suppressHydrationWarning
                                className="w-full mt-4 bg-black text-white hover:bg-[#526E48] font-black rounded-2xl px-6 py-5 text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all disabled:opacity-50 cursor-pointer shadow-2xl"
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>{isForgotPassword ? "Sequence_Reset" : "Login"}</span>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    </form>

                    {isForgotPassword && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8 text-center"
                        >
                            <button
                                suppressHydrationWarning
                                onClick={() => { setIsForgotPassword(false); setForgotMessage(""); setError(""); }}
                                className="text-black/40 text-[9px] font-black uppercase tracking-widest hover:text-black transition-colors italic"
                            >
                                ← Return_To_Standard_Login
                            </button>
                        </motion.div>
                    )}

                    {/* Divider */}
                    <div className="flex items-center gap-6 my-10">
                        <div className="flex-1 h-px bg-black/5" />
                        <span className="text-black/30 text-[8px] font-black uppercase tracking-[0.5em] italic">Or</span>
                        <div className="flex-1 h-px bg-black/5" />
                    </div>

                    {/* Google Login Button */}
                    <motion.button
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.05 }}
                        type="button"
                        onClick={handleGoogleLogin}
                        suppressHydrationWarning
                        className="w-full mb-8 bg-zinc-50 border border-black/[0.03] hover:border-[#526E48]/30 hover:bg-white text-black/50 hover:text-black font-black rounded-2xl px-6 py-4 text-[9px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all italic shadow-sm"
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
                        transition={{ delay: 1.1 }}
                        className="text-center text-black/50 text-[10px] font-black uppercase tracking-widest italic"
                    >
                        Create Account?{" "}
                        <Link href={redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : "/register"} className="text-[#526E48] hover:text-black font-black transition-colors border-b border-[#526E48]/20 hover:border-[#526E48]">
                            Register →
                        </Link>
                    </motion.p>

                    {/* 👮 Admin Testing Access */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        whileHover={{ opacity: 1 }}
                        className="mt-14 pt-10 border-t border-black/[0.03] flex flex-col items-center gap-5 text-center"
                    >
                        <p className="text-[8px] font-black uppercase tracking-[0.5em] text-zinc-300 italic">Security Terminal Hub</p>
                        <Link
                            href="/dashboard/admin"
                            className="inline-flex items-center gap-3 px-8 py-3 rounded-full bg-zinc-50 border border-black/[0.03] hover:border-[#526E48] hover:bg-white transition-all text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 hover:text-[#526E48] italic"
                        >
                            <span>🔑</span>
                            Admin_Command_Center
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
