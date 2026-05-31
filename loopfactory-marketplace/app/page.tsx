"use client";

import { useState } from "react";
import { ArrowRight, Sparkles, Shield, Users, Egg, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/SearchBar";
import { ProductCard } from "@/components/ProductCard";
import { CharacterCard } from "@/components/CharacterCard";
import { PRODUCTS, CHARACTER_PRODUCTS } from "@/lib/mockData";

export default function HomePage() {
  const [search, setSearch] = useState("");
  const featured = PRODUCTS.slice(0, 4);
  const characters = CHARACTER_PRODUCTS.slice(0, 8);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative border-b bg-muted/30">
        <div className="container flex flex-col items-center justify-center gap-6 py-24 text-center md:py-32">
          <div className="inline-flex items-center rounded-full border bg-background px-3 py-1 text-sm font-medium">
            <Sparkles className="mr-2 h-4 w-4 text-sovereign" />
            Universal AI Agent + Character Marketplace
          </div>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Discover, Audit & Deploy{" "}
            <span className="text-sovereign">AI Agents</span>
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            The premier marketplace for MCP servers, A2A agents, ACP policies,
            and MEOK characters. Every listing POAI verified.
          </p>
          <div className="w-full max-w-lg">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search MCPs, agents, characters, bundles..."
            />
          </div>
          <div className="flex gap-3">
            <Button asChild>
              <a href="/browse">
                Browse Marketplace
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/audit">Submit for Audit</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b">
        <div className="container grid grid-cols-1 gap-6 py-12 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-2 text-center">
            <Shield className="h-8 w-8 text-guardian" />
            <div className="text-3xl font-bold">100%</div>
            <div className="text-sm text-muted-foreground">POAI Verified</div>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <Users className="h-8 w-8 text-scout" />
            <div className="text-3xl font-bold">49+</div>
            <div className="text-sm text-muted-foreground">
              Character Variants
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <Sparkles className="h-8 w-8 text-creator" />
            <div className="text-3xl font-bold">7</div>
            <div className="text-sm text-muted-foreground">
              MEOK Archetypes
            </div>
          </div>
        </div>
      </section>

      {/* Characters Section */}
      <section className="container py-16">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Egg className="h-6 w-6 text-sovereign" />
            <h2 className="text-2xl font-bold tracking-tight">MEOK Characters</h2>
            <span className="text-sm text-muted-foreground">6 stages × 7 archetypes + dragons</span>
          </div>
          <Button variant="ghost" asChild>
            <a href="/characters">View all 49</a>
          </Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {characters.map((char) => (
            <CharacterCard key={char.id} character={char} />
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container py-16 border-t">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Featured</h2>
          <Button variant="ghost" asChild>
            <a href="/browse">View all</a>
          </Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
