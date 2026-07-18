/**
 * EU AI Act Countdown Timer Component
 * Shows countdown to Feb 2, 2026 deadline
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, AlertTriangle } from "lucide-react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function EUAIActCountdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // EU AI Act enforcement deadline: February 2, 2026
    const deadline = new Date("2026-02-02T00:00:00Z").getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = deadline - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const TimeUnit = ({ value, label, isUrgent }: { value: number; label: string; isUrgent?: boolean }) => (
    <div className="flex flex-col items-center">
      <motion.div
        key={value}
        initial={{ rotateX: -90, opacity: 0 }}
        animate={{ rotateX: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20
        }}
        className={`relative bg-white/10 backdrop-blur-sm border ${isUrgent ? 'border-amber-400/50' : 'border-white/20'} rounded-xl px-4 py-3 min-w-[70px] md:min-w-[90px] overflow-hidden`}
      >
        {/* Glowing effect for urgency */}
        {isUrgent && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-amber-500/20 to-transparent"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        <span className={`text-3xl md:text-4xl font-bold ${isUrgent ? 'text-amber-300' : 'text-white'} tabular-nums relative z-10`}>
          {value.toString().padStart(2, "0")}
        </span>
      </motion.div>
      <span className="text-xs md:text-sm text-emerald-300 mt-2 font-medium">{label}</span>
    </div>
  );

  // Calculate if we're in the "urgent" zone (less than 30 days)
  const isUrgent = timeLeft.days < 30;

  return (
    <div className="text-center">
      <div className="inline-flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <span className="text-amber-300 text-sm font-semibold">EU AI Act Enforcement Deadline</span>
      </div>

      <p className="text-gray-400 text-sm mb-4">
        The more awareness we spread, the safer the future for all
      </p>

      <div className="flex items-center justify-center gap-2 md:gap-4">
        <TimeUnit value={timeLeft.days} label="Days" isUrgent={isUrgent} />
        <span className="text-2xl text-white/50 font-light">:</span>
        <TimeUnit value={timeLeft.hours} label="Hours" isUrgent={isUrgent} />
        <span className="text-2xl text-white/50 font-light">:</span>
        <TimeUnit value={timeLeft.minutes} label="Minutes" isUrgent={isUrgent} />
        <span className="text-2xl text-white/50 font-light">:</span>
        <TimeUnit value={timeLeft.seconds} label="Seconds" isUrgent={isUrgent} />
      </div>
    </div>
  );
}
