import { GanttScheduler } from '@/components/GanttScheduler';
import { RouteOptimizer } from '@/components/RouteOptimizer';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Route } from 'lucide-react';

export default function Schedule() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Resource Scheduler</h1>
          <p className="text-muted-foreground mt-2">
            Plan and manage your fleet schedule with drag-and-drop simplicity
          </p>
        </div>
        
        <Tabs defaultValue="scheduler" className="space-y-6">
          <TabsList>
            <TabsTrigger value="scheduler" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Gantt Scheduler
            </TabsTrigger>
            <TabsTrigger value="route" className="flex items-center gap-2">
              <Route className="h-4 w-4" />
              Route Optimizer
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="scheduler">
            <GanttScheduler />
          </TabsContent>
          
          <TabsContent value="route">
            <div className="max-w-2xl">
              <RouteOptimizer />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
