import { useLanguage } from '@/hooks/useLanguage';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, MapPin, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function RegionSettings() {
  const { language, currency, region, changeLanguage, supportedLanguages } = useLanguage();

  const handleLanguageChange = (langCode: string) => {
    changeLanguage(langCode);
    toast.success(`Language changed to ${supportedLanguages[langCode as keyof typeof supportedLanguages].name}`);
  };

  const groupedLanguages = Object.entries(supportedLanguages).reduce(
    (acc, [code, info]) => {
      if (!acc[info.region]) {
        acc[info.region] = [];
      }
      acc[info.region].push({ code, ...info });
      return acc;
    },
    {} as Record<string, Array<{ code: string; name: string; flag: string; currency: string; region: string }>>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Region & Language Settings</h1>
          <p className="text-gray-600">Customize your language, currency, and regional preferences</p>
        </div>

        {/* Current Settings */}
        <Card className="mb-8 border-emerald-200 bg-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-600" />
              Current Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Language</p>
                <p className="text-lg font-semibold text-gray-900">
                  {supportedLanguages[language as keyof typeof supportedLanguages]?.name || 'English (US)'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Currency</p>
                <p className="text-lg font-semibold text-gray-900">{currency}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Region</p>
                <p className="text-lg font-semibold text-gray-900">{region}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language Selection by Region */}
        <div className="space-y-6">
          {Object.entries(groupedLanguages).map(([region, languages]) => (
            <Card key={region}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  {region === 'US' ? 'United States' : region === 'UK' ? 'United Kingdom' : region === 'EU' ? 'European Union' : region}
                </CardTitle>
                <CardDescription>
                  {languages.length} language{languages.length !== 1 ? 's' : ''} available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {languages.map((lang) => (
                    <Button
                      key={lang.code}
                      variant={language === lang.code ? 'default' : 'outline'}
                      className={`justify-start h-auto py-3 px-4 ${
                        language === lang.code
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'border-gray-200 hover:border-emerald-400'
                      }`}
                      onClick={() => handleLanguageChange(lang.code)}
                    >
                      <div className="text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{lang.flag}</span>
                          <span className="font-medium">{lang.name}</span>
                        </div>
                        <div className="text-xs opacity-75 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {lang.currency}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Box */}
        <Card className="mt-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Auto-Detection</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800">
            <p>
              Your language and currency are automatically detected based on your browser settings and location. 
              You can manually change them here at any time, and your preferences will be saved for future visits.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
