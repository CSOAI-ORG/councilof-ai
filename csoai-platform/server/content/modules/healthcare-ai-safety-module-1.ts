import type { QuizQuestion } from '@/types/quiz';

export const healthcareAiSafetyModule1Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is "Software as a Medical Device" (SaMD) in healthcare AI regulation?',
    options: [
      'Software used to operate medical hardware',
      'Software intended to be used for medical purposes without being part of a hardware device',
      'Any software used in hospitals',
      'Electronic medical records systems',
    ],
    correctAnswer: 1,
    explanation: 'SaMD is software intended to be used for one or more medical purposes without being part of a hardware medical device. This includes AI diagnostic tools, clinical decision support systems, and monitoring applications.',
  },
  {
    id: 2,
    question: 'Which US regulatory body oversees AI medical devices?',
    options: [
      'FTC',
      'FDA (Food and Drug Administration)',
      'NIH',
      'CMS',
    ],
    correctAnswer: 1,
    explanation: 'The FDA regulates AI and machine learning-based medical devices in the US through its Center for Devices and Radiological Health (CDRH), applying various pathways based on risk level.',
  },
  {
    id: 3,
    question: 'What is "clinical validation" for healthcare AI systems?',
    options: [
      'Validating that clinicians can use the system',
      'Demonstrating that an AI system performs as intended in the relevant clinical conditions',
      'Approval by a clinical committee',
      'Testing AI in laboratory conditions only',
    ],
    correctAnswer: 1,
    explanation: 'Clinical validation involves demonstrating that an AI system achieves its intended clinical purpose and performs accurately and safely in the clinical conditions where it will be used.',
  },
  {
    id: 4,
    question: 'What is the significance of the FDA\'s "predetermined change control plan" for AI?',
    options: [
      'A plan for changing FDA personnel',
      'Enables AI devices to be updated within approved parameters without requiring new clearance each time',
      'A plan for changing healthcare providers',
      'Schedule for routine maintenance',
    ],
    correctAnswer: 1,
    explanation: 'The predetermined change control plan allows AI/ML-enabled devices to make modifications within pre-specified parameters without requiring new FDA marketing submissions for each update.',
  },
  {
    id: 5,
    question: 'What is "algorithmic bias" in the context of healthcare AI?',
    options: [
      'Preference for certain algorithms',
      'Systematic errors that lead to unfair health outcomes for certain patient populations',
      'Bias in algorithm selection by developers',
      'Faster processing for some conditions',
    ],
    correctAnswer: 1,
    explanation: 'Algorithmic bias in healthcare AI refers to systematic errors that can lead to unequal diagnostic accuracy, treatment recommendations, or outcomes for different patient populations based on factors like race, gender, or socioeconomic status.',
  },
  {
    id: 6,
    question: 'What is HIPAA and how does it apply to healthcare AI?',
    options: [
      'Health Insurance Portability and Accountability Act - applies to AI handling protected health information',
      'Healthcare AI Protection Act',
      'Hospital Information Processing AI Act',
      'Health Innovation and Privacy Act',
    ],
    correctAnswer: 0,
    explanation: 'HIPAA (Health Insurance Portability and Accountability Act) establishes privacy and security requirements for protected health information, which applies to AI systems that process, store, or transmit such data.',
  },
  {
    id: 7,
    question: 'What is the role of "human oversight" in clinical AI decision support?',
    options: [
      'AI should make all decisions independently',
      'Ensuring qualified healthcare professionals review and approve AI-assisted decisions',
      'Oversight is only needed for billing',
      'Human oversight is optional for FDA-approved AI',
    ],
    correctAnswer: 1,
    explanation: 'Human oversight ensures that qualified healthcare professionals review, interpret, and take responsibility for AI-assisted clinical decisions, maintaining the physician-patient relationship and clinical judgment.',
  },
  {
    id: 8,
    question: 'What is "dataset shift" in healthcare AI?',
    options: [
      'Moving datasets between hospitals',
      'Changes in data characteristics over time that can degrade AI performance',
      'Shifting data storage locations',
      'Transferring patient records',
    ],
    correctAnswer: 1,
    explanation: 'Dataset shift occurs when the characteristics of data that an AI encounters in practice differ from training data, potentially due to population changes, equipment updates, or evolving clinical practices.',
  },
  {
    id: 9,
    question: 'What is the FDA\'s approach to AI that continuously learns?',
    options: [
      'Continuously learning AI is banned',
      'Requires careful monitoring and potentially locked algorithms or predetermined change control plans',
      'No specific regulations apply',
      'Auto-approval for all learning AI',
    ],
    correctAnswer: 1,
    explanation: 'The FDA requires careful consideration of continuously learning AI, often requiring "locked" algorithms for initial approval or predetermined change control plans that specify how the device can learn and update.',
  },
  {
    id: 10,
    question: 'What is "clinical decision support" (CDS) in healthcare AI?',
    options: [
      'Financial support for clinical trials',
      'AI systems that provide clinicians with patient-specific assessments or recommendations',
      'IT support for clinics',
      'Patient billing systems',
    ],
    correctAnswer: 1,
    explanation: 'Clinical decision support systems are AI tools that provide clinicians with patient-specific assessments, recommendations, or alerts to enhance diagnostic accuracy and treatment decisions.',
  },
];
