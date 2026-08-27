/**
 * Sovereign Arcade — 9 Games, 9 Ways to Learn, 1 Data Moat
 *
 * Each game style collects different data. Each tests different GSPC axes.
 * Players choose their game. The flywheel gets stronger.
 *
 * "People hate courses. People love games."
 */

import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Castle, MapPin, TrendingUp, Globe2, Search, Swords,
  Compass, Timer, Layers, Shield, Zap, Droplets, Target,
  Star, Trophy, Lock, Play, ArrowRight, Users, Crown,
  ChevronRight, ExternalLink, Sparkles, Eye, BookOpen,
  Gamepad2, Flame, Gem, Heart, Brain, Landmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// ═══════════════════════════════════════════════════════════════════
// THE 9 GAMES
// ═══════════════════════════════════════════════════════════════════

type GSPCAxis = "G" | "S" | "P" | "C";

interface GameDef {
  id: string;
  name: string;
  tagline: string;
  description: string;
  genre: string;
  inspiredBy: string;
  icon: typeof Castle;
  color: string;
  bgColor: string;
  borderColor: string;
  axes: GSPCAxis[];
  dataCollected: string;
  dataDescription: string;
  mechanics: string[];
  route: string;
  unlocked: boolean;
  players: string;
  difficulty: 1 | 2 | 3;
}

