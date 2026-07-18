"use client";

import { Star, Shield } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Product, ARCHETYPES } from "@/lib/mockData";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const isCharacter = product.type === "Character";
  const archetypeColor = isCharacter
    ? ARCHETYPES[(product as import("@/lib/mockData").CharacterProduct).archetype].color
    : undefined;

  return (
    <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Badge variant="secondary" className="mb-1">
              {product.type}
            </Badge>
            <h3 className="font-semibold leading-tight tracking-tight">
              {product.name}
            </h3>
            <p className="text-xs text-muted-foreground">{product.author}</p>
          </div>
          {product.poaiVerified && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 border-emerald-500/50 text-emerald-600"
            >
              <Shield className="h-3 w-3" />
              POAI
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {product.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-1">
          {product.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
        {isCharacter && (
          <div className="mt-3 flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: archetypeColor }}
            />
            <span className="text-xs font-medium">{(product as import("@/lib/mockData").CharacterProduct).archetype}</span>
            <span className="text-xs text-muted-foreground">
              Stage {(product as import("@/lib/mockData").CharacterProduct).evolutionStage}
            </span>
          </div>
        )}
        {product.poaiScore && (
          <div className="mt-2 text-xs text-muted-foreground">
            POAI Score: {product.poaiScore}/100
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t bg-muted/40 px-6 py-3">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="text-sm font-medium">{product.rating}</span>
          <span className="text-xs text-muted-foreground">
            ({product.reviewCount})
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">${product.price}</span>
          <Button size="sm" asChild>
            <a href={isCharacter ? `/character/${product.id}` : `/product/${product.id}`}>
              View
            </a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
