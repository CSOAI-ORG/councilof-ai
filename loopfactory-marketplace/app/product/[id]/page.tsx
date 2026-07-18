"use client";

import { useParams } from "next/navigation";
import { Star, Shield, Tag, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProductById } from "@/lib/mockData";

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const product = getProductById(id);

  if (!product) {
    return (
      <div className="container py-24 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <p className="text-muted-foreground">
          The product you are looking for does not exist.
        </p>
        <Button className="mt-4" asChild>
          <a href="/browse">Back to Browse</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <a
          href="/browse"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Browse
        </a>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* 3D Preview Placeholder */}
        <div className="flex aspect-square items-center justify-center rounded-xl border bg-muted/30">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
              <Tag className="h-10 w-10 text-primary" />
            </div>
            <p className="text-lg font-medium">3D Preview Placeholder</p>
            <p className="text-sm text-muted-foreground">
              Three.js canvas integration ready
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="secondary">{product.type}</Badge>
              {product.poaiVerified && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 border-emerald-500/50 text-emerald-600"
                >
                  <Shield className="h-3 w-3" />
                  POAI Verified
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {product.name}
            </h1>
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {product.author}
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {product.rating} ({product.reviewCount} reviews)
              </span>
            </div>
          </div>

          <p className="text-muted-foreground">{product.description}</p>

          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>

          {product.poaiScore && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">POAI Audit Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold text-emerald-600">
                    {product.poaiScore}
                  </div>
                  <div className="text-sm text-muted-foreground">/ 100</div>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${product.poaiScore}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-4 pt-4">
            <span className="text-3xl font-bold">${product.price}</span>
            <Button size="lg">Add to Cart</Button>
            <Button variant="outline" size="lg">
              Contact Author
            </Button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <h2 className="mb-6 text-xl font-bold">Reviews</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="mb-2 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={`h-4 w-4 ${
                        idx < Math.floor(product.rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  &ldquo;Excellent {product.type.toLowerCase()} with solid
                  documentation and reliable performance. Highly
                  recommended.&rdquo;
                </p>
                <p className="mt-3 text-xs font-medium">
                  Verified Buyer #{i}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
