"use client";

import { useState, useMemo } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/SearchBar";
import { ProductCard } from "@/components/ProductCard";
import { FilterSidebar, type Filters } from "@/components/FilterSidebar";
import { PRODUCTS } from "@/lib/mockData";

export default function BrowsePage() {
  const [search, setSearch] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    protocolType: "All",
    minPrice: 0,
    maxPrice: 1000,
    poaiStatus: "All",
    category: "All",
  });

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const matchesSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

      const matchesType =
        filters.protocolType === "All" || p.type === filters.protocolType;

      const matchesPrice =
        p.price >= filters.minPrice && p.price <= filters.maxPrice;

      const matchesPoai =
        filters.poaiStatus === "All" ||
        (filters.poaiStatus === "Verified" && p.poaiVerified) ||
        (filters.poaiStatus === "Unverified" && !p.poaiVerified);

      const matchesCategory =
        filters.category === "All" || p.category === filters.category;

      return (
        matchesSearch &&
        matchesType &&
        matchesPrice &&
        matchesPoai &&
        matchesCategory
      );
    });
  }, [search, filters]);

  return (
    <div className="container py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Browse</h1>
        <div className="flex items-center gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search products..."
            className="w-64"
          />
          <Button
            variant="outline"
            className="sm:hidden"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 sm:block">
          <FilterSidebar filters={filters} onChange={setFilters} />
        </aside>

        {/* Mobile sidebar */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur sm:hidden" onClick={() => setMobileFiltersOpen(false)}>
            <div
              className="absolute left-0 top-0 h-full w-72 border-r bg-background p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <FilterSidebar filters={filters} onChange={setFilters} />
            </div>
          </div>
        )}

        <div className="flex-1">
          <div className="mb-4 text-sm text-muted-foreground">
            {filteredProducts.length} result
            {filteredProducts.length !== 1 ? "s" : ""}
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm">Try adjusting your filters or search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
