import { Egg, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CharacterCard } from "@/components/CharacterCard";
import { CHARACTER_PRODUCTS, STAGES, ARCHETYPES } from "@/lib/mockData";

export default function CharactersPage() {
  const eggs = CHARACTER_PRODUCTS.filter((c) => c.stage === "egg");
  const dragons = CHARACTER_PRODUCTS.filter((c) => c.isDragon);
  const mature = CHARACTER_PRODUCTS.filter((c) => c.stage === "mature" && !c.isDragon);

  return (
    <div className="container py-16">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium mb-4">
          <Egg className="h-4 w-4 text-sovereign" />
          MEOK Character Collection
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          49 Unique Character Variants
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          7 archetypes × 6 emergence stages + 7 dragon variants. 
          Each with unique materials, shaders, and color-shifting properties.
          All POAI verified with CharacterGenesis SBT.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {Object.entries(ARCHETYPES).map(([name, info]) => (
          <Button
            key={name}
            variant="outline"
            size="sm"
            className="gap-1"
            style={{ borderColor: info.color }}
          >
            <span style={{ color: info.color }}>{info.symbol}</span>
            {name}
          </Button>
        ))}
        <Button variant="outline" size="sm" className="gap-1 border-red-400">
          <span>🐉</span> Dragons
        </Button>
      </div>

      {/* Stage breakdown */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-6">By Emergence Stage</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6 mb-8">
          {STAGES.map((stage) => {
            const count = CHARACTER_PRODUCTS.filter((c) => c.stage === stage).length;
            return (
              <div key={stage} className="rounded-lg border p-4 text-center">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-muted-foreground capitalize">{stage}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Egg collection (free tier) */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">🥚 Egg Collection — Start Your Journey</h2>
          <span className="text-sm text-muted-foreground">£0.99 each</span>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {eggs.map((char) => (
            <CharacterCard key={char.id} character={char} />
          ))}
        </div>
      </div>

      {/* Mature collection */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">🌟 Mature Collection — Fully Developed</h2>
          <span className="text-sm text-muted-foreground">£9.99 each</span>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {mature.map((char) => (
            <CharacterCard key={char.id} character={char} />
          ))}
        </div>
      </div>

      {/* Dragon collection */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">🐉 Dragon Variants — Rare & Powerful</h2>
          <span className="text-sm text-muted-foreground">£14.99 each</span>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {dragons.map((char) => (
            <CharacterCard key={char.id} character={char} />
          ))}
        </div>
      </div>

      {/* Full collection */}
      <div className="rounded-2xl border bg-muted/30 p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Complete Collection</h2>
        <p className="text-muted-foreground mb-4">
          All 49 character variants — every stage, every archetype, all dragons.
          Includes exclusive "Full Sovereign" ascended forms.
        </p>
        <div className="flex items-center justify-center gap-4">
          <div className="text-3xl font-bold">£299</div>
          <Button size="lg">Acquire Full Collection</Button>
        </div>
      </div>
    </div>
  );
}
