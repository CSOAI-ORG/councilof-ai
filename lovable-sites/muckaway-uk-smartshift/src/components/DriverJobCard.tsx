import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, MapPin, Camera, Check, Clock, Navigation, 
  Phone, ChevronRight, Package, Play, CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useImageCompression } from "@/hooks/useImageCompression";

interface Job {
  id: string;
  site_address: string;
  site_postcode: string;
  material_type: string;
  volume_tonnes: number;
  status: string;
  scheduled_date: string;
  customer?: {
    company_name: string;
    contact_name: string;
    phone: string;
  };
}

interface DriverJobCardProps {
  job: Job;
  isOnline: boolean;
  currentLocation: GeolocationCoordinates | null;
  onStatusUpdate: (jobId: string, status: string) => void;
  onGPSCheckin: (jobId: string) => void;
}

const STATUS_FLOW = {
  pending: { next: 'en_route', label: 'Start Route', icon: Play },
  en_route: { next: 'arrived', label: 'Arrived', icon: MapPin },
  arrived: { next: 'loading', label: 'Start Loading', icon: Truck },
  loading: { next: 'in_transit', label: 'Depart Site', icon: Navigation },
  in_transit: { next: 'delivered', label: 'Delivered', icon: CheckCircle2 },
  delivered: { next: 'completed', label: 'Complete Job', icon: Check },
  completed: { next: null, label: 'Completed', icon: Check },
  in_progress: { next: 'completed', label: 'Complete', icon: Check },
};

export const DriverJobCard = ({ 
  job, 
  isOnline, 
  currentLocation,
  onStatusUpdate,
  onGPSCheckin
}: DriverJobCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { compressAndConvertToBase64, isCompressing } = useImageCompression({
    maxSizeMB: 0.1, // 100KB for 2G networks
    maxWidthOrHeight: 1024,
  });

  const statusInfo = STATUS_FLOW[job.status as keyof typeof STATUS_FLOW] || STATUS_FLOW.pending;
  const NextIcon = statusInfo.icon;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'in_transit':
      case 'en_route':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'loading':
      case 'arrived':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const compressed = await compressAndConvertToBase64(file);
    if (compressed) {
      setUploadedPhotos([...uploadedPhotos, compressed]);
      toast({
        title: "Photo Added",
        description: isOnline ? "Photo uploaded" : "Queued for sync",
      });
    }
  };

  const handleNavigation = () => {
    const address = encodeURIComponent(`${job.site_address}, ${job.site_postcode}`);
    // Use Google Maps for navigation (works on both iOS and Android)
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank');
  };

  const handleCall = () => {
    if (job.customer?.phone) {
      window.location.href = `tel:${job.customer.phone}`;
    }
  };

  return (
    <Card className="bg-card border-border shadow-sm overflow-hidden">
      <CardHeader 
        className="pb-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={getStatusColor(job.status)}>
                {job.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {job.volume_tonnes}t
              </span>
            </div>
            <CardTitle className="text-base line-clamp-1">
              {job.customer?.company_name || 'Job'}
            </CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-1 flex items-center gap-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              {job.site_postcode}
            </p>
          </div>
          <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-2 space-y-4">
          {/* Full Address */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm font-medium mb-1">Delivery Address</p>
            <p className="text-sm text-muted-foreground">{job.site_address}</p>
            <p className="text-sm text-muted-foreground">{job.site_postcode}</p>
          </div>

          {/* Material Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Material</p>
              <p className="text-sm font-medium capitalize">{job.material_type}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Weight</p>
              <p className="text-sm font-medium">{job.volume_tonnes} tonnes</p>
            </div>
          </div>

          {/* Customer Contact */}
          {job.customer && (
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
              <div>
                <p className="text-sm font-medium">{job.customer.contact_name}</p>
                <p className="text-xs text-muted-foreground">{job.customer.phone}</p>
              </div>
              {job.customer.phone && (
                <Button variant="outline" size="sm" onClick={handleCall}>
                  <Phone className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Photo Upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />
            <Button 
              variant="outline" 
              className="w-full h-12"
              onClick={() => fileInputRef.current?.click()}
              disabled={isCompressing}
            >
              <Camera className="h-4 w-4 mr-2" />
              {isCompressing ? 'Compressing...' : `Take Photo ${uploadedPhotos.length > 0 ? `(${uploadedPhotos.length})` : ''}`}
            </Button>
          </div>

          {/* Photo Previews */}
          {uploadedPhotos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {uploadedPhotos.map((photo, i) => (
                <img 
                  key={i}
                  src={photo}
                  alt={`Photo ${i + 1}`}
                  className="h-16 w-16 object-cover rounded-lg flex-shrink-0"
                />
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="h-14"
              onClick={handleNavigation}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Navigate
            </Button>

            <Button 
              variant="outline" 
              className="h-14"
              onClick={() => onGPSCheckin(job.id)}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Check In
            </Button>
          </div>

          {/* Primary Action */}
          {statusInfo.next && (
            <Button 
              className="w-full h-14 text-base"
              onClick={() => onStatusUpdate(job.id, statusInfo.next!)}
            >
              <NextIcon className="h-5 w-5 mr-2" />
              {statusInfo.label}
            </Button>
          )}

          {job.status === 'completed' && (
            <div className="text-center text-sm text-green-600 dark:text-green-400 py-2">
              <Check className="h-5 w-5 inline mr-1" />
              Job Completed
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default DriverJobCard;
