import type { QuizQuestion } from '@/types/quiz';

export const aiSafetyFundamentalsModule4Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the "precautionary principle" in AI safety?',
    options: [
      'Always using the most advanced AI technology available',
      'Taking preventive measures in the face of uncertainty about potential harms',
      'Only deploying AI after achieving 100% safety guarantee',
      'Prioritizing speed of AI development over safety considerations',
    ],
    correctAnswer: 1,
    explanation: 'The precautionary principle suggests taking preventive measures when there is uncertainty about potential harms, rather than waiting for complete scientific certainty. It guides responsible AI development.',
  },
  {
    id: 2,
    question: 'What is "defense in depth" for AI safety?',
    options: [
      'Building AI systems deep underground',
      'Multiple overlapping safety measures so if one fails, others provide protection',
      'In-depth analysis of AI algorithms',
      'Deep learning for security applications',
    ],
    correctAnswer: 1,
    explanation: 'Defense in depth involves implementing multiple overlapping safety measures and controls, so that if one layer fails, other layers continue to provide protection. This is a fundamental safety engineering principle.',
  },
  {
    id: 3,
    question: 'What is "capability control" as an AI safety strategy?',
    options: [
      'Limiting what AI systems can do to reduce potential for harm',
      'Maximizing AI capabilities for competitive advantage',
      'Controlling AI development team size',
      'Managing AI project budgets',
    ],
    correctAnswer: 0,
    explanation: 'Capability control involves deliberately limiting what AI systems can do, access, or influence to reduce the potential for harm. This includes limiting resources, restricting actions, or constraining operational scope.',
  },
  {
    id: 4,
    question: 'What is an "AI safety case"?',
    options: [
      'A legal case involving AI systems',
      'A structured argument with evidence that an AI system is acceptably safe for use',
      'A container for transporting AI hardware',
      'A case study about AI failures',
    ],
    correctAnswer: 1,
    explanation: 'An AI safety case is a structured, evidence-based argument demonstrating that an AI system is acceptably safe for its intended use. It documents risks, mitigations, and evidence that safety requirements are met.',
  },
  {
    id: 5,
    question: 'What is "staged deployment" in AI safety practices?',
    options: [
      'Deploying AI systems on theatrical stages',
      'Gradually expanding AI deployment while monitoring for issues at each stage',
      'Deploying AI in multiple geographic stages',
      'Using staging servers for AI development',
    ],
    correctAnswer: 1,
    explanation: 'Staged deployment involves gradually expanding the scope, user base, or capabilities of AI systems while carefully monitoring for issues at each stage before proceeding further. This allows early detection of problems.',
  },
  {
    id: 6,
    question: 'What is the role of "safety benchmarks" in AI development?',
    options: [
      'Physical benches in AI laboratories',
      'Standardized tests to evaluate and compare AI safety properties',
      'Benchmarking AI performance against competitors',
      'Financial benchmarks for AI investments',
    ],
    correctAnswer: 1,
    explanation: 'Safety benchmarks are standardized tests designed to evaluate specific safety properties of AI systems, such as robustness, fairness, or resistance to adversarial attacks. They enable systematic safety evaluation and comparison.',
  },
  {
    id: 7,
    question: 'What is "responsible disclosure" in the context of AI safety?',
    options: [
      'Disclosing AI product features to customers',
      'Reporting AI vulnerabilities to developers before public disclosure to allow fixes',
      'Disclosing AI company financial information',
      'Publishing all AI research immediately',
    ],
    correctAnswer: 1,
    explanation: 'Responsible disclosure involves reporting AI vulnerabilities or safety issues to the relevant developers or organizations before making them public, allowing time for fixes to prevent exploitation.',
  },
  {
    id: 8,
    question: 'What is "AI governance" in the context of organizational safety?',
    options: [
      'Government control of all AI systems',
      'Policies, processes, and structures for managing AI development and use responsibly',
      'Governance by AI systems',
      'AI voting systems',
    ],
    correctAnswer: 1,
    explanation: 'AI governance encompasses the policies, processes, organizational structures, and oversight mechanisms that organizations use to ensure AI systems are developed and used responsibly and safely.',
  },
  {
    id: 9,
    question: 'What is "safety culture" in AI organizations?',
    options: [
      'Cultural events focused on AI safety',
      'Shared values, attitudes, and practices that prioritize safety in AI work',
      'Safety training for cultural institutions',
      'AI systems that understand cultural differences',
    ],
    correctAnswer: 1,
    explanation: 'Safety culture refers to the shared values, attitudes, beliefs, and practices within an organization that prioritize safety in AI development and deployment. A strong safety culture helps prevent incidents.',
  },
  {
    id: 10,
    question: 'What is the relationship between AI safety and AI ethics?',
    options: [
      'They are completely unrelated fields',
      'AI safety is a subset of AI ethics focused on preventing harm',
      'AI ethics is a subset of AI safety',
      'They are identical concepts with different names',
    ],
    correctAnswer: 1,
    explanation: 'AI safety is often considered a subset of AI ethics, specifically focused on preventing AI systems from causing harm. AI ethics encompasses broader considerations including fairness, privacy, accountability, and societal impact.',
  },
];
