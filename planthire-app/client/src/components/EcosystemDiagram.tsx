/**
 * CSOAI Ecosystem Diagram
 *
 * An interactive, animated visualization of the complete CSOAI ecosystem
 * showing how all systems integrate together for AI safety governance.
 *
 * Features:
 * - Interactive hover states with connection highlighting
 * - Animated pulse/glow effects on active elements
 * - Click to navigate to each system's page
 * - Responsive design for mobile
 * - Professional white/green color scheme
 * - Animated data flow connection lines
 * - Legend explaining color coding
 */

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Shield,
  Heart,
  Users,
  Scale,
  FileText,
  GraduationCap,
  Eye,
  Briefcase,
  DollarSign,
  Globe,
  Building2,
  UserCheck,
  CheckCircle,
  ArrowRight,
  Zap,
  Network,
  Award,
  Flag,
  Landmark,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Types
type NodeCategory = "core" | "compliance" | "operational" | "stakeholder";

interface EcosystemNode {
  id: string;
  label: string;
  shortLabel?: string;
  description: string;
  category: NodeCategory;
  icon: React.ElementType;
  link: string;
  stats?: string;
  connections: string[];
  position?: { x: number; y: number };
}

interface ConnectionProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  isActive: boolean;
  isHighlighted: boolean;
  delay?: number;
}

// Color scheme based on CSOAI brand (green primary)
const categoryColors: Record<NodeCategory, { bg: string; border: string; text: string; glow: string }> = {
  core: {
    bg: "bg-emerald-600",
    border: "border-emerald-500",
    text: "text-emerald-600",
    glow: "shadow-emerald-500/50",
  },
  compliance: {
    bg: "bg-green-500",
    border: "border-green-400",
    text: "text-green-600",
    glow: "shadow-green-500/50",
  },
  operational: {
    bg: "bg-teal-500",
    border: "border-teal-400",
    text: "text-teal-600",
    glow: "shadow-teal-500/50",
  },
  stakeholder: {
    bg: "bg-gray-600",
    border: "border-gray-500",
    text: "text-gray-600",
    glow: "shadow-gray-500/50",
  },
};

