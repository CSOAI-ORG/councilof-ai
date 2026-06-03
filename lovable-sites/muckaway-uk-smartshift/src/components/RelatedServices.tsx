import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { getPageBySlug, SEOPageConfig, ALL_SEO_PAGES } from '@/config/seoKeywords';

interface RelatedServicesProps {
  slugs?: string[];
  currentSlug?: string;
  limit?: number;
  maxItems?: number;
}

export const RelatedServices = ({ slugs, currentSlug, limit, maxItems = 4 }: RelatedServicesProps) => {
  const itemLimit = limit || maxItems;
  
  let relatedPages: SEOPageConfig[];
  
  if (slugs) {
    relatedPages = slugs
      .map(slug => getPageBySlug(slug))
      .filter((page): page is SEOPageConfig => page !== undefined)
      .slice(0, itemLimit);
  } else {
    // Auto-select related pages excluding current
    relatedPages = ALL_SEO_PAGES
      .filter(page => page.slug !== currentSlug)
      .slice(0, itemLimit);
  }

  if (relatedPages.length === 0) return null;

  const categoryColors: Record<string, string> = {
    service: 'bg-primary/10 text-primary border-primary/20',
    compliance: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    guide: 'bg-green-500/10 text-green-500 border-green-500/20',
    industry: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    location: 'bg-orange-500/10 text-orange-500 border-orange-500/20'
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {relatedPages.map((page) => (
        <Link key={page.slug} to={`/${page.slug}`}>
          <Card className="h-full hover:shadow-lg transition-shadow hover:border-primary/50">
            <CardHeader className="pb-2">
              <Badge variant="outline" className={categoryColors[page.category]}>
                {page.category}
              </Badge>
              <CardTitle className="text-lg mt-2">{page.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {page.metaDescription.slice(0, 100)}...
              </p>
              <span className="text-primary text-sm font-medium flex items-center gap-1">
                Learn more <ArrowRight className="h-4 w-4" />
              </span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default RelatedServices;