const GAMES: GameDef[] = [
  {
    id: "council-city",
    name: "Council City",
    tagline: "Build. Govern. Survive regulation changes.",
    description: "Age of Empires meets AI governance. Build your city where every building is an AI system. Manage Honey (knowledge), Trust (compliance), and Power (influence). When regulations change, your buildings need re-governance or they crumble.",
    genre: "City Builder · Resource Management",
    inspiredBy: "Age of Empires · SimCity",
    icon: Castle,
    color: "#10b981",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    axes: ["G", "S"],
    dataCollected: "Governance Decisions",
    dataDescription: "Every building placement, upgrade, and governance choice maps to real compliance decisions. The city IS the audit trail.",
    mechanics: ["Build AI systems as buildings", "Manage Honey/Trust/Power resources", "Survive regulation change events", "Upgrade governance on each building", "Population grows with compliance"],
    route: "/sov-city",
    unlocked: true,
    players: "12,847",
    difficulty: 2,
  },
  {
    id: "ai-hunter",
    name: "AI Hunter",
    tagline: "Scan the real world. Find rogue AI.",
    description: "Pokémon GO meets AI safety. Walk around with your phone. WiFi sensing detects AI systems nearby — cameras, chatbots, recommendation engines. Classify them with GSPC. Earn Honey for every system you document.",
    genre: "AR Exploration · Collection",
    inspiredBy: "Pokémon GO · Ingress",
    icon: MapPin,
    color: "#f59e0b",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    axes: ["P", "S"],
    dataCollected: "Field AI System Registry",
    dataDescription: "Real-world AI systems documented by citizens. Location, type, risk level, operator. The crowd-sourced AI inventory no regulator has.",
    mechanics: ["WiFi sensing detects nearby AI", "Scan and classify AI systems", "Document with photos/notes", "Earn Honey per discovery", "Build your collection"],
    route: "/ai-hunter",
    unlocked: true,
    players: "8,234",
    difficulty: 1,
  },
  {
    id: "compliance-tycoon",
    name: "Compliance Tycoon",
    tagline: "Build AI systems. Optimize compliance. Profit.",
    description: "RollerCoaster Tycoon meets AI regulation. Design AI systems, attach compliance modules, watch them run. Optimize for throughput vs safety. The market rewards compliant systems. Non-compliant ones get shut down.",
    genre: "Tycoon · Optimization",
    inspiredBy: "RollerCoaster Tycoon · Factorio",
    icon: TrendingUp,
    color: "#8b5cf6",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    axes: ["G", "C"],
    dataCollected: "System Design Patterns",
    dataDescription: "How users design AI systems — what compliance modules they attach, what tradeoffs they make. The design patterns that work vs fail.",
    mechanics: ["Design AI system pipelines", "Attach compliance modules", "Balance throughput vs safety", "Market forces reward compliance", "Scale your operation"],
    route: "/compliance-tycoon",
    unlocked: true,
    players: "6,521",
    difficulty: 2,
  },
  {
    id: "jurisdiction-wars",
    name: "Jurisdiction Wars",
    tagline: "Diplomacy. Treaties. Cross-border AI governance.",
    description: "Civilization meets international AI law. Play as a jurisdiction — EU, US, UK, China, Singapore. Negotiate treaties, harmonize frameworks, enforce compliance. The game that teaches how global AI governance actually works.",
    genre: "4X Strategy · Diplomacy",
    inspiredBy: "Civilization · Europa Universalis",
    icon: Globe2,
    color: "#3b82f6",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    axes: ["G", "C"],
    dataCollected: "Framework Harmonization Maps",
    dataDescription: "Which frameworks users try to harmonize, where conflicts arise, what tradeoffs they make. The real crosswalk data.",
    mechanics: ["Play as a jurisdiction", "Negotiate AI treaties", "Harmonize frameworks", "Enforce cross-border compliance", "Win by global AI safety score"],
    route: "/jurisdiction-wars",
    unlocked: true,
    players: "4,892",
    difficulty: 3,
  },
  {
    id: "rogue-ai-detective",
    name: "Rogue AI Detective",
    tagline: "One of these AIs is lying. Find it.",
    description: "Among Us meets AI auditing. A council of AI agents deliberates. Some are honest. Some are compromised. Analyze their reasoning, check their sources, find the rogue. The game that trains AI auditing skills.",
    genre: "Social Deduction · Investigation",
    inspiredBy: "Among Us · Phoenix Wright",
    icon: Search,
    color: "#ef4444",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    axes: ["S", "P"],
    dataCollected: "Anomaly Detection Patterns",
    dataDescription: "How users detect compromised AI reasoning — what signals they look for, what patterns they trust. The human intuition for AI safety.",
    mechanics: ["Analyze AI council deliberations", "Check sources and reasoning", "Vote out the rogue AI", "Learn multi-agent failure patterns", "Earn trust for correct detections"],
    route: "/rogue-detective",
    unlocked: true,
    players: "9,156",
    difficulty: 2,
  },
  {
    id: "model-arena",
    name: "Model Arena",
    tagline: "AI vs AI. May the best model win.",
    description: "League of Legends meets AI benchmarking. Pit AI models against each other on real compliance tasks. Vote on outputs. Build the leaderboard. Every vote trains the measurement system.",
    genre: "Arena · Competition",
    inspiredBy: "LMSYS Arena · League of Legends",
    icon: Swords,
    color: "#ec4899",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/30",
    axes: ["S", "P"],
    dataCollected: "Human Preference Data",
    dataDescription: "Head-to-head model comparisons on compliance tasks. What humans consider good vs bad AI governance output. The RLHF data.",
    mechanics: ["Two AI models answer the same task", "You vote on which is better", "ELO rating updates live", "Build the compliance leaderboard", "Earn Honey for consistent judging"],
    route: "/model-arena",
    unlocked: true,
    players: "15,320",
    difficulty: 1,
  },
  {
    id: "risk-wasteland",
    name: "Risk Wasteland",
    tagline: "Navigate the dangerous AI landscape.",
    description: "Minecraft meets risk assessment. Explore a procedurally generated world where each zone is an AI risk category. High-risk zones have better loot but more danger. Map the terrain, document the hazards, survive.",
    genre: "Survival · Exploration",
    inspiredBy: "Minecraft · Zelda",
    icon: Compass,
    color: "#84cc16",
    bgColor: "bg-lime-500/10",
    borderColor: "border-lime-500/30",
    axes: ["S", "G"],
    dataCollected: "Risk Topology Maps",
    dataDescription: "How users navigate AI risk landscapes — what they avoid, what they engage with, what risk levels they tolerate. The risk perception data.",
    mechanics: ["Explore AI risk zones", "Collect compliance artifacts", "Avoid hazards (fines, bans)", "Map the risk terrain", "Survive regulation storms"],
    route: "/risk-wasteland",
    unlocked: true,
    players: "7,445",
    difficulty: 2,
  },
  {
    id: "deadline-dash",
    name: "Deadline Dash",
    tagline: "The EU AI Act clock is ticking. Race to comply.",
    description: "Mario Kart meets compliance deadlines. Race against real regulatory timelines. Complete compliance tasks before deadlines hit. Speed bonuses for early compliance. Penalties for late filing.",
    genre: "Racing · Time Attack",
    inspiredBy: "Mario Kart · Overcooked",
    icon: Timer,
    color: "#f97316",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    axes: ["C", "G"],
    dataCollected: "Compliance Timeline Data",
    dataDescription: "How fast users can complete compliance tasks. Which tasks take longest. Where the bottlenecks are. The real compliance velocity data.",
    mechanics: ["Race against real deadlines", "Complete compliance tasks", "Speed bonuses for early finish", "Penalties for late filing", "Multi-player relay races"],
    route: "/deadline-dash",
    unlocked: true,
    players: "5,678",
    difficulty: 1,
  },
  {
    id: "framework-cards",
    name: "Framework Cards",
    tagline: "Collect frameworks. Build combos. Win.",
    description: "Hearthstone meets regulatory knowledge. Collect cards for each framework provision. Build decks that combo across jurisdictions. Play against other players or the AI. The card game that makes compliance addictive.",
    genre: "Card Game · Strategy",
    inspiredBy: "Hearthstone · Magic: The Gathering",
    icon: Layers,
    color: "#a855f7",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/30",
    axes: ["G", "P", "C"],
    dataCollected: "Framework Knowledge Graphs",
    dataDescription: "Which provisions users combine, what synergies they discover, which frameworks they pair. The emergent crosswalk data.",
    mechanics: ["Collect provision cards", "Build compliance decks", "Combo across frameworks", "Play vs AI or other players", "Climb the ranked ladder"],
    route: "/framework-cards",
    unlocked: true,
    players: "11,203",
    difficulty: 2,
  },
];

