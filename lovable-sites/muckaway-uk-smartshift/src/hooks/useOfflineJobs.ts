import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OfflineJob {
  id: string;
  material_type: string;
  site_address: string;
  status: string;
  volume_tonnes: number;
  created_at: string;
  scheduled_date?: string;
  notes?: string;
  synced: boolean;
  offline_created?: boolean;
}

interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'complete';
  jobId: string;
  data: Partial<OfflineJob>;
  timestamp: number;
}

const OFFLINE_JOBS_KEY = 'muckaway_offline_jobs';
const PENDING_ACTIONS_KEY = 'muckaway_pending_actions';
const LAST_SYNC_KEY = 'muckaway_last_sync';

export const useOfflineJobs = () => {
  const { toast } = useToast();
  const [offlineJobs, setOfflineJobs] = useState<OfflineJob[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Load cached data on mount
  useEffect(() => {
    const loadCachedData = () => {
      try {
        const cachedJobs = localStorage.getItem(OFFLINE_JOBS_KEY);
        const cachedActions = localStorage.getItem(PENDING_ACTIONS_KEY);
        const cachedLastSync = localStorage.getItem(LAST_SYNC_KEY);
        
        if (cachedJobs) {
          setOfflineJobs(JSON.parse(cachedJobs));
        }
        if (cachedActions) {
          setPendingActions(JSON.parse(cachedActions));
        }
        if (cachedLastSync) {
          setLastSyncTime(new Date(cachedLastSync));
        }
      } catch (error) {
        console.error('Error loading cached data:', error);
      }
    };
    
    loadCachedData();
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back Online",
        description: "Syncing pending changes...",
      });
      syncPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Offline Mode",
        description: "Changes will be saved locally and synced when online.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingActions]);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(OFFLINE_JOBS_KEY, JSON.stringify(offlineJobs));
  }, [offlineJobs]);

  useEffect(() => {
    localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(pendingActions));
  }, [pendingActions]);

  // Fetch and cache jobs from server
  const fetchAndCacheJobs = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const jobsWithSyncFlag = (data || []).map(job => ({
        ...job,
        synced: true,
        offline_created: false
      }));

      setOfflineJobs(jobsWithSyncFlag);
      setLastSyncTime(new Date());
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      
      return jobsWithSyncFlag;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      // Return cached data on error
      return offlineJobs;
    }
  }, [offlineJobs]);

  // Add pending action
  const addPendingAction = useCallback((action: Omit<PendingAction, 'id' | 'timestamp'>) => {
    const newAction: PendingAction = {
      ...action,
      id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    setPendingActions(prev => [...prev, newAction]);
    return newAction;
  }, []);

  // Create job (works offline)
  const createJob = useCallback(async (jobData: Partial<OfflineJob>) => {
    const tempId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newJob: OfflineJob = {
      id: tempId,
      material_type: jobData.material_type || 'unknown',
      site_address: jobData.site_address || '',
      status: 'pending',
      volume_tonnes: jobData.volume_tonnes || 0,
      created_at: new Date().toISOString(),
      scheduled_date: jobData.scheduled_date,
      notes: jobData.notes,
      synced: false,
      offline_created: true
    };

    // Add to local state immediately
    setOfflineJobs(prev => [newJob, ...prev]);

    if (isOnline) {
      // Try to create on server
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
          .from('jobs')
          .insert([{
            user_id: user.id,
            material_type: newJob.material_type,
            site_address: newJob.site_address,
            status: newJob.status,
            volume_tonnes: newJob.volume_tonnes,
            scheduled_date: newJob.scheduled_date,
            notes: newJob.notes
          }])
          .select()
          .single();

        if (error) throw error;

        // Update with server ID
        setOfflineJobs(prev => prev.map(j => 
          j.id === tempId ? { ...j, id: data.id, synced: true, offline_created: false } : j
        ));
        
        return data;
      } catch (error) {
        console.error('Error creating job online:', error);
        // Queue for later sync
        addPendingAction({ type: 'create', jobId: tempId, data: newJob });
        toast({
          title: "Saved Offline",
          description: "Job will be synced when connection is restored.",
        });
        return newJob;
      }
    } else {
      // Queue for sync when online
      addPendingAction({ type: 'create', jobId: tempId, data: newJob });
      toast({
        title: "Saved Offline",
        description: "Job will be synced when connection is restored.",
      });
      return newJob;
    }
  }, [isOnline, addPendingAction, toast]);

  // Update job status (works offline)
  const updateJobStatus = useCallback(async (jobId: string, status: string, notes?: string) => {
    // Update locally first
    setOfflineJobs(prev => prev.map(j => 
      j.id === jobId ? { ...j, status, notes: notes || j.notes, synced: false } : j
    ));

    if (isOnline) {
      try {
        const { error } = await supabase
          .from('jobs')
          .update({ status, notes, updated_at: new Date().toISOString() })
          .eq('id', jobId);

        if (error) throw error;

        setOfflineJobs(prev => prev.map(j => 
          j.id === jobId ? { ...j, synced: true } : j
        ));
      } catch (error) {
        console.error('Error updating job:', error);
        addPendingAction({ type: 'update', jobId, data: { status, notes } });
      }
    } else {
      addPendingAction({ type: 'update', jobId, data: { status, notes } });
    }
  }, [isOnline, addPendingAction]);

  // Complete job (works offline)
  const completeJob = useCallback(async (jobId: string, completionNotes?: string) => {
    const completedAt = new Date().toISOString();
    
    setOfflineJobs(prev => prev.map(j => 
      j.id === jobId ? { 
        ...j, 
        status: 'completed', 
        notes: completionNotes || j.notes,
        synced: false 
      } : j
    ));

    if (isOnline) {
      try {
        const { error } = await supabase
          .from('jobs')
          .update({ 
            status: 'completed', 
            completed_date: completedAt,
            notes: completionNotes
          })
          .eq('id', jobId);

        if (error) throw error;

        setOfflineJobs(prev => prev.map(j => 
          j.id === jobId ? { ...j, synced: true } : j
        ));
        
        toast({
          title: "Job Completed",
          description: "Job marked as completed and synced.",
        });
      } catch (error) {
        console.error('Error completing job:', error);
        addPendingAction({ type: 'complete', jobId, data: { status: 'completed', notes: completionNotes } });
      }
    } else {
      addPendingAction({ type: 'complete', jobId, data: { status: 'completed', notes: completionNotes } });
      toast({
        title: "Job Completed (Offline)",
        description: "Will sync when back online.",
      });
    }
  }, [isOnline, addPendingAction, toast]);

  // Sync pending actions
  const syncPendingActions = useCallback(async () => {
    if (!isOnline || pendingActions.length === 0) return;

    setIsSyncing(true);
    const actionsToSync = [...pendingActions];
    const failedActions: PendingAction[] = [];

    for (const action of actionsToSync) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        switch (action.type) {
          case 'create':
            const { data: newJob, error: createError } = await supabase
              .from('jobs')
              .insert([{
                user_id: user.id,
                material_type: action.data.material_type,
                site_address: action.data.site_address,
                status: action.data.status,
                volume_tonnes: action.data.volume_tonnes,
                scheduled_date: action.data.scheduled_date,
                notes: action.data.notes
              }])
              .select()
              .single();

            if (createError) throw createError;
            
            // Update local job with server ID
            setOfflineJobs(prev => prev.map(j => 
              j.id === action.jobId ? { ...j, id: newJob.id, synced: true, offline_created: false } : j
            ));
            break;

          case 'update':
          case 'complete':
            const { error: updateError } = await supabase
              .from('jobs')
              .update(action.data)
              .eq('id', action.jobId);

            if (updateError) throw updateError;
            
            setOfflineJobs(prev => prev.map(j => 
              j.id === action.jobId ? { ...j, ...action.data, synced: true } : j
            ));
            break;
        }
      } catch (error) {
        console.error('Error syncing action:', action, error);
        failedActions.push(action);
      }
    }

    setPendingActions(failedActions);
    setIsSyncing(false);
    setLastSyncTime(new Date());
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

    if (failedActions.length === 0) {
      toast({
        title: "Sync Complete",
        description: `${actionsToSync.length} pending changes synced successfully.`,
      });
    } else {
      toast({
        title: "Partial Sync",
        description: `${actionsToSync.length - failedActions.length} synced, ${failedActions.length} failed.`,
        variant: "destructive",
      });
    }
  }, [isOnline, pendingActions, toast]);

  // Get job by ID (from cache)
  const getJobById = useCallback((jobId: string) => {
    return offlineJobs.find(j => j.id === jobId);
  }, [offlineJobs]);

  // Get pending jobs
  const getPendingJobs = useCallback(() => {
    return offlineJobs.filter(j => j.status === 'pending');
  }, [offlineJobs]);

  // Get today's jobs
  const getTodaysJobs = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return offlineJobs.filter(j => 
      j.scheduled_date?.startsWith(today) || j.created_at.startsWith(today)
    );
  }, [offlineJobs]);

  return {
    // State
    jobs: offlineJobs,
    pendingActions,
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingCount: pendingActions.length,
    unsyncedCount: offlineJobs.filter(j => !j.synced).length,
    
    // Actions
    fetchAndCacheJobs,
    createJob,
    updateJobStatus,
    completeJob,
    syncPendingActions,
    
    // Getters
    getJobById,
    getPendingJobs,
    getTodaysJobs,
  };
};

export default useOfflineJobs;
