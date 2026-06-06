import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Package, Warehouse, TrendingUp, AlertTriangle, Plus, ArrowUpRight, ArrowDownRight, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface StockLevel {
  id: string;
  quantity_tonnes: number;
  min_stock_level: number;
  max_stock_level: number;
  depot: { name: string };
  material_type: { name: string; code: string; category: string };
}

interface RecentMovement {
  id: string;
  movement_type: string;
  quantity_tonnes: number;
  created_at: string;
  depot: { name: string };
  material_type: { name: string };
}

export default function StockOverview() {
  const { user } = useAuth();
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [recentMovements, setRecentMovements] = useState<RecentMovement[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStockData();
    }
  }, [user]);

  const fetchStockData = async () => {
    try {
      // Fetch stock levels with depot and material info
      const { data: levels, error: levelsError } = await supabase
        .from("stock_levels")
        .select(`
          id, quantity_tonnes, min_stock_level, max_stock_level,
          depot:depots(name),
          material_type:material_types(name, code, category, default_sell_price)
        `)
        .order("quantity_tonnes", { ascending: true });

      if (levelsError) throw levelsError;

      // Fetch recent movements
      const { data: movements, error: movementsError } = await supabase
        .from("stock_movements")
        .select(`
          id, movement_type, quantity_tonnes, created_at,
          depot:depots(name),
          material_type:material_types(name)
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (movementsError) throw movementsError;

      setStockLevels(levels || []);
      setRecentMovements(movements || []);

      // Calculate total stock value
      const value = (levels || []).reduce((acc, item: any) => {
        return acc + (item.quantity_tonnes * (item.material_type?.default_sell_price || 0));
      }, 0);
      setTotalValue(value);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      toast.error("Failed to load stock data");
    } finally {
      setLoading(false);
    }
  };

  const lowStockItems = stockLevels.filter(
    (item) => item.quantity_tonnes <= item.min_stock_level
  );

  const getStockPercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Stock Overview</h1>
            <p className="text-muted-foreground">
              Manage your aggregates, materials, and inventory
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/stock/movements">View Movements</Link>
            </Button>
            <Button asChild>
              <Link to="/stock/materials">
                <Plus className="mr-2 h-4 w-4" />
                Add Material
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£{totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Based on sell prices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Material Types</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stockLevels.length}</div>
              <p className="text-xs text-muted-foreground">
                Across all depots
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{lowStockItems.length}</div>
              <p className="text-xs text-muted-foreground">
                Items below minimum
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Depots</CardTitle>
              <Warehouse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(stockLevels.map((s) => s.depot?.name)).size || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Active locations
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Low Stock Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Low Stock Alerts
              </CardTitle>
              <CardDescription>Items that need restocking</CardDescription>
            </CardHeader>
            <CardContent>
              {lowStockItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  All stock levels are healthy
                </p>
              ) : (
                <div className="space-y-4">
                  {lowStockItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.material_type?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.depot?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">
                          {item.quantity_tonnes}t / {item.min_stock_level}t min
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Movements */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Stock Movements</CardTitle>
              <CardDescription>Latest inventory changes</CardDescription>
            </CardHeader>
            <CardContent>
              {recentMovements.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No recent movements
                </p>
              ) : (
                <div className="space-y-4">
                  {recentMovements.slice(0, 5).map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {movement.movement_type === "in" ? (
                          <ArrowDownRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{movement.material_type?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {movement.depot?.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={movement.movement_type === "in" ? "default" : "secondary"}>
                          {movement.movement_type === "in" ? "+" : "-"}
                          {movement.quantity_tonnes}t
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(movement.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stock Levels by Material */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Levels</CardTitle>
            <CardDescription>Current inventory across all depots</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-4">Loading...</p>
            ) : stockLevels.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No stock data yet</p>
                <Button asChild>
                  <Link to="/stock/depots">Add Your First Depot</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {stockLevels.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{item.material_type?.name}</span>
                        <span className="text-muted-foreground ml-2">
                          ({item.material_type?.code})
                        </span>
                        <Badge variant="outline" className="ml-2">
                          {item.depot?.name}
                        </Badge>
                      </div>
                      <span className="text-sm">
                        {item.quantity_tonnes}t / {item.max_stock_level}t
                      </span>
                    </div>
                    <Progress
                      value={getStockPercentage(item.quantity_tonnes, item.max_stock_level)}
                      className={
                        item.quantity_tonnes <= item.min_stock_level
                          ? "[&>div]:bg-destructive"
                          : ""
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Button variant="outline" className="h-20" asChild>
            <Link to="/stock/depots" className="flex flex-col items-center gap-2">
              <Warehouse className="h-6 w-6" />
              <span>Manage Depots</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-20" asChild>
            <Link to="/stock/materials" className="flex flex-col items-center gap-2">
              <Package className="h-6 w-6" />
              <span>Materials Catalog</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-20" asChild>
            <Link to="/stock/movements" className="flex flex-col items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              <span>Stock Movements</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-20" asChild>
            <Link to="/sales" className="flex flex-col items-center gap-2">
              <ArrowUpRight className="h-6 w-6" />
              <span>Aggregate Sales</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-20" asChild>
            <Link to="/purchases" className="flex flex-col items-center gap-2">
              <ArrowDownRight className="h-6 w-6" />
              <span>Purchase Orders</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-20" asChild>
            <Link to="/suppliers" className="flex flex-col items-center gap-2">
              <Building2 className="h-6 w-6" />
              <span>Suppliers</span>
            </Link>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