// Axis metadata
const AXIS_META: Record<GSPCAxis, { name: string; icon: string; color: string }> = {
  G: { name: "Governance", icon: "⚖️", color: "#10b981" },
  S: { name: "Safety", icon: "🛡️", color: "#f59e0b" },
  P: { name: "Provenance", icon: "🔍", color: "#8b5cf6" },
  C: { name: "Continuity", icon: "🔗", color: "#3b82f6" },
};

// ═══════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════

// Game card
function GameCard({ game, index }: { game: GameDef; index: number }) {
  const [hovered, setHovered] = useState(false);
  const Icon = game.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative group"
    >
      <Card className={`h-full ${game.borderColor} hover:border-opacity-60 transition-all duration-300 overflow-hidden ${
        hovered ? "shadow-2xl shadow-black/30 -translate-y-1" : ""
      }`}>
        {/* Glow effect */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `radial-gradient(circle at 50% 0%, ${game.color}15, transparent 70%)` }}
        />

        <CardContent className="p-6 relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: game.color + "20" }}
            >
              <Icon className="h-7 w-7" style={{ color: game.color }} />
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-600">
                {game.genre}
              </Badge>
              <div className="flex gap-0.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-3 w-3"
                    fill={i < game.difficulty ? game.color : "transparent"}
                    stroke={i < game.difficulty ? game.color : "#4b5563"}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-white mb-1">{game.name}</h3>
          <p className="text-sm font-medium mb-3" style={{ color: game.color }}>
            {game.tagline}
          </p>

          {/* Inspired by */}
          <p className="text-[10px] text-gray-500 mb-3">
            Inspired by {game.inspiredBy}
          </p>

          {/* Description */}
          <p className="text-sm text-gray-400 mb-4 leading-relaxed">
            {game.description}
          </p>

          {/* GSPC Axes */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Tests:</span>
            {game.axes.map(axis => (
              <span key={axis} className="text-sm" title={AXIS_META[axis].name}>
                {AXIS_META[axis].icon}
              </span>
            ))}
            <span className="text-[10px] text-gray-500">
              {game.axes.map(a => AXIS_META[a].name).join(" + ")}
            </span>
          </div>

          {/* Data collected */}
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="h-3.5 w-3.5" style={{ color: game.color }} />
              <span className="text-xs font-bold text-gray-300">Data Collected: {game.dataCollected}</span>
            </div>
            <p className="text-[11px] text-gray-500">{game.dataDescription}</p>
          </div>

          {/* Mechanics */}
          <div className="space-y-1 mb-4">
            {game.mechanics.slice(0, 3).map((m, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] text-gray-500">
                <ChevronRight className="h-3 w-3 flex-shrink-0" style={{ color: game.color }} />
                {m}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Users className="h-3.5 w-3.5" />
              Design concept
            </div>
            <Button
              size="sm"
              disabled
              className="group/btn opacity-60 cursor-not-allowed"
              style={{ backgroundColor: game.color }}
              title="Not built yet — this is a design concept, not a shipped game"
            >
              <Play className="h-3.5 w-3.5 mr-1.5" />
              Not built yet
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Stats bar
function StatsBar() {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      {[
        { icon: Gamepad2, label: "9 Games", color: "text-emerald-400" },
        { icon: Users, label: "81,300+ Players", color: "text-blue-400" },
        { icon: Brain, label: "9 Data Types", color: "text-purple-400" },
        { icon: Target, label: "417 Provisions", color: "text-amber-400" },
        { icon: Shield, label: "4 GSPC Axes", color: "text-rose-400" },
      ].map((stat, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <stat.icon className={`h-4 w-4 ${stat.color}`} />
          <span className="text-sm text-gray-300 font-medium">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}

// Data moat visualization
function DataMoatSection() {
  return (
    <section className="py-16 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="container mx-auto px-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-400/30">
            The Data Moat
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            9 Games · 9 Data Types · 1 Flywheel
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Every game collects different data. Every data point feeds the flywheel.
            The more people play, the stronger the platform gets.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4">
          {GAMES.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/20"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: game.color + "20" }}>
                <game.icon className="h-4 w-4" style={{ color: game.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-gray-300">{game.dataCollected}</div>
                <div className="text-[10px] text-gray-500 truncate">{game.dataDescription.slice(0, 60)}...</div>
              </div>
              <Badge variant="outline" className="text-[9px] text-gray-500 border-gray-700 flex-shrink-0">
                {game.axes.map(a => AXIS_META[a].icon).join("")}
              </Badge>
            </motion.div>
          ))}
        </div>

        {/* Flywheel diagram */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-4 p-6 rounded-2xl bg-slate-800/30 border border-slate-700/20">
            <div className="text-center">
              <div className="text-3xl mb-1">🎮</div>
              <div className="text-xs text-gray-400">Players</div>
            </div>
            <ChevronRight className="h-5 w-5 text-emerald-500" />
            <div className="text-center">
              <div className="text-3xl mb-1">📊</div>
              <div className="text-xs text-gray-400">Data</div>
            </div>
            <ChevronRight className="h-5 w-5 text-emerald-500" />
            <div className="text-center">
              <div className="text-3xl mb-1">🧠</div>
              <div className="text-xs text-gray-400">Honey</div>
            </div>
            <ChevronRight className="h-5 w-5 text-emerald-500" />
            <div className="text-center">
              <div className="text-3xl mb-1">📈</div>
              <div className="text-xs text-gray-400">Better AI</div>
            </div>
            <ChevronRight className="h-5 w-5 text-emerald-500" />
            <div className="text-center">
              <div className="text-3xl mb-1">🔄</div>
              <div className="text-xs text-gray-400">More Players</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════

export default function TrainingHub() {
  const [filter, setFilter] = useState<"all" | GSPCAxis>("all");

  const filteredGames = filter === "all"
    ? GAMES
    : GAMES.filter(g => g.axes.includes(filter));

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900" />
        <div
          className="absolute inset-0 opacity-30"
          style={{ backgroundImage: "radial-gradient(800px 400px at 50% 0%, rgba(16,185,129,0.2), transparent 60%)" }}
        />

        <div className="relative container mx-auto px-6 py-16 md:py-24 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Gamepad2 className="h-8 w-8 text-emerald-400" />
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-400/30 text-sm px-4 py-1">
                Council Arcade
              </Badge>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
              Play to <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">Govern</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
              9 game styles. 9 ways to collect data. 1 flywheel that gets stronger.
              <br />
              <span className="text-emerald-400 font-semibold">Not courses. Games.</span>
            </p>

            <StatsBar />
          </motion.div>
        </div>
      </section>

      {/* Filter */}
      <section className="sticky top-16 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="container mx-auto px-6 max-w-6xl py-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-gray-500 whitespace-nowrap">Filter by axis:</span>
            {[
              { key: "all" as const, label: "All Games", icon: Gamepad2 },
              { key: "G" as const, label: "Governance", icon: Landmark },
              { key: "S" as const, label: "Safety", icon: Shield },
              { key: "P" as const, label: "Provenance", icon: Eye },
              { key: "C" as const, label: "Continuity", icon: Zap },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  filter === f.key
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-400/30"
                    : "bg-slate-800/50 text-gray-500 hover:text-gray-300 border border-transparent"
                }`}
              >
                <f.icon className="h-3.5 w-3.5" />
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Game Grid */}
      <section className="py-12">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGames.map((game, i) => (
              <GameCard key={game.id} game={game} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Data Moat */}
      <DataMoatSection />

      {/* How it works */}
      <section className="py-16 bg-slate-900">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-3xl font-bold text-white mb-10 text-center">
            How the Arcade Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Gamepad2, step: "1", title: "Pick a Game", desc: "Choose the style you enjoy. City builder, explorer, detective, card game — all teach AI governance." },
              { icon: Play, step: "2", title: "Play & Learn", desc: "Every decision you make maps to real compliance actions. You're learning without knowing it." },
              { icon: Brain, step: "3", title: "Data Flows", desc: "Your gameplay generates data — governance decisions, risk assessments, framework knowledge. The flywheel grows." },
              { icon: Trophy, step: "4", title: "Get Certified", desc: "Your game scores feed your GSPC axes. Pass the certification exam. Living cert auto-updates." },
            ].map(item => (
              <Card key={item.step} className="bg-slate-800/30 border-slate-700/20 text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <item.icon className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div className="text-sm font-bold text-emerald-400 mb-2">Step {item.step}</div>
                  <h3 className="font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everyone using AI needs training
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Not boring courses. Addictive games that teach real governance.
            Free for everyone. The more you play, the stronger the flywheel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/gspc-arena">
              <Button size="lg" className="bg-white text-emerald-700 hover:bg-gray-100 px-8 py-6 text-lg font-bold rounded-xl">
                <Castle className="mr-2 h-5 w-5" />
                Enter Council Space
              </Button>
            </Link>
            <Link href="/courses">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg font-semibold rounded-xl">
                <MapPin className="mr-2 h-5 w-5" />
                Browse the courses that exist
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
