import { useLocation, Navigate } from 'react-router-dom';
import { SEOLandingTemplate } from '@/components/SEOLandingTemplate';
import { getPageBySlug } from '@/config/seoKeywords';

const SEOPage = () => {
  const location = useLocation();
  // Extract slug from pathname (e.g., "/soil-removal-near-me" -> "soil-removal-near-me")
  const slug = location.pathname.replace(/^\//, '');
  const pageConfig = getPageBySlug(slug);

  if (!pageConfig) {
    return <Navigate to="/404" replace />;
  }

  return <SEOLandingTemplate pageConfig={pageConfig} />;
};

export default SEOPage;
