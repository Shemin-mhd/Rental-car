"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { getImageUrl } from "../services/api";

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
      }
    } catch { }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.replace("/login");
  };

  const [featuredCars, setFeaturedCars] = useState<any[]>([
    { _id: "69c5151bbefb283665d432a5", name: "Mini Cooper", price: 12000, type: "Wedding", year: 2021, hp: 189, gear: "Manual", passengers: 5, image: "https://res.cloudinary.com/dzpecawmd/image/upload/v1775885064/WhatsApp_Image_2026-04-11_at_10.52.14_AM_cmy2cv.jpg", location: "Kochi" },
    { _id: "69ce0b878b9d9a71e391fe4a", name: "BMW 7 Series", price: 11000, type: "Luxury", year: 2022, hp: 523, gear: "Manual", passengers: 4, image: "https://res.cloudinary.com/dzpecawmd/image/upload/v1775885064/WhatsApp_Image_2026-04-11_at_10.52.14_AM_1_mzjuyu.jpg", location: "Kozhikode" },
    { _id: "69c5151bbefb283665d43293", name: "Suzuki Swift", price: 5500, type: "Wedding", year: 2021, hp: 88, gear: "Manual", passengers: 5, image: "https://res.cloudinary.com/dzpecawmd/image/upload/v1775549830/mod1_lypg52.jpg", location: "Kochi" },
  ]);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/cars`);
        const data = await res.json();
        const priorityModels = ["Mini Cooper", "Bmw", "Swift"];
        const selected = data.filter((c: any) => 
          priorityModels.some(pm => c.name.toLowerCase().includes(pm.toLowerCase()))
        ).slice(0, 3);
        if (selected.length > 0) setFeaturedCars(selected);
      } catch (err) { }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="bg-black min-h-screen text-white font-sans selection:bg-[#526E48]/40 scroll-smooth w-full overflow-x-hidden">
      {/* ── Background Global Glow ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#526E48]/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-black blur-[150px] rounded-full" />
      </div>

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-8 py-4 backdrop-blur-xl bg-black/40 border-b border-white/[0.05] shadow-2xl transition-all duration-500">
        <div className="flex items-center gap-1.5">
          <div className="bg-[#526E48] px-1 py-0.5 rounded text-[8px] text-white font-black italic -skew-x-12">RG</div>
          <span className="text-sm font-black tracking-tighter uppercase text-white flex items-center gap-1">Rental_<span className="text-[#526E48]">Garage</span></span>
        </div>
        <div className="flex gap-5 items-center">
          {!isLoggedIn ? (
            <>
              <Link href="/login" className="text-[10px] uppercase font-black text-white/50 hover:text-white transition-colors tracking-[0.2em] italic">Login</Link>
              <Link href="/register" className="bg-[#526E48] text-white px-6 py-2 rounded-xl font-black hover:brightness-110 active:scale-95 transition-all text-[10px] tracking-[0.15em] uppercase shadow-lg shadow-[#526E48]/20">Register</Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[7px] font-bold text-zinc-500 tracking-[0.2em] leading-none mb-1">Signed In</span>
                <span className="text-[10px] uppercase font-black tracking-widest text-[#526E48] leading-none truncate max-w-[120px]">{username || "User"}</span>
              </div>
              <div className="h-6 w-px bg-black/10" />
              <div className="relative">
                <button 
                  onClick={() => setShowLogout(!showLogout)}
                  className="w-8 h-8 rounded-full border border-red-500/20 bg-red-500/5 flex items-center justify-center hover:bg-red-500 text-red-500 hover:text-white transition-all shadow-lg"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
                {showLogout && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-full mt-2 z-[200] w-32"
                  >
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center py-2 bg-red-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-black overflow-hidden">
          <video autoPlay muted loop playsInline className="w-full h-full object-cover opacity-60">
            <source src="/hero_vid.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
        </div>
        <div className="relative z-10 text-center max-w-[950px] px-6 mt-16">
          <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="text-[36px] md:text-[54px] lg:text-[68px] font-black uppercase leading-[0.85] tracking-[-0.05em] mb-6 text-white text-shadow-xl">
            Experience <br /><span className="text-[#526E48]">Premium Travel</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-white/50 text-[10px] md:text-xs max-w-lg mx-auto mb-10 font-bold uppercase tracking-[0.25em] leading-relaxed">
            KERALA'S EXCLUSIVE ELITE RENTAL FLEET. <br className="hidden md:block" /> GUARANTEED PERFORMANCE & WEDDING LUXURY SOLUTIONS.
          </motion.p>
          <Link href="/cars" className="inline-flex items-center gap-3 bg-[#526E48] text-white px-10 py-4.5 rounded-full font-black text-[11px] uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-2xl">
            Explore Fleet
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="translate-y-[0.5px]"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </section>

      {/* ── FEATURED COLLECTION ── */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div className="flex flex-col">
            <p className="text-[10px] text-[#526E48] uppercase tracking-[0.25em] font-black mb-2">/// Registry_Log</p>
            <h2 className="text-3xl font-black uppercase tracking-tighter">Featured Collection</h2>
          </div>
          <Link href="/cars" className="text-[10px] font-black text-[#526E48] hover:text-white uppercase tracking-[0.2em] transition-colors group">View All <span className="group-hover:translate-x-1 transition-transform inline-block">→</span></Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredCars.map((car, i) => (
            <motion.div key={car._id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="group bg-zinc-900 border border-white/[0.05] rounded-[3rem] overflow-hidden hover:border-[#526E48]/50 transition-all duration-500 shadow-2xl relative">
              <div className="relative h-64 w-full overflow-hidden">
                <Image src={getImageUrl(car.image || car.img)} alt={car.name} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" unoptimized />
                <div className="absolute top-4 left-4 bg-[#526E48] text-white text-[8px] font-black uppercase px-3 py-1 rounded-full">{car.category || car.type}</div>
              </div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-black uppercase leading-none mb-1">{car.name}</h3>
                    <p className="text-zinc-500 text-[9px] uppercase font-bold tracking-[0.2em]">{car.location || "Kochi"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-[#526E48]">₹{car.price?.toLocaleString() || car.pricePerDay?.toLocaleString()}</p>
                    <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">/day</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-8">
                   <div className="bg-white/5 py-3 rounded-2xl text-center border border-white/5"><p className="text-[7px] font-black text-zinc-500 uppercase mb-0.5">SEATS</p><p className="text-[10px] font-black text-white">{car.seats || car.passengers || "5"}</p></div>
                   <div className="bg-white/5 py-3 rounded-2xl text-center border border-white/5"><p className="text-[7px] font-black text-zinc-500 uppercase mb-0.5">GEAR</p><p className="text-[10px] font-black text-white">{car.transmission || car.gear || "MANUAL"}</p></div>
                   <div className="bg-white/5 py-3 rounded-2xl text-center border border-white/5"><p className="text-[7px] font-black text-zinc-500 uppercase mb-0.5">ELITE</p><p className="text-[10px] font-black text-[#526E48]">4.9</p></div>
                </div>

                <Link href={`/cars/${car._id}`} className="block w-full text-center bg-[#526E48] text-white py-4 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all shadow-xl">
                  Complete Details
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#526E48]/5 blur-[80px] rounded-full" />
        </div>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[10px] text-[#526E48] uppercase tracking-[0.25em] font-bold mb-2">Simple Process</p>
            <h2 className="text-2xl md:text-3xl font-black uppercase italic">How it Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-10 left-[17%] right-[17%] h-px bg-gradient-to-r from-transparent via-[#526E48]/30 to-transparent" />

            {[
              { title: "Choose Car", desc: "Browse our curated luxury fleet and pick the perfect vehicle for your journey.", icon: "🚗", step: "01" },
              { title: "Book Instantly", desc: "Fast online booking with instant confirmation. Experience the ultimate self-drive freedom.", icon: "📅", step: "02" },
              { title: "Hit the Road", desc: "Collect your car or have it delivered to you. Enjoy a premium driving experience.", icon: "🏁", step: "03" },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="relative flex flex-col items-center text-center p-8 bg-white/[0.03] border border-white/8 rounded-3xl hover:border-[#526E48]/20 transition-all"
              >
                <div className="absolute -top-3 left-6 text-[10px] font-black text-[#526E48]/50 tracking-widest">{step.step}</div>
                <div className="w-14 h-14 bg-[#526E48]/10 rounded-2xl flex items-center justify-center text-2xl mb-5 border border-[#526E48]/20">
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
            <p className="text-[10px] text-[#526E48] uppercase tracking-[0.25em] font-bold mb-2">Client Stories</p>
            <h2 className="text-2xl md:text-3xl font-black uppercase italic mb-4">What Our Clients Say</h2>
            <div className="flex justify-center gap-1 text-[#526E48]">
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
                className="bg-white/[0.04] border border-white/8 rounded-3xl p-7 hover:border-[#526E48]/20 hover:bg-white/[0.06] transition-all"
              >
                <div className="text-[#526E48]/40 text-4xl font-serif leading-none mb-3">&quot;</div>
                <p className="text-zinc-400 text-xs leading-relaxed mb-6">{t.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-[#526E48]/30 to-[#526E48]/10 border border-[#526E48]/20 rounded-full flex items-center justify-center font-black text-[9px] text-[#526E48]">
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
            className="relative overflow-hidden rounded-3xl border border-[#526E48]/20 bg-gradient-to-r from-[#526E48]/10 via-[#526E48]/5 to-transparent p-12 text-center"
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#526E48]/10 blur-[80px] rounded-full" />
            </div>
            <p className="text-[10px] text-[#526E48] uppercase tracking-[0.25em] font-bold mb-3">Ready to Ride?</p>
            <h2 className="text-2xl md:text-3xl font-black uppercase italic mb-4">Your Premium Journey Awaits</h2>
            <p className="text-zinc-400 text-sm mb-8 max-w-md mx-auto">Join thousands of satisfied customers who trust Rental Garage for their luxury travel needs.</p>
            <Link
              href="/cars"
              className="inline-flex items-center gap-3 px-8 py-3 bg-[#526E48] text-black font-bold text-[11px] uppercase tracking-[0.2em] rounded-full hover:brightness-110 active:scale-95 transition-all shadow-[0_8px_30px_rgba(197,160,89,0.4)]"
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
              <div className="bg-[#526E48] px-1.5 py-0.5 rounded text-[9px] text-black font-black italic -skew-x-12">RG</div>
              <span className="text-sm font-black tracking-tighter uppercase italic">Rental_<span className="text-[#526E48]">Garage</span></span>
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
