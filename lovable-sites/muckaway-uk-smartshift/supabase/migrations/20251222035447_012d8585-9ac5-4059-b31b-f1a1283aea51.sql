-- =====================================================
-- SEO/AEO CONTENT MANAGEMENT SYSTEM
-- Phase 1: Blog, Landing Pages, and Lead Magnets
-- =====================================================

-- Blog Categories (Content Pillars)
CREATE TABLE public.blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    meta_title TEXT,
    meta_description TEXT,
    featured_image_url TEXT,
    parent_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Blog Posts (SEO Content)
CREATE TABLE public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    meta_title TEXT,
    meta_description TEXT,
    keywords TEXT[],
    featured_image_url TEXT,
    featured_image_alt TEXT,
    category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_featured BOOLEAN DEFAULT false,
    is_pillar_content BOOLEAN DEFAULT false,
    word_count INTEGER,
    reading_time_minutes INTEGER,
    canonical_url TEXT,
    schema_type TEXT DEFAULT 'Article' CHECK (schema_type IN ('Article', 'BlogPosting', 'HowTo', 'FAQPage')),
    structured_data JSONB,
    internal_links TEXT[],
    external_links TEXT[],
    view_count INTEGER DEFAULT 0,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- SEO Landing Pages (Programmatic SEO)
CREATE TABLE public.seo_landing_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    page_type TEXT NOT NULL CHECK (page_type IN ('industry', 'feature', 'comparison', 'location', 'question')),
    title TEXT NOT NULL,
    headline TEXT NOT NULL,
    subheadline TEXT,
    content TEXT NOT NULL,
    meta_title TEXT,
    meta_description TEXT,
    keywords TEXT[],
    featured_image_url TEXT,
    hero_cta_text TEXT DEFAULT 'Get Started Free',
    hero_cta_url TEXT DEFAULT '/auth',
    testimonial_ids UUID[],
    faq_items JSONB,
    schema_type TEXT DEFAULT 'WebPage',
    structured_data JSONB,
    is_active BOOLEAN DEFAULT true,
    is_noindex BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Lead Magnets (Downloadable Content)
CREATE TABLE public.lead_magnets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    magnet_type TEXT NOT NULL CHECK (magnet_type IN ('pdf', 'checklist', 'template', 'guide', 'tool', 'assessment')),
    file_url TEXT,
    thumbnail_url TEXT,
    landing_page_content TEXT,
    thank_you_content TEXT,
    email_subject TEXT,
    email_body TEXT,
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Lead Magnet Downloads (Track conversions)
CREATE TABLE public.lead_magnet_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_magnet_id UUID NOT NULL REFERENCES public.lead_magnets(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    company TEXT,
    source_page TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    ip_hash TEXT,
    user_agent TEXT,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- Enable Row Level Security
-- =====================================================
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_magnets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_magnet_downloads ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies - Blog Categories (Public Read)
-- =====================================================
CREATE POLICY "Anyone can view active blog categories"
ON public.blog_categories FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage blog categories"
ON public.blog_categories FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS Policies - Blog Posts (Public Read for Published)
-- =====================================================
CREATE POLICY "Anyone can view published blog posts"
ON public.blog_posts FOR SELECT
USING (status = 'published' AND published_at <= now());

CREATE POLICY "Authors can view own drafts"
ON public.blog_posts FOR SELECT
USING (author_id = auth.uid());

CREATE POLICY "Admins can manage all blog posts"
ON public.blog_posts FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authors can create blog posts"
ON public.blog_posts FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authors can update own posts"
ON public.blog_posts FOR UPDATE
USING (author_id = auth.uid());

-- =====================================================
-- RLS Policies - SEO Landing Pages (Public Read)
-- =====================================================
CREATE POLICY "Anyone can view active landing pages"
ON public.seo_landing_pages FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage landing pages"
ON public.seo_landing_pages FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS Policies - Lead Magnets (Public Read)
-- =====================================================
CREATE POLICY "Anyone can view active lead magnets"
ON public.lead_magnets FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage lead magnets"
ON public.lead_magnets FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS Policies - Lead Magnet Downloads
-- =====================================================
CREATE POLICY "Anyone can submit lead magnet download"
ON public.lead_magnet_downloads FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all downloads"
ON public.lead_magnet_downloads FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- Indexes for Performance
-- =====================================================
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category_id);
CREATE INDEX idx_blog_posts_published ON public.blog_posts(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_blog_posts_featured ON public.blog_posts(is_featured) WHERE is_featured = true;
CREATE INDEX idx_blog_posts_pillar ON public.blog_posts(is_pillar_content) WHERE is_pillar_content = true;

CREATE INDEX idx_seo_landing_pages_slug ON public.seo_landing_pages(slug);
CREATE INDEX idx_seo_landing_pages_type ON public.seo_landing_pages(page_type);
CREATE INDEX idx_seo_landing_pages_active ON public.seo_landing_pages(is_active) WHERE is_active = true;

CREATE INDEX idx_lead_magnets_slug ON public.lead_magnets(slug);
CREATE INDEX idx_lead_magnets_type ON public.lead_magnets(magnet_type);

CREATE INDEX idx_lead_magnet_downloads_magnet ON public.lead_magnet_downloads(lead_magnet_id);
CREATE INDEX idx_lead_magnet_downloads_email ON public.lead_magnet_downloads(email);
CREATE INDEX idx_lead_magnet_downloads_date ON public.lead_magnet_downloads(downloaded_at DESC);

-- =====================================================
-- Triggers for Updated At
-- =====================================================
CREATE TRIGGER update_blog_categories_updated_at
BEFORE UPDATE ON public.blog_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seo_landing_pages_updated_at
BEFORE UPDATE ON public.seo_landing_pages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_magnets_updated_at
BEFORE UPDATE ON public.lead_magnets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();