// Define all ecosystem nodes
const ecosystemNodes: EcosystemNode[] = [
  // Core Systems (Center)
  {
    id: "charter",
    label: "CSOAI Charter",
    shortLabel: "Charter",
    description: "52 Articles + 13 Schedules - The Constitution",
    category: "core",
    icon: FileText,
    link: "/charter",
    stats: "52 Articles",
    connections: ["maternal", "byzantine", "eu-ai-act", "nist", "iso-42001", "licensing", "training"],
  },
  {
    id: "maternal",
    label: "Maternal Covenant",
    shortLabel: "Covenant",
    description: "Article 1 - Partnership philosophy",
    category: "core",
    icon: Heart,
    link: "/charter#maternal-covenant",
    stats: "Article 1",
    connections: ["charter", "byzantine", "prosperity", "citizens"],
  },
  {
    id: "byzantine",
    label: "Byzantine Council",
    shortLabel: "Council",
    description: "33 AI Agents - Real-time monitoring",
    category: "core",
    icon: Shield,
    link: "/agent-council",
    stats: "33 Agents",
    connections: ["charter", "maternal", "watchdog", "enterprises", "governments"],
  },

  // Compliance Frameworks
  {
    id: "eu-ai-act",
    label: "EU AI Act",
    shortLabel: "EU AI Act",
    description: "113 articles, effective Aug 2024",
    category: "compliance",
    icon: Flag,
    link: "/training",
    stats: "113 Articles",
    connections: ["charter", "nist", "iso-42001", "enterprises"],
  },
  {
    id: "nist",
    label: "NIST AI RMF",
    shortLabel: "NIST RMF",
    description: "GOVERN, MAP, MEASURE, MANAGE",
    category: "compliance",
    icon: Scale,
    link: "/training",
    stats: "v1.0",
    connections: ["charter", "eu-ai-act", "iso-42001", "enterprises"],
  },
  {
    id: "iso-42001",
    label: "ISO 42001:2023",
    shortLabel: "ISO 42001",
    description: "AI Management Systems",
    category: "compliance",
    icon: Award,
    link: "/training",
    stats: "2023",
    connections: ["charter", "eu-ai-act", "nist", "tc260", "enterprises"],
  },
  {
    id: "tc260",
    label: "TC260 China",
    shortLabel: "TC260",
    description: "China Framework",
    category: "compliance",
    icon: Globe,
    link: "/training",
    connections: ["iso-42001", "uk-aisi", "singapore"],
  },
  {
    id: "uk-aisi",
    label: "UK AI Safety Institute",
    shortLabel: "UK AISI",
    description: "UK Guidelines",
    category: "compliance",
    icon: Landmark,
    link: "/training",
    connections: ["tc260", "singapore", "korea"],
  },
  {
    id: "singapore",
    label: "Singapore Model AI",
    shortLabel: "Singapore",
    description: "Model AI Governance",
    category: "compliance",
    icon: Globe,
    link: "/training",
    connections: ["tc260", "uk-aisi", "korea"],
  },
  {
    id: "korea",
    label: "South Korea AI",
    shortLabel: "Korea",
    description: "AI Framework Act (Jan 2026)",
    category: "compliance",
    icon: Globe,
    link: "/training",
    stats: "Jan 2026",
    connections: ["uk-aisi", "singapore"],
  },

  // Operational Layers
  {
    id: "licensing",
    label: "Licensing & Certification",
    shortLabel: "Licensing",
    description: "System registration and compliance",
    category: "operational",
    icon: CheckCircle,
    link: "/certification",
    connections: ["charter", "training", "enterprises"],
  },
  {
    id: "training",
    label: "Training Academy",
    shortLabel: "Training",
    description: "Free AI safety courses",
    category: "operational",
    icon: GraduationCap,
    link: "/training",
    stats: "Free",
    connections: ["charter", "licensing", "jobs", "analysts"],
  },
  {
    id: "watchdog",
    label: "Watchdog Reporting",
    shortLabel: "Watchdog",
    description: "Incident reporting system",
    category: "operational",
    icon: Eye,
    link: "/watchdog",
    connections: ["byzantine", "citizens", "analysts"],
  },
  {
    id: "jobs",
    label: "Job Marketplace",
    shortLabel: "Jobs",
    description: "AI Safety Analyst positions",
    category: "operational",
    icon: Briefcase,
    link: "/jobs",
    stats: "$45/hr",
    connections: ["training", "analysts"],
  },
  {
    id: "prosperity",
    label: "Prosperity Fund",
    shortLabel: "Prosperity",
    description: "UBI Distribution",
    category: "operational",
    icon: DollarSign,
    link: "/prosperity-fund",
    connections: ["maternal", "citizens"],
  },

  // Stakeholders (Outer Ring)
  {
    id: "citizens",
    label: "Public Citizens",
    shortLabel: "Citizens",
    description: "Reporting, transparency access",
    category: "stakeholder",
    icon: Users,
    link: "/public-dashboard",
    connections: ["maternal", "watchdog", "prosperity"],
  },
  {
    id: "enterprises",
    label: "Enterprises",
    shortLabel: "Enterprise",
    description: "Compliance, registration",
    category: "stakeholder",
    icon: Building2,
    link: "/enterprise",
    connections: ["byzantine", "eu-ai-act", "nist", "iso-42001", "licensing"],
  },
  {
    id: "governments",
    label: "Governments",
    shortLabel: "Government",
    description: "Regulation, oversight",
    category: "stakeholder",
    icon: Landmark,
    link: "/regulator-dashboard",
    connections: ["byzantine"],
  },
  {
    id: "analysts",
    label: "AI Safety Analysts",
    shortLabel: "Analysts",
    description: "Training, employment",
    category: "stakeholder",
    icon: UserCheck,
    link: "/workbench",
    connections: ["training", "watchdog", "jobs"],
  },
];

