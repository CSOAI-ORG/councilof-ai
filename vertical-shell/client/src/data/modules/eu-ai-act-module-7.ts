import type { QuizQuestion } from '@/types/quiz';

export const euAiActModule7Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'Which of the following represents the correct implementation timeline for the EU AI Act?',
    options: [
      'All provisions effective immediately upon enactment',
      'February 2025: Prohibitions take effect; August 2025: GPAI requirements begin; August 2026: High-risk system requirements start',
      'All requirements effective in 2027 with no interim deadlines',
      'Different timelines for each EU member state with no coordination'
    ],
    correctAnswer: 1,
    explanation: 'The EU AI Act follows a phased implementation: February 2025 brings prohibitions on Article 5 banned practices; August 2025 activates GPAI model requirements; August 2026 activates high-risk system conformity requirements. This staged approach allows compliance preparation.'
  },
  {
    id: 2,
    question: 'What is the relationship between the EU AI Act and the GDPR?',
    options: [
      'The EU AI Act replaces the GDPR entirely',
      'Both regulations apply independently; an AI system may need to comply with both if it involves personal data processing',
      'The GDPR only applies to government agencies, not AI companies',
      'The EU AI Act supersedes all data protection requirements'
    ],
    correctAnswer: 1,
    explanation: 'The EU AI Act and GDPR are complementary regulations. A high-risk AI system processing personal data must comply with both the EU AI Act\'s technical requirements and GDPR\'s data protection principles, requiring integrated compliance strategies.'
  },
  {
    id: 3,
    question: 'Which of these definitions is correct according to the EU AI Act?',
    options: [
      'High-risk means the AI system runs on expensive servers',
      'An AI system is software based on machine learning or logic that can autonomously influence the environment or affect legal rights',
      'Risk refers only to financial losses of companies',
      'Prohibited practices are allowed under certain circumstances'
    ],
    correctAnswer: 1,
    explanation: 'The EU AI Act defines an AI system as software that uses machine learning or logic-based approaches and can autonomously influence the physical or digital environment or produce legal or similarly significant effects. This broad definition covers most modern AI applications.'
  },
  {
    id: 4,
    question: 'An e-commerce company uses an AI system to identify fraudulent transactions and automatically blocks them. What are the likely EU AI Act compliance requirements?',
    options: [
      'No requirements; fraud detection is fully exempt',
      'Transparency obligations if the system impacts users, and high-risk conformity assessment is unlikely unless the system directly restricts fundamental rights',
      'Immediate registration in the prohibited practices database',
      'Shutdown of the system immediately'
    ],
    correctAnswer: 1,
    explanation: 'Transaction fraud detection typically falls into limited or minimal risk depending on transparency and scope. If it transparently identifies fraud without restricting fundamental rights, it requires transparency obligations. High-risk classification would apply only if it restricts access based on restricted grounds.'
  },
  {
    id: 5,
    question: 'What does "meaningful human oversight" require for high-risk AI systems?',
    options: [
      'A human looking at an AI system one time annually',
      'Humans able to understand the system, monitor its operation, intervene, and override decisions, particularly for determinations affecting rights',
      'Only automated systems can oversee other AI systems',
      'Meaningful oversight is not required for high-risk systems'
    ],
    correctAnswer: 1,
    explanation: 'Meaningful human oversight means humans must have genuine ability to comprehend the AI system\'s functioning and impact, monitor ongoing operations, take corrective actions, and override decisions. This is particularly critical for systems making determinations affecting fundamental rights.'
  },
  {
    id: 6,
    question: 'A government agency considers using an AI system to assess job applicants. What compliance pathway must it follow?',
    options: [
      'No compliance pathway; government use is completely exempt',
      'Limited risk assessment with transparency obligations',
      'High-risk classification requiring conformity assessment, technical documentation, quality management, and human oversight before deployment',
      'Registration as prohibited practice and immediate shutdown'
    ],
    correctAnswer: 2,
    explanation: 'AI systems for employment assessment are explicitly listed as high-risk under Annex III. Whether deployed by government or private employers, they require full high-risk compliance including conformity assessment, technical documentation, quality management systems, and meaningful human oversight.'
  },
  {
    id: 7,
    question: 'How should an organization approach compliance with the August 2026 high-risk AI system deadline?',
    options: [
      'Delay all planning until August 2026',
      'Immediately conduct gap analyses, prioritize high-risk systems, develop quality management systems, and create technical documentation well in advance of the deadline',
      'Request unlimited extensions from the EU to avoid compliance',
      'Ignore the deadline; the EU AI Act is not enforceable'
    ],
    correctAnswer: 1,
    explanation: 'Proactive compliance begins immediately despite the August 2026 deadline. Organizations should identify high-risk AI systems now, conduct gap analyses, implement quality management systems, create technical documentation, and prepare conformity assessment procedures to meet the deadline.'
  },
  {
    id: 8,
    question: 'Which scenario involves a fundamental rights violation that the EU AI Act seeks to prevent?',
    options: [
      'A recommendation system suggesting books based on reading history',
      'An AI system denying mortgage credit based on protected characteristics without transparent reasoning or human oversight',
      'A chatbot answering customer support questions',
      'An email filter identifying spam messages'
    ],
    correctAnswer: 1,
    explanation: 'Automated decision-making in credit assessment affecting fundamental economic rights without transparency or human appeal is a core harm the EU AI Act targets. This high-risk application requires full compliance including explainability and human oversight mechanisms.'
  },
  {
    id: 9,
    question: 'What should an organization do if it discovers a deployed AI system violates the EU AI Act?',
    options: [
      'Continue operating it silently and hope authorities do not notice',
      'Immediately notify authorities, conduct risk assessment, document findings, implement corrective measures, and potentially withdraw the system',
      'Delete all documentation to hide the violation',
      'Blame the violation on external factors and avoid responsibility'
    ],
    correctAnswer: 1,
    explanation: 'Responsible compliance requires prompt notification of competent authorities upon discovering violations, conducting thorough risk assessment, implementing corrective measures, and if necessary, withdrawing non-compliant systems. Transparency supports credibility and mitigates penalties.'
  },
  {
    id: 10,
    question: 'Which of these best summarizes the EU AI Act\'s comprehensive approach to AI regulation?',
    options: [
      'Complete prohibition of all AI systems in the EU',
      'No regulation; AI companies are completely self-regulating',
      'Risk-based regulation addressing banned practices, high-risk system requirements, transparency obligations, and enforcement mechanisms to protect rights and safety',
      'Regulation only of AI systems created before 2020'
    ],
    correctAnswer: 2,
    explanation: 'The EU AI Act\'s comprehensive approach combines prohibition of specific harmful practices, strict requirements for high-risk systems, transparency obligations for limited-risk systems, minimal oversight for minimal-risk systems, and robust enforcement mechanisms to balance innovation with rights protection.'
  }
];
