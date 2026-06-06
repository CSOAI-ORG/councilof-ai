import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Plus, Truck, User } from 'lucide-react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface ScheduleBlock {
  id: string;
  job_id: string | null;
  vehicle_id: string | null;
  driver_id: string | null;
  start_time: string;
  end_time: string;
  block_type: string;
  notes: string | null;
  color: string | null;
}

interface Resource {
  id: string;
  name: string;
  type: 'vehicle' | 'driver';
}

const BLOCK_COLORS: Record<string, string> = {
  job: 'bg-primary/80',
  break: 'bg-secondary/80',
  maintenance: 'bg-yellow-500/80',
  unavailable: 'bg-destructive/80'
};

export function GanttScheduler() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [vehicles, setVehicles] = useState<Resource[]>([]);
  const [drivers, setDrivers] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newBlock, setNewBlock] = useState({
    resource_type: 'vehicle',
    resource_id: '',
    block_type: 'job',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '17:00',
    notes: ''
  });
  const { toast } = useToast();

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const hours = Array.from({ length: 12 }, (_, i) => i + 6); // 6 AM to 6 PM

  useEffect(() => {
    fetchData();
  }, [currentWeekStart]);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const weekEnd = addDays(currentWeekStart, 7);

    const [blocksRes, vehiclesRes, driversRes] = await Promise.all([
      supabase
        .from('schedule_blocks')
        .select('*')
        .gte('start_time', currentWeekStart.toISOString())
        .lte('start_time', weekEnd.toISOString()),
      supabase
        .from('vehicles')
        .select('id, registration, vehicle_type')
        .eq('active', true),
      supabase
        .from('drivers')
        .select('id, name')
        .eq('active', true)
    ]);

    setScheduleBlocks(blocksRes.data || []);
    setVehicles((vehiclesRes.data || []).map(v => ({ id: v.id, name: `${v.registration} (${v.vehicle_type || 'Vehicle'})`, type: 'vehicle' as const })));
    setDrivers((driversRes.data || []).map(d => ({ id: d.id, name: d.name, type: 'driver' as const })));
    setLoading(false);
  };

  const handleAddBlock = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const startDateTime = new Date(`${newBlock.start_date}T${newBlock.start_time}`);
    const endDateTime = new Date(`${newBlock.start_date}T${newBlock.end_time}`);

    const { error } = await supabase
      .from('schedule_blocks')
      .insert({
        vehicle_id: newBlock.resource_type === 'vehicle' ? newBlock.resource_id : null,
        driver_id: newBlock.resource_type === 'driver' ? newBlock.resource_id : null,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        block_type: newBlock.block_type,
        notes: newBlock.notes || null,
        user_id: session.user.id
      });

    if (error) {
      toast({ title: 'Error', description: 'Failed to add schedule block', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Schedule block added' });
      setIsAddDialogOpen(false);
      fetchData();
    }
  };

  const getBlocksForResourceAndDay = (resourceId: string, resourceType: 'vehicle' | 'driver', day: Date) => {
    return scheduleBlocks.filter(block => {
      const blockDate = parseISO(block.start_time);
      const matchesResource = resourceType === 'vehicle' 
        ? block.vehicle_id === resourceId 
        : block.driver_id === resourceId;
      return matchesResource && isSameDay(blockDate, day);
    });
  };

  const getBlockPosition = (block: ScheduleBlock) => {
    const start = parseISO(block.start_time);
    const end = parseISO(block.end_time);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    
    const left = ((startHour - 6) / 12) * 100;
    const width = ((endHour - startHour) / 12) * 100;
    
    return { left: `${Math.max(0, left)}%`, width: `${Math.min(100 - left, width)}%` };
  };

  const allResources = [...vehicles, ...drivers];

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading schedule...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Resource Scheduler
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[200px] text-center">
              {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
            </span>
            <Button variant="outline" size="icon" onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Block</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Schedule Block</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Resource Type</Label>
                      <Select value={newBlock.resource_type} onValueChange={(v) => setNewBlock({ ...newBlock, resource_type: v, resource_id: '' })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vehicle">Vehicle</SelectItem>
                          <SelectItem value="driver">Driver</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Resource</Label>
                      <Select value={newBlock.resource_id} onValueChange={(v) => setNewBlock({ ...newBlock, resource_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          {(newBlock.resource_type === 'vehicle' ? vehicles : drivers).map(r => (
                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Block Type</Label>
                    <Select value={newBlock.block_type} onValueChange={(v) => setNewBlock({ ...newBlock, block_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="job">Job</SelectItem>
                        <SelectItem value="break">Break</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="unavailable">Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={newBlock.start_date} onChange={(e) => setNewBlock({ ...newBlock, start_date: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Time</Label>
                      <Input type="time" value={newBlock.start_time} onChange={(e) => setNewBlock({ ...newBlock, start_time: e.target.value })} />
                    </div>
                    <div>
                      <Label>End Time</Label>
                      <Input type="time" value={newBlock.end_time} onChange={(e) => setNewBlock({ ...newBlock, end_time: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Input value={newBlock.notes} onChange={(e) => setNewBlock({ ...newBlock, notes: e.target.value })} placeholder="Optional notes..." />
                  </div>
                  <Button onClick={handleAddBlock} className="w-full">Add Block</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            {/* Header row with days */}
            <div className="grid grid-cols-8 gap-1 mb-2">
              <div className="font-medium text-sm p-2">Resource</div>
              {weekDays.map(day => (
                <div key={day.toISOString()} className="text-center p-2 font-medium text-sm">
                  <div>{format(day, 'EEE')}</div>
                  <div className="text-muted-foreground">{format(day, 'MMM d')}</div>
                </div>
              ))}
            </div>

            {/* Resource rows */}
            {allResources.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No vehicles or drivers found. Add resources to start scheduling.
              </div>
            ) : (
              allResources.map(resource => (
                <div key={resource.id} className="grid grid-cols-8 gap-1 border-t py-2">
                  <div className="flex items-center gap-2 p-2 text-sm">
                    {resource.type === 'vehicle' ? <Truck className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    <span className="truncate">{resource.name}</span>
                  </div>
                  {weekDays.map(day => {
                    const blocks = getBlocksForResourceAndDay(resource.id, resource.type, day);
                    return (
                      <div key={day.toISOString()} className="relative h-12 bg-muted/30 rounded">
                        {blocks.map(block => {
                          const pos = getBlockPosition(block);
                          return (
                            <div
                              key={block.id}
                              className={`absolute top-1 bottom-1 rounded text-xs text-white flex items-center justify-center overflow-hidden ${BLOCK_COLORS[block.block_type] || BLOCK_COLORS.job}`}
                              style={{ left: pos.left, width: pos.width }}
                              title={block.notes || block.block_type}
                            >
                              <span className="truncate px-1">{block.block_type}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 pt-4 border-t">
          {Object.entries(BLOCK_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2 text-sm">
              <div className={`w-4 h-4 rounded ${color}`} />
              <span className="capitalize">{type}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
