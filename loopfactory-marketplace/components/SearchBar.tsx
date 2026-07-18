"use client";

import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { OASF_TAXONOMY } from "@/lib/mockData";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search agents, characters, protocols...",
  className,
}: SearchBarProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!value.trim()) {
      setFiltered([]);
      return;
    }
    const lower = value.toLowerCase();
    const matches = OASF_TAXONOMY.filter((t) => t.includes(lower)).slice(0, 5);
    setFiltered(matches);
  }, [value]);

  return (
    <div ref={containerRef} className={`relative ${className || ""}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="pl-10 pr-4"
        />
      </div>
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
            OASF Taxonomy
          </div>
          {filtered.map((item) => (
            <button
              key={item}
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                onChange(item);
                setShowSuggestions(false);
              }}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
