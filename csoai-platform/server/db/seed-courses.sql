-- Seed EU Region Courses
INSERT INTO `courses` (`regionId`, `title`, `description`, `framework`, `level`, `durationHours`, `price`, `certificationRequired`, `active`) VALUES
-- EU Region (ID: 1)
(1, 'EU AI Act Fundamentals', 'Comprehensive overview of the EU AI Act including risk-based approach, prohibited practices, and transparency obligations', 'EU AI Act', 'fundamentals', 4, 9900, false, true),
(1, 'High-Risk AI Systems', 'Deep dive into Annex III use cases, conformity assessment procedures, technical documentation, and risk management systems', 'EU AI Act', 'advanced', 6, 14900, false, true),
(1, 'EU AI Act Conformity Assessment', 'Master the CE marking process, notified body involvement, self-assessment vs third-party assessment, and post-market monitoring', 'EU AI Act', 'advanced', 8, 19900, true, true),
(1, 'EU AI Act for Deployers', 'Learn deployer obligations (Article 26), human oversight requirements, fundamental rights impact assessments, and incident reporting', 'EU AI Act', 'advanced', 6, 14900, false, true),

-- US Region (ID: 2)
(2, 'NIST AI RMF Fundamentals', 'Introduction to the four functions: Govern, Map, Measure, Manage, AI risk categories, and trustworthy AI characteristics', 'NIST AI RMF', 'fundamentals', 4, 9900, false, true),
(2, 'AI Risk Governance', 'Build organizational AI governance structures, define roles and responsibilities, create AI policies, and engage stakeholders', 'NIST AI RMF', 'advanced', 6, 14900, false, true),
(2, 'AI Risk Assessment & Measurement', 'Master AI system testing and evaluation, bias detection and mitigation, performance metrics, and continuous monitoring', 'NIST AI RMF', 'advanced', 8, 19900, true, true),
(2, 'Federal AI Regulations', 'Navigate Executive Order 14110, OMB AI guidance, and sector-specific regulations in healthcare, finance, and defense', 'NIST AI RMF', 'advanced', 6, 14900, false, true),

-- UK Region (ID: 3)
(3, 'UK AI Safety Institute Overview', 'Understand the pro-innovation regulatory approach, five cross-sectoral principles, and AI Safety Institute role', 'UK AI Safety Institute', 'fundamentals', 4, 9900, false, true),
(3, 'AI Safety Evaluation', 'Learn frontier AI safety testing, red teaming methodologies, and capability assessments', 'UK AI Safety Institute', 'advanced', 6, 14900, false, true),
(3, 'Sector-Specific AI Guidance', 'Master healthcare AI (MHRA), financial services AI (FCA/PRA), and public sector AI (CDEI) guidance', 'UK AI Safety Institute', 'advanced', 8, 19900, true, true),

-- Canada Region (ID: 4)
(4, 'AIDA Fundamentals', 'Introduction to Canada\'s Artificial Intelligence and Data Act, key obligations, and compliance requirements', 'AIDA', 'fundamentals', 4, 9900, false, true),
(4, 'AI Impact Assessment', 'Learn to conduct AI impact assessments, identify risks, and implement mitigation strategies under AIDA', 'AIDA', 'advanced', 6, 14900, true, true),

-- Australia Region (ID: 5)
(5, 'AI Ethics Framework Fundamentals', 'Understand Australia\'s AI Ethics Framework, voluntary safety standards, and responsible AI principles', 'AI Ethics Framework', 'fundamentals', 4, 9900, false, true),
(5, 'AI Safety Standard Implementation', 'Implement Australia\'s Voluntary AI Safety Standard in your organization', 'AI Ethics Framework', 'advanced', 6, 14900, true, true);

-- Seed Course Bundles
INSERT INTO `course_bundles` (`regionId`, `name`, `description`, `courseIds`, `regularPrice`, `bundlePrice`, `savings`, `active`) VALUES
(1, 'EU Compliance Bundle', 'Complete EU AI Act training package with all 4 courses', '[1,2,3,4]', 59600, 49900, 9700, true),
(2, 'US Compliance Bundle', 'Complete NIST AI RMF training package with all 4 courses', '[5,6,7,8]', 59600, 39900, 19700, true),
(3, 'UK Compliance Bundle', 'Complete UK AI Safety training package with all 3 courses', '[9,10,11]', 44700, 34900, 9800, true),
(4, 'Canada Compliance Bundle', 'Complete AIDA training package with both courses', '[12,13]', 24800, 19900, 4900, true),
(5, 'Australia Compliance Bundle', 'Complete AI Ethics Framework training package with both courses', '[14,15]', 24800, 19900, 4900, true);
