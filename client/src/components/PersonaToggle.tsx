import { useState } from "react";

/**
 * PersonaToggle — switch between Investor, Regulator, and Legal Counsel views.
 *
 * Highlights the section most relevant to each persona. The page itself shows
 * all sections; this toggle just scrolls to and highlights the relevant card.
 */

export type Persona = "all" | "investor" | "regulator" | "legal";

interface PersonaToggleProps {
  activePersona: Persona;
  onPersonaChange: (persona: Persona) => void;
}

const PERSONAS: Array<{ id: Persona; label: string; icon: string; color: string }> = [
  { id: "all", label: "All", icon: "🌐", color: "bg-gray-100 hover:bg-gray-200 text-foreground" },
  { id: "investor", label: "Investor", icon: "📈", color: "bg-primary/10 hover:bg-primary/20 text-primary" },
  { id: "regulator", label: "Regulator", icon: "🏛️", color: "bg-blue-100 hover:bg-blue-200 text-blue-900" },
  { id: "legal", label: "Legal", icon: "⚖️", color: "bg-purple-100 hover:bg-purple-200 text-purple-900" },
];

export function PersonaToggle({ activePersona, onPersonaChange }: PersonaToggleProps) {
  return (
    <div className="sticky top-4 z-50 bg-background/95 backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg mb-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-1">View as</h3>
          <p className="text-xs text-muted-foreground">
            Switch to see what matters for your role
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {PERSONAS.map((persona) => (
            <button
              key={persona.id}
              onClick={() => onPersonaChange(persona.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                activePersona === persona.id
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : persona.color
              }`}
            >
              <span className="text-base">{persona.icon}</span>
              <span>{persona.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for managing persona state across pages.
 */
export function usePersona() {
  const [activePersona, setActivePersona] = useState<Persona>("all");

  const handlePersonaChange = (persona: Persona) => {
    setActivePersona(persona);

    // Scroll to relevant section if not "all"
    if (persona === "all") return;

    const sectionId = `persona-${persona}`;
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("ring-4", "ring-primary", "ring-offset-4");
      setTimeout(() => {
        element.classList.remove("ring-4", "ring-primary", "ring-offset-4");
      }, 2000);
    }
  };

  return { activePersona, handlePersonaChange };
}
