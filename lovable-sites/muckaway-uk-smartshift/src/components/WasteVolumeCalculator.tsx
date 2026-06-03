import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Ruler, Scale, Truck, Calculator, Share2 } from 'lucide-react';
import { MATERIAL_DENSITIES, MaterialType } from '@/config/pricing';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface WasteVolumeCalculatorProps {
  showCTA?: boolean;
  compact?: boolean;
}

export const WasteVolumeCalculator = ({ showCTA = true, compact = false }: WasteVolumeCalculatorProps) => {
  const navigate = useNavigate();
  const [length, setLength] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [depth, setDepth] = useState<string>('');
  const [materialType, setMaterialType] = useState<MaterialType>('mixed_spoil');
  const [showResults, setShowResults] = useState(false);

  const calculations = useMemo(() => {
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    const d = parseFloat(depth) || 0;
    
    const volumeM3 = l * w * d;
    const density = MATERIAL_DENSITIES[materialType];
    const weightTonnes = volumeM3 * density;
    
    // Assuming 8 tonne average load capacity for grab lorries
    const loadsNeeded = Math.ceil(weightTonnes / 8);
    
    // Price estimate based on weight and material
    const pricePerTonne = materialType === 'concrete' || materialType === 'hardcore' ? 15 : 25;
    const estimatedPrice = weightTonnes * pricePerTonne;
    
    return {
      volumeM3: volumeM3.toFixed(2),
      weightTonnes: weightTonnes.toFixed(2),
      loadsNeeded,
      estimatedPriceMin: Math.round(estimatedPrice * 0.8),
      estimatedPriceMax: Math.round(estimatedPrice * 1.2),
      isValid: l > 0 && w > 0 && d > 0,
    };
  }, [length, width, depth, materialType]);

  const handleCalculate = () => {
    if (calculations.isValid) {
      setShowResults(true);
    }
  };

  const handleShare = async () => {
    const text = `My excavation: ${length}m × ${width}m × ${depth}m
Material: ${materialType.replace('_', ' ')}
Volume: ${calculations.volumeM3}m³
Weight: ${calculations.weightTonnes} tonnes
Loads needed: ${calculations.loadsNeeded}
Estimated: £${calculations.estimatedPriceMin}-${calculations.estimatedPriceMax}

Calculate yours at MuckAway.ai`;

    if (navigator.share) {
      try {
        await navigator.share({ text, title: 'Waste Volume Calculation' });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied to clipboard!', description: 'Share this calculation with your team.' });
    }
  };

  const materialOptions: { value: MaterialType; label: string }[] = [
    { value: 'topsoil', label: 'Topsoil' },
    { value: 'subsoil', label: 'Subsoil' },
    { value: 'clay', label: 'Clay' },
    { value: 'sand', label: 'Sand' },
    { value: 'gravel', label: 'Gravel' },
    { value: 'chalk', label: 'Chalk' },
    { value: 'hardcore', label: 'Hardcore/Rubble' },
    { value: 'concrete', label: 'Concrete' },
    { value: 'mixed_spoil', label: 'Mixed Spoil' },
    { value: 'peat', label: 'Peat' },
  ];

  return (
    <Card className={`border-primary/20 ${compact ? '' : 'bg-card/50 backdrop-blur'}`}>
      <CardHeader className={compact ? 'pb-4' : ''}>
        <CardTitle className="flex items-center gap-2">
          <Ruler className="h-5 w-5 text-primary" />
          {compact ? 'Quick Calculator' : 'Waste Volume Calculator'}
        </CardTitle>
        {!compact && (
          <CardDescription>
            Calculate your spoil volume, weight, and get an instant price estimate
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dimension inputs */}
        <div className={`grid gap-4 ${compact ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3'}`}>
          <div className="space-y-2">
            <Label htmlFor="length" className="text-sm">Length (m)</Label>
            <Input
              id="length"
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g. 10"
              value={length}
              onChange={(e) => {
                setLength(e.target.value);
                setShowResults(false);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="width" className="text-sm">Width (m)</Label>
            <Input
              id="width"
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g. 5"
              value={width}
              onChange={(e) => {
                setWidth(e.target.value);
                setShowResults(false);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="depth" className="text-sm">Depth (m)</Label>
            <Input
              id="depth"
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g. 2"
              value={depth}
              onChange={(e) => {
                setDepth(e.target.value);
                setShowResults(false);
              }}
            />
          </div>
        </div>

        {/* Material type */}
        <div className="space-y-2">
          <Label className="text-sm">Material Type</Label>
          <Select
            value={materialType}
            onValueChange={(value) => {
              setMaterialType(value as MaterialType);
              setShowResults(false);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select material type" />
            </SelectTrigger>
            <SelectContent>
              {materialOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Calculate button */}
        <Button 
          className="w-full" 
          onClick={handleCalculate}
          disabled={!calculations.isValid}
        >
          <Calculator className="h-4 w-4 mr-2" />
          Calculate Volume
        </Button>

        {/* Results */}
        {showResults && calculations.isValid && (
          <div className="space-y-4 pt-4 border-t animate-in fade-in duration-300">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                  <Ruler className="h-4 w-4" />
                  <span className="text-sm">Volume</span>
                </div>
                <p className="text-2xl font-bold">{calculations.volumeM3} m³</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                  <Scale className="h-4 w-4" />
                  <span className="text-sm">Weight</span>
                </div>
                <p className="text-2xl font-bold">{calculations.weightTonnes} t</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  <span className="font-medium">Loads needed</span>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {calculations.loadsNeeded} {calculations.loadsNeeded === 1 ? 'load' : 'loads'}
                </Badge>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Estimated price range</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  £{calculations.estimatedPriceMin.toLocaleString()} - £{calculations.estimatedPriceMax.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Share button */}
            <Button variant="outline" className="w-full" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share Calculation
            </Button>

            {/* CTA */}
            {showCTA && (
              <div className="space-y-2 pt-4 border-t">
                <Button 
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                  size="lg"
                  onClick={() => navigate('/subscribe')}
                >
                  Book Now with MuckAway.ai
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Get AI-powered spoil classification and instant digital WTNs
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WasteVolumeCalculator;
