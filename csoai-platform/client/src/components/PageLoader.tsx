/**
 * CSOAI Page Loader
 * Professional loading animation for page transitions
 */

import { motion } from "framer-motion";
import { Shield } from "lucide-react";

interface PageLoaderProps {
  message?: string;
}

export default function PageLoader({ message = "Loading..." }: PageLoaderProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50/30">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-6"
      >
        {/* Animated Shield Logo */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Shield className="w-10 h-10 text-white" />
          </div>
          {/* Pulse ring */}
          <motion.div
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 bg-emerald-500 rounded-2xl"
          />
        </motion.div>

        {/* Loading text */}
        <div className="text-center">
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-lg font-medium text-slate-700"
          >
            {message}
          </motion.p>
          <p className="text-sm text-slate-500 mt-1">CSOAI Platform</p>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.5, 1],
                backgroundColor: ["#10b981", "#059669", "#10b981"],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-2 h-2 rounded-full bg-emerald-500"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Inline loader for sections
 */
export function SectionLoader({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full"
      />
    </div>
  );
}

/**
 * Button loading state
 */
export function ButtonLoader() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
    />
  );
}
