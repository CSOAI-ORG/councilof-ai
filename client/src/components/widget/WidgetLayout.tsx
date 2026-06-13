/**
 * WidgetLayout - Minimal clean wrapper for white-label widget content
 * No header, footer, navigation, or branding
 */

interface WidgetLayoutProps {
  children: React.ReactNode;
}

export default function WidgetLayout({ children }: WidgetLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Subtle top border */}
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500"></div>

      {/* Clean container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>

      {/* Minimal footer text */}
      <div className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-xs text-gray-500 text-center">
            Powered by Open-Source AI Safety Education
          </p>
        </div>
      </div>
    </div>
  );
}