// Calculate positions for nodes in a radial layout
function calculateNodePositions(containerSize: { width: number; height: number }) {
  const centerX = containerSize.width / 2;
  const centerY = containerSize.height / 2;
  const positions: Record<string, { x: number; y: number }> = {};

  // Core nodes - center cluster
  const coreNodes = ecosystemNodes.filter(n => n.category === "core");
  const coreRadius = Math.min(containerSize.width, containerSize.height) * 0.12;
  coreNodes.forEach((node, i) => {
    const angle = (i / coreNodes.length) * Math.PI * 2 - Math.PI / 2;
    positions[node.id] = {
      x: centerX + Math.cos(angle) * coreRadius,
      y: centerY + Math.sin(angle) * coreRadius,
    };
  });

  // Compliance nodes - inner ring
  const complianceNodes = ecosystemNodes.filter(n => n.category === "compliance");
  const complianceRadius = Math.min(containerSize.width, containerSize.height) * 0.3;
  complianceNodes.forEach((node, i) => {
    const angle = (i / complianceNodes.length) * Math.PI * 2 - Math.PI / 2;
    positions[node.id] = {
      x: centerX + Math.cos(angle) * complianceRadius,
      y: centerY + Math.sin(angle) * complianceRadius,
    };
  });

  // Operational nodes - middle ring
  const operationalNodes = ecosystemNodes.filter(n => n.category === "operational");
  const operationalRadius = Math.min(containerSize.width, containerSize.height) * 0.38;
  operationalNodes.forEach((node, i) => {
    const startAngle = Math.PI * 0.1;
    const angle = startAngle + (i / operationalNodes.length) * Math.PI * 1.5;
    positions[node.id] = {
      x: centerX + Math.cos(angle) * operationalRadius,
      y: centerY + Math.sin(angle) * operationalRadius,
    };
  });

  // Stakeholder nodes - outer ring
  const stakeholderNodes = ecosystemNodes.filter(n => n.category === "stakeholder");
  const stakeholderRadius = Math.min(containerSize.width, containerSize.height) * 0.46;
  stakeholderNodes.forEach((node, i) => {
    const startAngle = Math.PI * -0.3;
    const angle = startAngle + (i / stakeholderNodes.length) * Math.PI * 1.2;
    positions[node.id] = {
      x: centerX + Math.cos(angle) * stakeholderRadius,
      y: centerY + Math.sin(angle) * stakeholderRadius,
    };
  });

  return positions;
}

