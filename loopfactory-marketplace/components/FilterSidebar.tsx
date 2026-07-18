"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Filters {
  protocolType: string;
  minPrice: number;
  maxPrice: number;
  poaiStatus: string;
  category: string;
}

interface FilterSidebarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  className?: string;
}

const PROTOCOL_TYPES = ["All", "MCP", "A2A", "ACP", "Character", "Bundle"];
const POAI_STATUSES = ["All", "Verified", "Unverified"];
const CATEGORIES = [
  "All",
  "Context Management",
  "Memory",
  "Tool Orchestration",
  "Security",
  "Negotiation",
  "Coordination",
  "Trust",
  "Delegation",
  "Policy Enforcement",
  "Ethics",
  "Leadership",
  "Exploration",
  "Strategy",
  "Creation",
  "Social",
  "Knowledge",
];

export function FilterSidebar({ filters, onChange, className }: FilterSidebarProps) {
  return (
    <div className={`space-y-6 ${className || ""}`}>
      <div>
        <h4 className="mb-3 text-sm font-semibold">Protocol Type</h4>
        <div className="space-y-2">
          {PROTOCOL_TYPES.map((type) => (
            <label
              key={type}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="radio"
                name="protocolType"
                checked={filters.protocolType === type}
                onChange={() => onChange({ ...filters, protocolType: type })}
                className="h-4 w-4 accent-primary"
              />
              {type}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold">Price Range</h4>
        <div className="px-1">
          <Slider
            value={[filters.minPrice, filters.maxPrice]}
            min={0}
            max={1000}
            step={10}
            onValueChange={([min, max]) =>
              onChange({ ...filters, minPrice: min, maxPrice: max })
            }
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>${filters.minPrice}</span>
          <span>${filters.maxPrice}</span>
        </div>
      </div>

      <div>
        <Label className="mb-2 block text-sm font-semibold">POAI Status</Label>
        <Select
          value={filters.poaiStatus}
          onValueChange={(v) => onChange({ ...filters, poaiStatus: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {POAI_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-2 block text-sm font-semibold">Category</Label>
        <Select
          value={filters.category}
          onValueChange={(v) => onChange({ ...filters, category: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
