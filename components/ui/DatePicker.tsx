"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LuxuryDatePickerProps {
    value: string;
    onChange: (date: string) => void;
    minDate?: string;
    placeholder: string;
    label: string;
}

export default function LuxuryDatePicker({ value, onChange, minDate, placeholder, label }: LuxuryDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date(value || minDate || new Date()));
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const startDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const generateDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const days = [];

        const totalDays = daysInMonth(year, month);
        const firstDay = startDayOfMonth(year, month);

        // Previous month padding
        const prevMonthLastDay = daysInMonth(year, month - 1);
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ day: prevMonthLastDay - i, month: month - 1, year, isPadding: true });
        }

        // Current month
        for (let i = 1; i <= totalDays; i++) {
            days.push({ day: i, month, year, isPadding: false });
        }

        // Next month padding
        const remainingCells = 42 - days.length;
        for (let i = 1; i <= remainingCells; i++) {
            days.push({ day: i, month: month + 1, year, isPadding: true });
        }

        return days;
    };

    const handleDateSelect = (day: number, month: number, year: number, isPadding: boolean) => {
        if (isPadding) return;
        const selectedDate = new Date(year, month, day);
        if (minDate && selectedDate < new Date(new Date(minDate).setHours(0,0,0,0))) return;

        const formattedDate = selectedDate.toISOString().split("T")[0];
        onChange(formattedDate);
        setIsOpen(false);
    };

    const changeMonth = (offset: number) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
    };

    const isSelected = (day: number, month: number, year: number) => {
        if (!value) return false;
        const d = new Date(value);
        return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    };

    const isDisabled = (day: number, month: number, year: number) => {
        if (!minDate) return false;
        const current = new Date(year, month, day);
        const min = new Date(minDate);
        min.setHours(0,0,0,0);
        return current < min;
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-[#526E48] mb-2 ml-1">
                {label}
            </p>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-11 bg-white rounded-xl px-4 border border-black/10 text-[10px] font-black transition-all flex items-center justify-between cursor-pointer hover:border-[#526E48]/40 group"
            >
                <span className={value ? "text-black" : "text-zinc-500"}>
                    {value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : placeholder}
                </span>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="text-[#526E48] opacity-60 group-hover:opacity-100 transition-opacity">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className="absolute bottom-full left-0 mb-3 z-[100] w-[260px] bg-white border border-black/10 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl"
                    >
                        <div className="flex items-center justify-between mb-4 px-1">
                            <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-black/5 rounded-lg transition-colors">
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
                            </button>
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#526E48]">
                                {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
                            </span>
                            <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M9 5l6 6-6 6"/></svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-7 mb-2 text-center">
                            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
                                <div key={i} className="text-[7px] font-black text-zinc-700 uppercase tracking-widest">{d}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {generateDays().map((d, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    disabled={d.isPadding || isDisabled(d.day, d.month, d.year)}
                                    onClick={() => handleDateSelect(d.day, d.month, d.year, d.isPadding)}
                                    className={`
                                        aspect-square flex items-center justify-center rounded-lg text-[9px] font-black transition-all
                                        ${d.isPadding ? "text-transparent" : ""}
                                        ${!d.isPadding && isSelected(d.day, d.month, d.year) ? "bg-[#526E48] text-white shadow-lg shadow-[#526E48]/20" : ""}
                                        ${!d.isPadding && !isSelected(d.day, d.month, d.year) && !isDisabled(d.day, d.month, d.year) ? "text-black/60 hover:bg-black/5 hover:text-black" : ""}
                                        ${!d.isPadding && isDisabled(d.day, d.month, d.year) ? "text-black/10 cursor-not-allowed" : ""}
                                    `}
                                >
                                    {d.day}
                                </button>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between">
                            <button type="button" onClick={() => onChange("")} className="text-[7px] font-black uppercase tracking-widest text-zinc-500 hover:text-red-500 transition-colors">Clear</button>
                            <button type="button" onClick={() => onChange(new Date().toISOString().split("T")[0])} className="text-[7px] font-black uppercase tracking-widest text-[#526E48] hover:brightness-125">Today</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

