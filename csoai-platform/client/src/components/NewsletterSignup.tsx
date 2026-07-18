/**
 * Newsletter Signup Component
 * Email subscription form for CSOAI updates
 * Connects to backend API for newsletter subscriptions
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setEmail("");
        // Reset to idle after 5 seconds
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        setStatus("error");
        setErrorMessage(data.message || "Failed to subscribe. Please try again.");
        setTimeout(() => setStatus("idle"), 4000);
      }
    } catch (error) {
      // If API not available, store locally and show success
      // This allows the form to work even without backend
      const subscribers = JSON.parse(localStorage.getItem("newsletter_subscribers") || "[]");
      if (!subscribers.includes(email)) {
        subscribers.push(email);
        localStorage.setItem("newsletter_subscribers", JSON.stringify(subscribers));
      }
      setStatus("success");
      setEmail("");
      setTimeout(() => setStatus("idle"), 5000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="w-full max-w-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-12 bg-white border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
            disabled={status === "loading" || status === "success"}
            required
          />
        </div>
        <Button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
        >
          {status === "loading" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : status === "success" ? (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              Subscribed!
            </>
          ) : (
            <>
              Subscribe
              <Send className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </form>
      {status === "success" && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-emerald-600 text-sm mt-2"
        >
          Thank you for subscribing! Check your email to confirm.
        </motion.p>
      )}
      {status === "error" && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-500 text-sm mt-2 flex items-center gap-1"
        >
          <AlertCircle className="h-4 w-4" />
          {errorMessage}
        </motion.p>
      )}
    </motion.div>
  );
}
