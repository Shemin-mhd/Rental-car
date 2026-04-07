"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem("accessToken");
      const userStr = localStorage.getItem("user");
      setIsLoggedIn(!!token);

      if (userStr) {
        const userObj = JSON.parse(userStr);
        setUsername(userObj.name || userObj.username || userObj.email || "User");
      } else if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUsername(payload.name || payload.username || payload.email || "User");
      }
    } catch { }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.replace("/login");
  };
  return (
    <div className="bg-[#0A0A0B] min-h-screen text-white font-sans selection:bg-[#C5A059] selection:text-white scroll-smooth">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-8 py-4 backdrop-blur-md bg-black/30 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="bg-[#C5A059] px-1.5 py-0.5 rounded text-[9px] text-black font-black italic -skew-x-12 shadow-[0_0_12px_rgba(197,160,89,0.5)]">RG</div>
          <span className="text-sm font-black tracking-tighter uppercase italic">Rental_<span className="text-[#C5A059]">Garage</span></span>
        </div>
        <div className="flex gap-5 items-center">
          {!isLoggedIn ? (
            <>
              <Link href="/login" className="text-[10px] uppercase font-bold opacity-50 hover:opacity-100 transition-opacity tracking-[0.15em]">Login</Link>
              <Link href="/register" className="bg-[#C5A059] text-black px-5 py-2 rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all text-[10px] tracking-[0.15em] uppercase shadow-[0_0_16px_rgba(197,160,89,0.35)]">Register</Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[7px] font-bold text-zinc-500 tracking-[0.2em] leading-none mb-1">Signed In</span>
                <span className="text-[10px] uppercase font-black tracking-widest text-[#C5A059] leading-none truncate max-w-[120px]">{username || "User"}</span>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="relative">
                <button
                  onClick={() => setShowLogout(!showLogout)}
                  className="group flex items-center justify-center w-8 h-8 rounded-full border border-red-500/20 bg-red-500/5 hover:bg-red-500 hover:border-red-500 transition-all active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                  title="Logout"
                >
                  <svg className="w-3.5 h-3.5 text-red-500 group-hover:text-white transition-colors ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
                {showLogout && (
                  <div className="absolute right-0 top-full mt-2 z-50">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#0A0A0B] border border-red-500/40 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] text-red-500 hover:bg-red-500 hover:text-white transition-all whitespace-nowrap shadow-2xl"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Grid overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(197,160,89,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(197,160,89,0.04) 1px, transparent 1px)`,
            backgroundSize: "80px 80px"
          }}
        />

        {/* Video BG */}
        <div className="absolute inset-0 z-0 bg-black overflow-hidden">
          <motion.div
            initial={{ scale: 1.05 }}
            animate={{ scale: 1.12, x: [0, -10, 0, 10, 0] }}
            transition={{ duration: 50, repeat: Infinity, repeatType: "mirror", ease: "linear" }}
            className="absolute inset-0"
          >
            <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-35">
              <source src="/hero_vid.mp4" type="video/mp4" />
            </video>
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0B]/70 via-transparent to-[#0A0A0B]" />
        </div>

        {/* Gold radial glow */}
        <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
          <div className="w-[600px] h-[600px] rounded-full bg-[#C5A059]/5 blur-[120px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-[950px] px-6 mt-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-[42px] md:text-[62px] lg:text-[76px] font-black uppercase italic leading-[0.95] tracking-[-0.05em] mb-7"
          >
            Experience <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C5A059] via-[#F3D18B] to-[#C5A059]">
              Premium Travel
            </span>
            <br />

          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-zinc-400 text-sm leading-relaxed max-w-lg mx-auto mb-10"
          >
            Guaranteed luxury and performance vehicles across Kochi, Kozhikode & Malappuram. Self-drive or with a private driver.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="flex items-center justify-center gap-4"
          >
            <Link
              href="/cars"
              className="group relative px-8 py-3 bg-[#C5A059] text-black font-bold text-[11px] uppercase tracking-[0.2em] rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_8px_30px_rgba(197,160,89,0.4)] inline-flex items-center gap-3"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span>Explore Fleet</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <Link href="/login" className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400 hover:text-white transition-colors border border-white/10 px-8 py-3 rounded-full hover:border-white/20">
              Sign In
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-16 flex items-center justify-center gap-10 border-t border-white/5 pt-10"
          >
            {[["500+", "Vehicles"], ["10", "Cities"], ["4.9★", "Rating"]].map(([num, label]) => (
              <div key={label} className="text-center">
                <p className="text-xl font-black text-[#C5A059] tracking-tight">{num}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.15em] font-bold mt-0.5">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURED COLLECTION ── */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[10px] text-[#C5A059] uppercase tracking-[0.25em] font-bold mb-2">Hand-Picked</p>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="text-2xl md:text-3xl font-black uppercase italic"
            >
              Featured Collection
            </motion.h2>
          </div>
          <Link href="/cars" className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.2em] flex items-center gap-1.5 group opacity-70 hover:opacity-100 transition-opacity">
            View All <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: "Mercedes G-Wagon", price: 85000, type: "Luxury", year: 2024, hp: 577, gear: "Auto", passengers: 5, img: "https://images.unsplash.com/photo-1520031441872-265e4ff70366", location: "Kochi" },
            { name: "Vintage Rolls Royce", price: 55000, type: "Vintage", year: 1965, hp: 200, gear: "Manual", passengers: 4, img: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d", location: "Kozhikode" },
            { name: "Defender 110", price: 35000, type: "SUV", year: 2024, hp: 296, gear: "Auto", passengers: 7, img: "https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9", location: "Kochi" },
          ].map((car, i) => (
            <motion.div
              key={car.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="group bg-white/[0.04] border border-white/8 rounded-3xl overflow-hidden hover:border-[#C5A059]/30 hover:bg-white/[0.07] transition-all duration-500 hover:shadow-[0_20px_50px_rgba(197,160,89,0.08)]"
            >
              <div className="relative h-52 w-full overflow-hidden">
                <Image src={car.img} alt={car.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-widest bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30 px-2.5 py-1 rounded-full">{car.type}</span>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase">{car.year}</span>
                </div>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-sm font-black uppercase italic leading-none mb-1">{car.name}</h3>
                    <p className="text-zinc-500 text-[9px] uppercase font-bold tracking-[0.15em]">{car.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-[#C5A059] tracking-tight">₹{car.price.toLocaleString()}</p>
                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">/day</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-5">
                  {[["HP", car.hp], ["Gear", car.gear], ["Seats", car.passengers]].map(([label, val]) => (
                    <div key={label as string} className="text-center bg-white/5 py-2 rounded-xl border border-white/5">
                      <p className="text-[8px] font-bold text-zinc-600 uppercase mb-0.5">{label}</p>
                      <p className="text-xs font-black uppercase">{val}</p>
                    </div>
                  ))}
                </div>

                <button className="w-full bg-transparent hover:bg-[#C5A059] text-white hover:text-black transition-all py-3 rounded-xl font-bold text-[10px] uppercase tracking-[0.15em] border border-white/10 hover:border-[#C5A059] cursor-pointer">
                  View Details
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#C5A059]/5 blur-[80px] rounded-full" />
        </div>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[10px] text-[#C5A059] uppercase tracking-[0.25em] font-bold mb-2">Simple Process</p>
            <h2 className="text-2xl md:text-3xl font-black uppercase italic">How it Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-10 left-[17%] right-[17%] h-px bg-gradient-to-r from-transparent via-[#C5A059]/30 to-transparent" />

            {[
              { title: "Choose Car", desc: "Browse our curated luxury fleet and pick the perfect vehicle for your journey.", icon: "🚗", step: "01" },
              { title: "Book Instantly", desc: "Fast online booking with instant confirmation. Self-drive or with a private driver.", icon: "📅", step: "02" },
              { title: "Hit the Road", desc: "Collect your car or have it delivered to you. Enjoy a premium driving experience.", icon: "🏁", step: "03" },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="relative flex flex-col items-center text-center p-8 bg-white/[0.03] border border-white/8 rounded-3xl hover:border-[#C5A059]/20 transition-all"
              >
                <div className="absolute -top-3 left-6 text-[10px] font-black text-[#C5A059]/50 tracking-widest">{step.step}</div>
                <div className="w-14 h-14 bg-[#C5A059]/10 rounded-2xl flex items-center justify-center text-2xl mb-5 border border-[#C5A059]/20">
                  {step.icon}
                </div>
                <h4 className="text-sm font-black uppercase mb-3 tracking-tight italic">{step.title}</h4>
                <p className="text-zinc-500 text-xs leading-relaxed max-w-[180px]">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[10px] text-[#C5A059] uppercase tracking-[0.25em] font-bold mb-2">Client Stories</p>
            <h2 className="text-2xl md:text-3xl font-black uppercase italic mb-4">What Our Clients Say</h2>
            <div className="flex justify-center gap-1 text-[#C5A059]">
              {Array(5).fill(0).map((_, i) => (
                <svg key={i} width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { text: "The service was impeccable. From the ease of booking to the pristine condition of the car, everything exceeded my expectations.", name: "James Williams", role: "Elite Member", avatar: "JW" },
              { text: "Rented a Porsche for my weekend getaway. The car was a dream to drive and the delivery was prompt and professional.", name: "Sarah Jenkins", role: "Frequent User", avatar: "SJ" },
              { text: "Best luxury rental in the city. The support team goes the extra mile to make you feel special.", name: "Michael Ross", role: "Member", avatar: "MR" },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.15 }}
                className="bg-white/[0.04] border border-white/8 rounded-3xl p-7 hover:border-[#C5A059]/20 hover:bg-white/[0.06] transition-all"
              >
                <div className="text-[#C5A059]/40 text-4xl font-serif leading-none mb-3">"</div>
                <p className="text-zinc-400 text-xs leading-relaxed mb-6">{t.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-[#C5A059]/30 to-[#C5A059]/10 border border-[#C5A059]/20 rounded-full flex items-center justify-center font-black text-[9px] text-[#C5A059]">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-black text-xs uppercase tracking-tight">{t.name}</p>
                    <p className="text-[9px] uppercase font-bold text-zinc-600 tracking-widest">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      {/* <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl border border-[#C5A059]/20 bg-gradient-to-r from-[#C5A059]/10 via-[#C5A059]/5 to-transparent p-12 text-center"
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059]/10 blur-[80px] rounded-full" />
            </div>
            <p className="text-[10px] text-[#C5A059] uppercase tracking-[0.25em] font-bold mb-3">Ready to Ride?</p>
            <h2 className="text-2xl md:text-3xl font-black uppercase italic mb-4">Your Premium Journey Awaits</h2>
            <p className="text-zinc-400 text-sm mb-8 max-w-md mx-auto">Join thousands of satisfied customers who trust Rental Garage for their luxury travel needs.</p>
            <Link
              href="/cars"
              className="inline-flex items-center gap-3 px-8 py-3 bg-[#C5A059] text-black font-bold text-[11px] uppercase tracking-[0.2em] rounded-full hover:brightness-110 active:scale-95 transition-all shadow-[0_8px_30px_rgba(197,160,89,0.4)]"
            >
              Browse Fleet
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </motion.div>
        </div>
      </section> */}

      {/* ── FOOTER ── */}
      <footer className="bg-black/50 pt-16 pb-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 text-center sm:text-left">
          <div className="col-span-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-5">
              <div className="bg-[#C5A059] px-1.5 py-0.5 rounded text-[9px] text-black font-black italic -skew-x-12">RG</div>
              <span className="text-sm font-black tracking-tighter uppercase italic">Rental_<span className="text-[#C5A059]">Garage</span></span>
            </div>
            <p className="text-zinc-500 text-xs leading-relaxed mb-6">
              Premium car rental for those who demand excellence, comfort, and performance across Kerala.
            </p>
          </div>

          {[
            { title: "Quick Links", links: ["Find a Car", "Special Offers", "Membership", "Corporate Rental"] },
            { title: "Company", links: ["About Us", "Our Fleet", "How it Works", "Contact Us"] },
          ].map(col => (
            <div key={col.title}>
              <h5 className="font-black italic uppercase text-[10px] mb-5 tracking-widest text-zinc-300">{col.title}</h5>
              <div className="flex flex-col gap-3">
                {col.links.map(link => (
                  <Link key={link} href="#" className="text-zinc-500 hover:text-white transition-colors text-[10px] uppercase tracking-widest font-bold">{link}</Link>
                ))}
              </div>
            </div>
          ))}

          <div>
            <h5 className="font-black italic uppercase text-[10px] mb-5 tracking-widest text-zinc-300">Contact</h5>
            <div className="flex flex-col gap-4 text-zinc-500 text-[10px] font-bold">
              {[["📍", "Kochi, Kerala, India"], ["📞", "+91 98765 43210"], ["✉️", "booking@rentalgarage.com"]].map(([icon, text]) => (
                <div key={text} className="flex gap-3 items-start justify-center sm:justify-start">
                  <span>{icon}</span><span className="uppercase tracking-widest">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center pt-6 border-t border-white/5 text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em]">
          © 2026 Rental Garage — All Rights Reserved
        </div>
      </footer>
    </div>
  );
}
