import {
  Users, Target, Shield, Globe, Award, Building2, Heart, Zap, CheckCircle2, FileCheck, Download,
  TrendingUp, Clock, MapPin, BarChart2
} from "lucide-react";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

// Animated counter component
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated) {
        setIsVisible(true);
        setHasAnimated(true);
      }
    }, { threshold: 0.1 });

    const element = document.getElementById(`counter-${target}`);
    if (element) observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [hasAnimated, target]);

  useEffect(() => {
    if (!isVisible) return;

    let currentCount = 0;
    const increment = target / 50;
    const interval = setInterval(() => {
      currentCount += increment;
      if (currentCount >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(Math.floor(currentCount));
      }
    }, 30);

    return () => clearInterval(interval);
  }, [isVisible, target]);

  return (
    <span id={`counter-${target}`}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

function LiveBoardCount() {
  const [label, setLabel] = useState("…");
  useEffect(() => {
    fetch("/api/gspc")
      .then((r) => r.json())
      .then((d) => {
        const count = d?.totals?.public_count;
        setLabel(typeof count === "string" && count.trim() ? count : "see /api/gspc");
      })
      .catch(() => setLabel("see /api/gspc"));
  }, []);
  return (
    <>
      <div className="text-2xl font-bold text-emerald-600 mb-2 leading-snug">{label}</div>
      <p className="text-gray-600 font-semibold">Living GSPC board — counts from GET /api/gspc</p>
    </>
  );
}
