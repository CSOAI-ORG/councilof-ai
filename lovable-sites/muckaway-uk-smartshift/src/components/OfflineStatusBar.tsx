import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOfflineJobs } from '@/hooks/useOfflineJobs';

interface OfflineStatusBarProps {
  className?: string;
  compact?: boolean;
}

export const OfflineStatusBar: React.FC<OfflineStatusBarProps> = ({ 
  className,
  compact = false 
}) => {
  const { 
    isOnline, 
    isSyncing, 
    pendingCount, 
    unsyncedCount, 
    lastSyncTime,
    syncPendingActions,
    fetchAndCacheJobs
  } = useOfflineJobs();

  const handleSync = async () => {
    if (isOnline) {
      await syncPendingActions();
      await fetchAndCacheJobs();
    }
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    const now = new Date();
    const diff = now.getTime() - lastSyncTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return lastSyncTime.toLocaleDateString();
  };

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Badge 
          variant={isOnline ? 'default' : 'destructive'}
          className={cn(
            'flex items-center gap-1',
            isOnline ? 'bg-green-500/10 text-green-500 border-green-500/30' : ''
          )}
        >
          {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {isOnline ? 'Online' : 'Offline'}
        </Badge>
        {pendingCount > 0 && (
          <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
            {pendingCount} pending
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-center justify-between p-3 rounded-lg border',
      isOnline ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20',
      className
    )}>
      <div className="flex items-center gap-3">
        {/* Connection Status */}
        <div className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full',
          isOnline ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
        )}>
          {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          <span className="text-sm font-medium">{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* Sync Status */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {pendingCount > 0 ? (
            <div className="flex items-center gap-1 text-yellow-500">
              <CloudOff className="h-4 w-4" />
              <span>{pendingCount} pending sync</span>
            </div>
          ) : unsyncedCount > 0 ? (
            <div className="flex items-center gap-1 text-yellow-500">
              <Cloud className="h-4 w-4" />
              <span>{unsyncedCount} unsynced</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-green-500">
              <CheckCircle className="h-4 w-4" />
              <span>All synced</span>
            </div>
          )}

          <span className="text-muted-foreground">
            Last sync: {formatLastSync()}
          </span>
        </div>
      </div>

      {/* Sync Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={!isOnline || isSyncing}
        className="flex items-center gap-2"
      >
        <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
        {isSyncing ? 'Syncing...' : 'Sync Now'}
      </Button>
    </div>
  );
};

export default OfflineStatusBar;