// Animated connection line component
function ConnectionLine({ from, to, isActive, isHighlighted, delay = 0 }: ConnectionProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [from, to]);

  // Calculate control points for curved lines
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const curvature = distance * 0.15;

  // Perpendicular offset for curve
  const nx = -dy / distance;
  const ny = dx / distance;
  const controlX = midX + nx * curvature;
  const controlY = midY + ny * curvature;

  const d = `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;

  return (
    <g>
      {/* Base line */}
      <motion.path
        ref={pathRef}
        d={d}
        fill="none"
        stroke={isHighlighted ? "#10b981" : "#e5e7eb"}
        strokeWidth={isHighlighted ? 2.5 : 1}
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : 0.3 }}
        transition={{ duration: 0.3 }}
      />

      {/* Animated flow particles */}
      {isHighlighted && pathLength > 0 && (
        <>
          <motion.circle
            r="3"
            fill="#10b981"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              path={d}
              begin={`${delay}s`}
            />
          </motion.circle>
          <motion.circle
            r="3"
            fill="#34d399"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
          >
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              path={d}
              begin={`${delay + 0.5}s`}
            />
          </motion.circle>
        </>
      )}

      {/* Glow effect for highlighted lines */}
      {isHighlighted && (
        <motion.path
          d={d}
          fill="none"
          stroke="#10b981"
          strokeWidth={4}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          style={{ filter: "blur(4px)" }}
        />
      )}
    </g>
  );
}

// Node component with hover and click interactions
interface NodeProps {
  node: EcosystemNode;
  position: { x: number; y: number };
  isHovered: boolean;
  isConnected: boolean;
  onHover: (id: string | null) => void;
  size: "sm" | "md" | "lg";
}

function EcosystemNodeComponent({ node, position, isHovered, isConnected, onHover, size }: NodeProps) {
  const colors = categoryColors[node.category];
  const Icon = node.icon;

  const sizeClasses = {
    sm: "w-12 h-12 md:w-14 md:h-14",
    md: "w-14 h-14 md:w-16 md:h-16",
    lg: "w-16 h-16 md:w-20 md:h-20",
  };

  const iconSizes = {
    sm: "w-5 h-5 md:w-6 md:h-6",
    md: "w-6 h-6 md:w-7 md:h-7",
    lg: "w-7 h-7 md:w-9 md:h-9",
  };

  return (
    <Link href={node.link}>
      <motion.div
        className="absolute cursor-pointer"
        style={{
          left: position.x,
          top: position.y,
          transform: "translate(-50%, -50%)",
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: isHovered ? 1.15 : isConnected ? 1.05 : 1,
          opacity: 1,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
          delay: Math.random() * 0.3,
        }}
        onMouseEnter={() => onHover(node.id)}
        onMouseLeave={() => onHover(null)}
      >
        {/* Pulsing ring effect */}
        <AnimatePresence>
          {(isHovered || node.category === "core") && (
            <motion.div
              className={cn(
                "absolute inset-0 rounded-full",
                colors.bg
              )}
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{
                scale: [1, 1.5, 1.8],
                opacity: [0.4, 0.2, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
              }}
              style={{ transform: "translate(0, 0)" }}
            />
          )}
        </AnimatePresence>

        {/* Main node circle */}
        <motion.div
          className={cn(
            sizeClasses[size],
            "rounded-full flex items-center justify-center",
            "border-2 bg-white",
            colors.border,
            isHovered && `shadow-lg ${colors.glow}`,
            isConnected && !isHovered && "ring-2 ring-emerald-300 ring-opacity-50",
            "transition-shadow duration-300"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className={cn(
              "rounded-full flex items-center justify-center",
              node.category === "core" ? colors.bg : "bg-gray-50",
              node.category === "core" ? "w-full h-full" : "w-[85%] h-[85%]"
            )}
          >
            <Icon
              className={cn(
                iconSizes[size],
                node.category === "core" ? "text-white" : colors.text
              )}
            />
          </motion.div>
        </motion.div>

        {/* Label */}
        <motion.div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-center",
            "pointer-events-none",
            size === "lg" ? "top-full mt-2" : "top-full mt-1"
          )}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className={cn(
            "font-semibold block",
            size === "lg" ? "text-sm" : "text-xs",
            isHovered ? colors.text : "text-gray-700"
          )}>
            {node.shortLabel || node.label}
          </span>
          {node.stats && (
            <span className="text-xs text-gray-500 block">
              {node.stats}
            </span>
          )}
        </motion.div>

        {/* Tooltip on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-16 w-48 md:w-56"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", colors.bg)}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-bold text-sm text-gray-900">{node.label}</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{node.description}</p>
                <div className="flex items-center gap-1 text-xs text-emerald-600">
                  <span>Click to explore</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
              {/* Tooltip arrow */}
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-white border-r border-b border-gray-200 transform rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  );
}

// Legend component
function DiagramLegend() {
  const categories: { key: NodeCategory; label: string; description: string }[] = [
    { key: "core", label: "Core Systems", description: "Foundation of CSOAI governance" },
    { key: "compliance", label: "Compliance Frameworks", description: "Global regulatory standards" },
    { key: "operational", label: "Operational Layers", description: "Services and platforms" },
    { key: "stakeholder", label: "Stakeholders", description: "Users and participants" },
  ];

  return (
    <motion.div
      className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
    >
      <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
        <Network className="w-4 h-4 text-emerald-600" />
        Ecosystem Legend
      </h4>
      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.key} className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", categoryColors[cat.key].bg)} />
            <span className="text-xs font-medium text-gray-700">{cat.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-8 h-0.5 bg-emerald-400" />
          <span>Data flow</span>
        </div>
      </div>
    </motion.div>
  );
}

// Main component
export default function EcosystemDiagram() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 900, height: 700 });

  // Update container size on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: Math.max(rect.width, 320),
          height: Math.max(rect.height, 500),
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Calculate node positions
  const nodePositions = useMemo(() => calculateNodePositions(containerSize), [containerSize]);

  // Get connected nodes for highlighting
  const connectedNodes = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const node = ecosystemNodes.find(n => n.id === hoveredNode);
    if (!node) return new Set<string>();
    return new Set([...node.connections, hoveredNode]);
  }, [hoveredNode]);

  // Get all connections for rendering
  const connections = useMemo(() => {
    const conns: { from: string; to: string; key: string }[] = [];
    const seen = new Set<string>();

    ecosystemNodes.forEach(node => {
      node.connections.forEach(targetId => {
        const key = [node.id, targetId].sort().join("-");
        if (!seen.has(key)) {
          seen.add(key);
          conns.push({ from: node.id, to: targetId, key });
        }
      });
    });

    return conns;
  }, []);

  return (
    <div className="w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <Network className="w-6 h-6" />
              CSOAI Ecosystem
            </h2>
            <p className="text-emerald-100 text-sm mt-1">
              Interactive visualization of integrated AI safety systems
            </p>
          </div>
          <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
            <Zap className="w-3 h-3 mr-1" />
            Live System
          </Badge>
        </div>
      </div>

      {/* Diagram Container */}
      <div
        ref={containerRef}
        className="relative w-full h-[500px] md:h-[650px] lg:h-[750px] bg-gradient-to-br from-gray-50 to-white"
      >
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #e5e7eb 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* Center decoration */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Outer rings */}
          {[0.46, 0.38, 0.3, 0.12].map((radius, i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed"
              style={{
                width: Math.min(containerSize.width, containerSize.height) * radius * 2,
                height: Math.min(containerSize.width, containerSize.height) * radius * 2,
                borderColor: i === 0 ? "#d1d5db" : i === 1 ? "#a7f3d0" : i === 2 ? "#6ee7b7" : "#34d399",
                opacity: 0.4,
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            />
          ))}

          {/* Center CSOAI logo/badge */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"
            animate={{
              boxShadow: [
                "0 0 20px rgba(16, 185, 129, 0.3)",
                "0 0 40px rgba(16, 185, 129, 0.5)",
                "0 0 20px rgba(16, 185, 129, 0.3)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-white font-black text-sm md:text-base">CSOAI</span>
          </motion.div>
        </motion.div>

        {/* SVG for connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {connections.map((conn, index) => {
            const fromPos = nodePositions[conn.from];
            const toPos = nodePositions[conn.to];
            if (!fromPos || !toPos) return null;

            const isHighlighted = hoveredNode && (
              conn.from === hoveredNode ||
              conn.to === hoveredNode
            );

            return (
              <ConnectionLine
                key={conn.key}
                from={fromPos}
                to={toPos}
                isActive={true}
                isHighlighted={!!isHighlighted}
                delay={index * 0.1}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {ecosystemNodes.map((node) => {
          const position = nodePositions[node.id];
          if (!position) return null;

          const size: "sm" | "md" | "lg" =
            node.category === "core" ? "lg" :
            node.category === "compliance" ? "md" : "sm";

          return (
            <EcosystemNodeComponent
              key={node.id}
              node={node}
              position={position}
              isHovered={hoveredNode === node.id}
              isConnected={connectedNodes.has(node.id)}
              onHover={setHoveredNode}
              size={size}
            />
          );
        })}

        {/* Legend */}
        <DiagramLegend />

        {/* Instructions */}
        <motion.div
          className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 px-4 py-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-xs text-gray-600 flex items-center gap-2">
            <CircleDot className="w-3 h-3 text-emerald-500" />
            Hover to explore connections
          </p>
        </motion.div>
      </div>

      {/* Footer with summary stats */}
      <div className="bg-gray-50 border-t border-gray-100 px-6 py-4">
        <div className="flex flex-wrap justify-center gap-6 md:gap-12">
          <div className="text-center">
            <div className="text-2xl font-black text-emerald-600">3</div>
            <div className="text-xs text-gray-500">Core Systems</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-green-600">7</div>
            <div className="text-xs text-gray-500">Compliance Frameworks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-teal-600">5</div>
            <div className="text-xs text-gray-500">Operational Layers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-gray-600">4</div>
            <div className="text-xs text-gray-500">Stakeholder Groups</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-emerald-600">33</div>
            <div className="text-xs text-gray-500">AI Agents</div>
          </div>
        </div>
      </div>
    </div>
  );
}
