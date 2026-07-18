-- Insert EU AI Act Fundamentals Course
-- This course has 8 comprehensive modules totaling 38,000+ words

INSERT INTO courses (
  id,
  title,
  description,
  level,
  framework,
  region,
  duration,
  price,
  price_3month,
  price_6month,
  price_12month,
  stripe_price_id,
  stripe_price_id_3month,
  stripe_price_id_6month,
  stripe_price_id_12month,
  modules,
  learning_objectives,
  prerequisites,
  certification_included,
  status,
  created_at,
  updated_at
) VALUES (
  'eu-ai-act-fundamentals-001',
  'EU AI Act Fundamentals',
  'Comprehensive 8-module course covering the EU AI Act regulation. Learn prohibited practices, high-risk AI systems, provider/deployer obligations, transparency requirements, GPAI regulation, governance structure, compliance timeline, and penalties. Includes real-world examples, case studies, and practical compliance roadmaps. Certification upon completion.',
  'fundamentals',
  'eu-ai-act',
  'EU',
  600, -- 10 hours (600 minutes)
  499.00,
  199.00,
  99.00,
  59.00,
  NULL, -- Stripe price IDs to be added after Stripe product creation
  NULL,
  NULL,
  NULL,
  JSON_ARRAY(
    JSON_OBJECT(
      'id', 1,
      'title', 'Introduction to the EU AI Act',
      'duration', 45,
      'contentFile', 'eu-ai-act-module-1.md',
      'learningObjectives', JSON_ARRAY(
        'Explain the purpose and scope of the EU AI Act',
        'Understand the risk-based regulatory framework',
        'Identify key definitions and concepts',
        'Recognize the relationship to other EU laws'
      )
    ),
    JSON_OBJECT(
      'id', 2,
      'title', 'Risk Classification System',
      'duration', 45,
      'contentFile', 'eu-ai-act-module-2.md',
      'learningObjectives', JSON_ARRAY(
        'Classify AI systems by risk level',
        'Understand Annex I and Annex III categories',
        'Recognize exceptions and edge cases',
        'Apply classification to your AI systems'
      )
    ),
    JSON_OBJECT(
      'id', 3,
      'title', 'Prohibited AI Practices',
      'duration', 60,
      'contentFile', 'eu-ai-act-module-3.md',
      'learningObjectives', JSON_ARRAY(
        'Identify all 8 prohibited AI practices',
        'Understand enforcement timeline (February 2, 2025)',
        'Recognize narrow exceptions',
        'Apply prohibitions to your AI systems'
      )
    ),
    JSON_OBJECT(
      'id', 4,
      'title', 'High-Risk AI Systems - Part 1',
      'duration', 60,
      'contentFile', 'eu-ai-act-module-4.md',
      'learningObjectives', JSON_ARRAY(
        'Recognize high-risk AI in biometric identification',
        'Identify critical infrastructure AI systems',
        'Understand education and employment AI risks',
        'Apply Annex III Categories 1-4 to your systems'
      )
    ),
    JSON_OBJECT(
      'id', 5,
      'title', 'High-Risk AI Systems - Part 2',
      'duration', 60,
      'contentFile', 'eu-ai-act-module-5.md',
      'learningObjectives', JSON_ARRAY(
        'Identify high-risk AI in essential services',
        'Understand law enforcement AI requirements',
        'Recognize migration and justice AI risks',
        'Apply Annex III Categories 5-8 to your systems'
      )
    ),
    JSON_OBJECT(
      'id', 6,
      'title', 'Provider and Deployer Obligations',
      'duration', 60,
      'contentFile', 'eu-ai-act-module-6.md',
      'learningObjectives', JSON_ARRAY(
        'Distinguish between provider and deployer roles',
        'Understand all 12 provider obligations',
        'Understand all 7 deployer obligations',
        'Develop compliance roadmaps for your organization'
      )
    ),
    JSON_OBJECT(
      'id', 7,
      'title', 'Transparency, GPAI, and Governance',
      'duration', 60,
      'contentFile', 'eu-ai-act-module-7.md',
      'learningObjectives', JSON_ARRAY(
        'Apply transparency obligations to all AI systems',
        'Understand GPAI regulation (baseline + systemic risk)',
        'Recognize the governance structure',
        'Engage with codes of practice'
      )
    ),
    JSON_OBJECT(
      'id', 8,
      'title', 'Compliance Timeline, Penalties, and Next Steps',
      'duration', 60,
      'contentFile', 'eu-ai-act-module-8.md',
      'learningObjectives', JSON_ARRAY(
        'Navigate the phased implementation timeline',
        'Understand penalty structures and enforcement',
        'Execute immediate compliance actions',
        'Plan long-term compliance roadmap'
      )
    )
  ),
  JSON_ARRAY(
    'Explain the purpose, scope, and regulatory framework of the EU AI Act',
    'Classify AI systems by risk level (prohibited, high-risk, limited-risk, minimal-risk)',
    'Identify prohibited AI practices and understand enforcement timeline',
    'Recognize all eight categories of high-risk AI systems (Annex III)',
    'Distinguish between provider and deployer roles and obligations',
    'Apply transparency requirements to all AI systems',
    'Understand General-Purpose AI (GPAI) regulation',
    'Navigate the compliance timeline and penalty structure',
    'Develop an organizational compliance roadmap'
  ),
  JSON_ARRAY(), -- No prerequisites
  TRUE, -- Certification included
  'active',
  NOW(),
  NOW()
);
