import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ExternalLink, Play, Settings, Unplug } from 'lucide-react';
import type { IntegrationProvider } from '@/config/integrationProviders';

interface IntegrationCardProps {
  provider: IntegrationProvider;
  isConnected?: boolean;
  lastSync?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onSettings?: () => void;
  variant?: 'public' | 'dashboard';
}

export function IntegrationCard({
  provider,
  isConnected = false,
  lastSync,
  onConnect,
  onDisconnect,
  onSettings,
  variant = 'public',
}: IntegrationCardProps) {
  if (variant === 'dashboard') {
    return (
      <Card className={`transition-all ${isConnected ? 'border-primary/50 bg-primary/5' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{provider.icon}</span>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {provider.name}
                  {isConnected && (
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-xs">
                      <Check className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-sm">{provider.description}</CardDescription>
              </div>
            </div>
            {provider.popular && !isConnected && (
              <Badge variant="outline" className="text-primary border-primary">Popular</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <>
              <div className="text-sm text-muted-foreground">
                Last sync: {lastSync || 'Never'}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onSettings}>
                  <Settings className="w-4 h-4 mr-1" />
                  Settings
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onDisconnect}>
                  <Unplug className="w-4 h-4 mr-1" />
                  Disconnect
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm">
                <span className="text-muted-foreground">Setup: </span>
                <span>{provider.setupTime}</span>
              </div>
              <Button className="w-full" onClick={onConnect}>
                Connect {provider.name}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Public variant
  return (
    <Card className="hover:border-primary/50 transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{provider.icon}</span>
            <div>
              <CardTitle className="text-lg">{provider.name}</CardTitle>
              <CardDescription className="text-sm">{provider.description}</CardDescription>
            </div>
          </div>
          {provider.popular && (
            <Badge variant="outline" className="text-primary border-primary">Popular</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Syncs:</p>
          <div className="flex flex-wrap gap-1">
            {provider.syncs.map((sync) => (
              <Badge key={sync} variant="secondary" className="text-xs">{sync}</Badge>
            ))}
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Setup: </span>
            <span>{provider.setupTime}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Smart Feature: </span>
            <span className="text-primary">{provider.smartFeature}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Migration: </span>
            <span>{provider.migration}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button className="flex-1">
            Connect {provider.name}
          </Button>
          <Button variant="outline" size="icon">
            <Play className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
