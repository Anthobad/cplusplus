import React, { useState, useMemo, useRef, useEffect } from "react";
import { X, Search, BookOpen, ExternalLink, Code2, AlertTriangle, Clock, Layers, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { CPP_DOCS } from "../data/cppDocs";
import { CppDocItem } from "../types";

interface CppDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  All: "All Items",
  algorithm: "<algorithm>",
  string: "<string>",
  iterator: "<iterator>",
  cmath: "<cmath>",
  cctype: "<cctype>",
  regex: "<regex>",
  containers: "Containers",
  smart_pointers: "Smart Pointers",
  utilities: "Modern Types",
  concurrency: "Concurrency"
};

export const CppDocsModal: React.FC<CppDocsModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedDocName, setSelectedDocName] = useState<string>(CPP_DOCS[0]?.name || "");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position for indicator arrows
  const checkTabScroll = () => {
    const el = tabsContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };

  // Enable mouse wheel horizontal scrolling on PC and track scroll bounds
  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // If user is vertically scrolling with mouse wheel and not already horizontally scrolling
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && e.deltaY !== 0) {
        // Prevent page/modal vertical jump when scrolling tabs
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("scroll", checkTabScroll, { passive: true });
    window.addEventListener("resize", checkTabScroll);

    // Initial check
    checkTabScroll();
    const timer = setTimeout(checkTabScroll, 100);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("scroll", checkTabScroll);
      window.removeEventListener("resize", checkTabScroll);
      clearTimeout(timer);
    };
  }, [isOpen]);

  const scrollTabs = (direction: "left" | "right") => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const scrollAmount = 240;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    });
  };

  // Auto-focus search input on modal open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Clean query and extract sub-tokens
  const cleanQuery = searchQuery.trim().toLowerCase();
  const queryTokens = useMemo(() => {
    return cleanQuery
      .split(/[\s,_\-:]+/)
      .filter(t => t.length > 0);
  }, [cleanQuery]);

  // Handle reversed text input (e.g., typing in RTL keyboard layout)
  const reversedQuery = useMemo(() => {
    if (cleanQuery.length >= 4) {
      return cleanQuery.split("").reverse().join("");
    }
    return "";
  }, [cleanQuery]);

  const reversedTokens = useMemo(() => {
    return reversedQuery
      .split(/[\s,_\-:]+/)
      .filter(t => t.length > 0);
  }, [reversedQuery]);

  // Smart multi-token and fuzzy matching across documentation
  const searchResults = useMemo(() => {
    if (!cleanQuery) {
      return CPP_DOCS;
    }

    const scored = CPP_DOCS.map(doc => {
      const nameLower = doc.name.toLowerCase();
      const headerLower = doc.header.toLowerCase();
      const descLower = doc.description.toLowerCase();
      const synopsisLower = (doc.synopsis || "").toLowerCase();
      const allText = `${nameLower} ${headerLower} ${descLower} ${synopsisLower}`;

      let score = 0;

      // 1. Direct full query matches
      if (nameLower === cleanQuery || headerLower === cleanQuery) {
        score += 100;
      } else if (nameLower.includes(cleanQuery)) {
        score += 80;
      } else if (headerLower.includes(cleanQuery)) {
        score += 70;
      } else if (synopsisLower.includes(cleanQuery)) {
        score += 50;
      } else if (descLower.includes(cleanQuery)) {
        score += 40;
      }

      // 2. Token matches (e.g. "set_variant" has tokens ["set", "variant"])
      if (queryTokens.length > 0) {
        const tokensInNameOrHeader = queryTokens.filter(t => nameLower.includes(t) || headerLower.includes(t)).length;
        const tokensInDoc = queryTokens.filter(t => allText.includes(t)).length;

        if (tokensInDoc === queryTokens.length) {
          score += 45;
        }
        score += tokensInNameOrHeader * 25;
        score += (tokensInDoc - tokensInNameOrHeader) * 10;
      }

      // 3. Reversed query match (catches inverted keyboard typing like noitcesretNi_tetSES)
      if (reversedTokens.length > 0) {
        const revTokensInDoc = reversedTokens.filter(t => allText.includes(t) && t.length >= 3).length;
        if (revTokensInDoc > 0) {
          score += revTokensInDoc * 30;
        }
      }

      return { doc, score };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.doc);
  }, [cleanQuery, queryTokens, reversedTokens]);

  // Identify if any reversed suggestion is found
  const reversedSuggestion = useMemo(() => {
    if (reversedTokens.length > 0) {
      const match = CPP_DOCS.find(d => {
        const all = `${d.name} ${d.header}`.toLowerCase();
        return reversedTokens.some(t => t.length >= 4 && all.includes(t));
      });
      return match ? match.name : null;
    }
    return null;
  }, [reversedTokens]);

  if (!isOpen) return null;

  // Custom ordering for categories to highlight the standard library headers requested
  const priorityOrder = ["All", "algorithm", "string", "iterator", "cmath", "cctype", "regex", "containers", "smart_pointers", "utilities", "concurrency"];
  const existingCategories = Array.from(new Set(CPP_DOCS.map(d => d.category)));
  const orderedCategories = ["All", ...priorityOrder.filter(c => c !== "All" && existingCategories.includes(c)), ...existingCategories.filter(c => !priorityOrder.includes(c))];

  // If a category is selected, filter by it. But if the category yields 0 results while other categories have matches,
  // we intelligently provide results across categories.
  const categoryResults = selectedCategory === "All"
    ? searchResults
    : searchResults.filter(doc => doc.category === selectedCategory);

  const isCrossCategoryFallback = selectedCategory !== "All" && categoryResults.length === 0 && searchResults.length > 0;
  const filteredDocs = isCrossCategoryFallback ? searchResults : categoryResults;

  const selectedDoc: CppDocItem =
    CPP_DOCS.find(d => d.name === selectedDocName) || filteredDocs[0] || CPP_DOCS[0];

  const getReferenceUrl = (doc: CppDocItem) => {
    const cleanHeader = doc.header.replace(/[<>]/g, "");
    return `https://cplusplus.com/reference/${cleanHeader}/`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[88vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  C++ Standard Library & Systems Reference
                </h2>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono font-semibold hidden sm:inline-block">
                  C++11 / C++17 / C++20 / C++23
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {CPP_DOCS.length} Specifications across &lt;algorithm&gt;, &lt;string&gt;, &lt;iterator&gt;, &lt;cmath&gt;, &lt;cctype&gt;, &lt;regex&gt; & Systems Containers
              </p>
            </div>
          </div>
          <button
            id="close-docs-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-900/50 space-y-3">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              id="cpp-docs-search-input"
              ref={searchInputRef}
              type="text"
              dir="ltr"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Search functions, headers, or types (e.g. set, variant, remove_if, isnan, regex)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-left caret-blue-400 selection:bg-blue-600 selection:text-white"
              style={{ colorScheme: "dark" }}
            />
            {searchQuery && (
              <button
                id="clear-cpp-search-btn"
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Clear search query"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category Filter Buttons below the search bar */}
          <div className="relative flex items-center group/tabs">
            {/* Scroll Left Button (desktop convenience) */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollTabs("left")}
                aria-label="Scroll library tabs left"
                className="absolute left-0 z-10 p-1.5 rounded-lg bg-slate-900/95 text-slate-300 hover:text-white border border-slate-700 shadow-lg backdrop-blur-sm transition-all -ml-1 sm:-ml-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}

            {/* Scrollable tabs list with PC mouse wheel support */}
            <div
              ref={tabsContainerRef}
              className="flex items-center space-x-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent scroll-smooth w-full select-none"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgb(51 65 85) transparent"
              }}
            >
              {orderedCategories.map(cat => {
                const label = CATEGORY_LABELS[cat] || cat;
                const count = cat === "All"
                  ? searchResults.length
                  : searchResults.filter(d => d.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-blue-600 text-white shadow-sm font-semibold"
                        : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/80"
                    }`}
                  >
                    <span className={cat.startsWith("<") || cat in CATEGORY_LABELS ? "font-mono text-[11px]" : ""}>{label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      selectedCategory === cat ? "bg-blue-700 text-blue-100" : "bg-slate-900 text-slate-400"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Scroll Right Button (desktop convenience) */}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollTabs("right")}
                aria-label="Scroll library tabs right"
                className="absolute right-0 z-10 p-1.5 rounded-lg bg-slate-900/95 text-slate-300 hover:text-white border border-slate-700 shadow-lg backdrop-blur-sm transition-all -mr-1 sm:-mr-2"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Cross-Category Fallback Notice */}
        {isCrossCategoryFallback && (
          <div className="px-4 py-2 bg-blue-950/50 border-b border-blue-500/30 flex items-center justify-between text-xs text-blue-200">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              Showing results across all categories for "{searchQuery}" (0 matches in {CATEGORY_LABELS[selectedCategory] || selectedCategory}).
            </span>
            <button
              onClick={() => setSelectedCategory("All")}
              className="text-blue-400 hover:underline font-semibold text-[11px]"
            >
              Switch to All Categories
            </button>
          </div>
        )}

        {/* 2-Column Content Layout */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Left Column: List */}
          <div className="w-full sm:w-1/3 border-b sm:border-b-0 sm:border-r border-slate-800 overflow-y-auto p-3 space-y-1.5 bg-slate-950/40 max-h-48 sm:max-h-none">
            {filteredDocs.length === 0 ? (
              <div className="p-4 text-center space-y-3">
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl inline-flex text-slate-400">
                  <Search className="h-5 w-5" />
                </div>
                <p className="text-xs text-slate-300">
                  No matching reference entries found for <span className="font-mono text-white font-semibold">"{searchQuery}"</span>.
                </p>

                {reversedSuggestion && (
                  <div className="p-2.5 bg-blue-950/40 border border-blue-500/30 rounded-xl text-xs text-blue-200 text-left">
                    <span className="block text-slate-400 text-[11px] mb-1">Did you mean to search for:</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery(reversedSuggestion)}
                      className="font-mono text-blue-400 hover:underline font-semibold text-left"
                    >
                      {reversedSuggestion}
                    </button>
                  </div>
                )}

                <div className="pt-2 text-left">
                  <span className="text-[11px] text-slate-400 block mb-2 font-medium">Quick Suggestions:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {["variant", "set", "set_intersection", "vector", "string", "regex", "transform", "sort"].map(term => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          setSelectedCategory("All");
                          setSearchQuery(term);
                        }}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 rounded-lg text-[11px] font-mono transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 underline font-medium pt-1 block mx-auto"
                >
                  Reset filters & search
                </button>
              </div>
            ) : (
              filteredDocs.map(doc => (
                <button
                  key={doc.name}
                  onClick={() => setSelectedDocName(doc.name)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all ${
                    selectedDoc?.name === doc.name
                      ? "bg-blue-600/20 border border-blue-500/40 text-blue-200"
                      : "hover:bg-slate-800/50 text-slate-300 border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-100 font-mono text-xs truncate max-w-[170px]">{doc.name}</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">
                      {doc.header}
                    </span>
                  </div>
                  <p className="text-slate-400 line-clamp-1 text-[11px]">{doc.description}</p>
                </button>
              ))
            )}
          </div>

          {/* Right Column: Detail View */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {selectedDoc ? (
              <div className="space-y-5">
                {/* Title Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white font-mono tracking-tight">{selectedDoc.name}</h3>
                    <div className="flex items-center flex-wrap gap-2 mt-1.5">
                      <code className="text-xs bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-md font-mono">
                        #include {selectedDoc.header}
                      </code>
                      <span className="text-[11px] text-slate-400 capitalize font-medium">
                        Category: {CATEGORY_LABELS[selectedDoc.category] || selectedDoc.category}
                      </span>
                      <a
                        href={getReferenceUrl(selectedDoc)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-[11px] text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-500/30 transition-colors"
                      >
                        <span>cplusplus.com docs</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>
                  <div className="text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0 self-start">
                    <span className="text-slate-400">Header: </span>
                    <span className="text-emerald-400 font-mono font-bold">{selectedDoc.header}</span>
                  </div>
                </div>

                {/* Synopsis */}
                {selectedDoc.synopsis && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-blue-300 overflow-x-auto leading-relaxed">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold mb-1">Standard Declaration / Synopsis</span>
                    {selectedDoc.synopsis}
                  </div>
                )}

                {/* Description */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-blue-400" />
                    Technical Architecture & Mechanics
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {selectedDoc.description}
                  </p>
                </div>

                {/* Time & Space Complexity */}
                {selectedDoc.timeComplexity && (
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start space-x-3">
                    <Clock className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Time & Space Complexity Specifications
                      </span>
                      <span className="text-xs font-mono text-emerald-300 leading-relaxed">
                        {selectedDoc.timeComplexity}
                      </span>
                    </div>
                  </div>
                )}

                {/* Common Pitfalls / Gotchas */}
                {selectedDoc.commonPitfalls && (
                  <div className="p-3.5 rounded-xl bg-amber-950/25 border border-amber-500/35 text-xs text-amber-200 leading-relaxed flex items-start space-x-3">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-400 uppercase tracking-wider block mb-1">
                        Systems Gotchas & Pitfalls
                      </span>
                      <span className="leading-relaxed">{selectedDoc.commonPitfalls}</span>
                    </div>
                  </div>
                )}

                {/* Example Code */}
                {selectedDoc.example && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Code2 className="h-3.5 w-3.5 text-blue-400" />
                        Idiomatic C++ Example
                      </h4>
                    </div>
                    <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                      {selectedDoc.example}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500">Select a component to view details.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
