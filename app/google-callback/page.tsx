"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function GoogleCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const accessToken = searchParams.get("accessToken");
        const refreshToken = searchParams.get("refreshToken");
        const userData = searchParams.get("user");

        if (accessToken && refreshToken && userData) {
            try {
                const user = JSON.parse(decodeURIComponent(userData));
                
                // 🔐 Save to localStorage
                localStorage.setItem("accessToken", accessToken);
                localStorage.setItem("refreshToken", refreshToken);
                localStorage.setItem("user", JSON.stringify(user));
                localStorage.setItem("role", user.role);

                // 🏎️ Redirect to target page or based on role
                const redirect = searchParams.get("redirect");
                if (redirect) {
                    router.push(redirect);
                } else if (user.role === "admin") {
                    router.push("/dashboard/admin");
                } else {
                    router.push("/");
                }


            } catch (err) {
                console.error("Error parsing user data:", err);
                router.push("/login?error=Invalid session");
            }
        } else {
            // Check if there's an error in URL
            const error = searchParams.get("error");
            router.push(`/login?error=${error || "Google authentication failed"}`);
        }
    }, [router, searchParams]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(197,160,89,0.3)]" />
                <p className="text-[#C5A059] font-black uppercase tracking-widest text-sm italic">
                    Finalizing Drive...
                </p>
            </div>
        </div>
    );
}

export default function GoogleCallback() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(197,160,89,0.3)]" />
            </div>
        }>
            <GoogleCallbackContent />
        </Suspense>
    );
}
