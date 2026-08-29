/**
 * Global Search Component - Command Palette Style (Cmd+K / Ctrl+K)
 *
 * Features:
 * - Fuzzy search across pages, charter articles, training, frameworks, FAQ
 * - Keyboard navigation (up/down arrows, enter to select, escape to close)
 * - Recent searches history with localStorage persistence
 * - Quick actions for common tasks
 * - Categorized results with icons
 * - Framer Motion animations
 * - CSOAI brand styling (white/emerald-green)
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  FileText,
  BookOpen,
  GraduationCap,
  Shield,
  HelpCircle,
  Zap,
  Clock,
  ArrowRight,
  Command,
  CornerDownLeft,
  ChevronUp,
  ChevronDown,
  Home,
  Users,
  Building2,
  Settings,
  Award,
  BarChart3,
  Globe2,
  Heart,
  Scale,
  Brain,
  DollarSign,
  Gavel,
  AlertTriangle,
  Play,
  Plus,
  Eye,
  FileCheck,
  Briefcase,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { chargeSovereign } from '@/lib/sovCharge';
import { askSovereign } from '@/lib/sovAsk';
import { SEARCH_INDEX, type SearchResult, type SearchCategory } from './globalSearchIndex';

const SOV_GW: string = ((import.meta as any).env?.VITE_KNOWLEDGE_BASE) || '/api';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
}

// Search Index Data
// Quick Actions
const QUICK_ACTIONS: QuickAction[] = [
  { id: 'action-start-training', title: 'Start Training', description: 'Begin your AI safety training', href: '/courses', icon: GraduationCap, color: 'bg-emerald-500' },
  { id: 'action-register-ai', title: 'Register AI System', description: 'Add a new AI system to the registry', href: '/ai-systems', icon: Plus, color: 'bg-blue-500' },
  { id: 'action-take-exam', title: 'Get measured', description: 'Start at /assess — a signed card, not a certificate', href: '/assess', icon: FileCheck, color: 'bg-purple-500' },
  { id: 'action-report-incident', title: 'Report AI Incident', description: 'Submit a safety incident report', href: '/watchdog', icon: AlertTriangle, color: 'bg-red-500' },
  { id: 'action-apply-job', title: 'Browse Analyst Jobs', description: 'Find Watchdog analyst opportunities', href: '/jobs', icon: Briefcase, color: 'bg-amber-500' },
  { id: 'action-view-charter', title: 'View Partnership Charter', description: 'Read the 52 Articles', href: '/charter', icon: FileText, color: 'bg-slate-700' },
];

// Category configuration
const CATEGORY_CONFIG: Record<SearchCategory, { label: string; icon: React.ElementType; color: string }> = {
  pages: { label: 'Pages', icon: FileText, color: 'text-blue-600 bg-blue-100' },
  charter: { label: 'Charter Articles', icon: FileText, color: 'text-rose-600 bg-rose-100' },
  training: { label: 'Training', icon: GraduationCap, color: 'text-emerald-600 bg-emerald-100' },
  frameworks: { label: 'Frameworks', icon: Shield, color: 'text-purple-600 bg-purple-100' },
  faq: { label: 'FAQ', icon: HelpCircle, color: 'text-amber-600 bg-amber-100' },
  actions: { label: 'Quick Actions', icon: Zap, color: 'text-green-600 bg-green-100' },
  recent: { label: 'Recent', icon: Clock, color: 'text-gray-600 bg-gray-100' },
};

// Fuzzy search function
function fuzzyMatch(text: string, query: string): boolean {
  const searchText = text.toLowerCase();
  const searchQuery = query.toLowerCase();

  // Direct substring match
  if (searchText.includes(searchQuery)) return true;

  // Fuzzy match - all characters must appear in order
  let queryIndex = 0;
  for (let i = 0; i < searchText.length && queryIndex < searchQuery.length; i++) {
    if (searchText[i] === searchQuery[queryIndex]) {
      queryIndex++;
    }
  }

  return queryIndex === searchQuery.length;
}

// Score results for ranking
function scoreResult(result: SearchResult, query: string): number {
  const q = query.toLowerCase();
  const title = result.title.toLowerCase();
  const desc = result.description.toLowerCase();

  let score = 0;

  // Exact title match
  if (title === q) score += 100;
  // Title starts with query
  else if (title.startsWith(q)) score += 80;
  // Title contains query as word
  else if (title.includes(q)) score += 60;
  // Description contains query
  else if (desc.includes(q)) score += 40;
  // Keywords match
  if (result.keywords?.some(k => k.toLowerCase().includes(q))) score += 30;
  // Highlighted items get bonus
  if (result.highlight) score += 20;

  return score;
}

// Recent searches storage key
const RECENT_SEARCHES_KEY = 'csoai-recent-searches';
const MAX_RECENT_SEARCHES = 5;

interface GlobalSearchProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function GlobalSearch({ open: controlledOpen, onOpenChange }: GlobalSearchProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Use controlled or internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // Load recent searches on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load recent searches', e);
    }
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== searchQuery.toLowerCase());
      const updated = [searchQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save recent searches', e);
      }
      return updated;
    });
  }, []);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K / Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(!isOpen);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Filtered and scored results
  const results = useMemo(() => {
    if (!query.trim()) {
      // Show quick actions and recent searches when no query
      const recentResults: SearchResult[] = recentSearches.map((search, idx) => ({
        id: `recent-${idx}`,
        title: search,
        description: 'Recent search',
        category: 'recent' as const,
        href: '#',
        icon: Clock,
      }));

      const actionResults: SearchResult[] = QUICK_ACTIONS.map(action => ({
        id: action.id,
        title: action.title,
        description: action.description,
        category: 'actions' as const,
        href: action.href,
        icon: action.icon,
      }));

      return [...recentResults, ...actionResults];
    }

    // Filter and score results
    const matched = SEARCH_INDEX.filter(result => {
      const searchableText = `${result.title} ${result.description} ${result.keywords?.join(' ') || ''}`;
      return fuzzyMatch(searchableText, query);
    });

    // Sort by score
    return matched
      .map(result => ({ ...result, score: scoreResult(result, query) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  }, [query, recentSearches]);

  // Group results by category
  const groupedResults = useMemo(() => {
    const groups: Record<SearchCategory, SearchResult[]> = {
      recent: [],
      actions: [],
      pages: [],
      charter: [],
      training: [],
      frameworks: [],
      faq: [],
    };

    results.forEach(result => {
      groups[result.category].push(result);
    });

    return Object.entries(groups)
      .filter(([, items]) => items.length > 0) as [SearchCategory, SearchResult[]][];
  }, [results]);

  // Flat list for keyboard navigation
  const flatResults = useMemo(() => results, [results]);

  // Handle selection
  const handleSelect = useCallback((result: SearchResult) => {
    if (result.category === 'recent') {
      // Use recent search as new query
      setQuery(result.title);
      return;
    }

    saveRecentSearch(query);
    setOpen(false);
    setLocation(result.href);
  }, [query, saveRecentSearch, setOpen, setLocation]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, flatResults.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (flatResults[selectedIndex]) {
          handleSelect(flatResults[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  }, [flatResults, selectedIndex, handleSelect, setOpen]);

  // Scroll selected item into view
  useEffect(() => {
    const container = resultsRef.current;
    if (!container) return;

    const selectedElement = container.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Reset selected index (and any AI answer) when the query changes
  useEffect(() => {
    setSelectedIndex(0);
    setAiAnswer('');
    setAiLoading(false);
  }, [query]);

  // Ask the Council assistant - fuse live governance reasoning into the command bar
  const runCouncilAsk = useCallback(async () => {
    const t = query.trim();
    if (!t) return;
    setAiLoading(true); setAiAnswer(''); chargeSovereign(4);
    const res = await askSovereign(t);
    setAiAnswer(res.text);
    setAiLoading(false);
  }, [query]);

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-2xl p-0 gap-0 overflow-hidden bg-white"
        aria-describedby="global-search-description"
      >
        <DialogTitle className="sr-only">Global Search</DialogTitle>
        <span id="global-search-description" className="sr-only">
          Search across pages, charter articles, training modules, and more
        </span>

        {/* Search Input */}
        <div className="flex items-center border-b px-4 py-3">
          <Search className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search the OS, or ask the Council anything…"
            className="flex-1 text-base outline-none bg-transparent placeholder:text-gray-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
          <div className="ml-3 flex items-center gap-1 text-xs text-gray-400 border-l pl-3">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">esc</kbd>
            <span>to close</span>
          </div>
        </div>

        {/* Results */}
        <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto p-2">
          {query.trim().length >= 3 && (
            <div className="mb-2 rounded-lg border border-emerald-200 bg-emerald-50/60 p-2">
              <button onClick={runCouncilAsk} className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-emerald-100/60">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <Brain className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-emerald-900">Ask the Council assistant{aiLoading ? '…' : ''}</div>
                  <div className="truncate text-xs text-emerald-700/70">Reason live over governance — “{query.trim()}”</div>
                </div>
                <CornerDownLeft className="h-4 w-4 flex-shrink-0 text-emerald-500" />
              </button>
              {aiAnswer && (
                <div className="mt-1 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-md bg-white px-3 py-2 text-sm leading-relaxed text-gray-700">{aiAnswer}</div>
              )}
            </div>
          )}
          <AnimatePresence mode="wait">
            {flatResults.length === 0 && query ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="py-12 text-center"
              >
                <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No results found for "{query}"</p>
                <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {groupedResults.map(([category, items]) => {
                  const config = CATEGORY_CONFIG[category];
                  const CategoryIcon = config.icon;

                  return (
                    <div key={category} className="mb-4">
                      <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        <CategoryIcon className="h-3.5 w-3.5" />
                        {config.label}
                      </div>

                      {items.map((result) => {
                        const itemIndex = flatResults.findIndex(r => r.id === result.id);
                        const isSelected = itemIndex === selectedIndex;
                        const Icon = result.icon || config.icon;

                        return (
                          <motion.button
                            key={result.id}
                            data-index={itemIndex}
                            onClick={() => handleSelect(result)}
                            onMouseEnter={() => setSelectedIndex(itemIndex)}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.15 }}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                              isSelected ? "bg-emerald-50 text-emerald-900" : "hover:bg-gray-50",
                              result.highlight && "border border-emerald-200"
                            )}
                          >
                            <div className={cn(
                              "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                              isSelected ? "bg-emerald-100 text-emerald-600" : config.color
                            )}>
                              <Icon className="h-5 w-5" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "font-medium truncate",
                                  result.highlight && "text-emerald-700"
                                )}>
                                  {result.title}
                                </span>
                                {result.highlight && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-600 border-emerald-200">
                                    Featured
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 truncate">
                                {result.description}
                              </p>
                            </div>

                            {isSelected && (
                              <div className="flex-shrink-0 flex items-center gap-1 text-emerald-600">
                                <CornerDownLeft className="h-4 w-4" />
                              </div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border rounded shadow-sm font-mono">
                <ChevronUp className="h-3 w-3" />
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-white border rounded shadow-sm font-mono">
                <ChevronDown className="h-3 w-3" />
              </kbd>
              <span className="ml-1">Navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border rounded shadow-sm font-mono">
                <CornerDownLeft className="h-3 w-3" />
              </kbd>
              <span className="ml-1">Select</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Powered by</span>
            <span className="font-medium text-emerald-600">CSOAI</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Search trigger button component for Header
export function GlobalSearchTrigger({ onClick }: { onClick?: () => void }) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toLowerCase().includes('mac'));
  }, []);

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 transition-colors"
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline">Search</span>
      <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-white rounded border text-xs text-gray-400 font-mono">
        {isMac ? <Command className="h-3 w-3" /> : 'Ctrl'}
        <span>K</span>
      </kbd>
    </button>
  );
}

export default GlobalSearch;
