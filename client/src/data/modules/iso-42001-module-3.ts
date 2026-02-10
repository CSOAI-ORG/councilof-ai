import type { QuizQuestion } from '@/types/quiz';

export const iso42001Module3Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the primary objective of AI risk identification in ISO/IEC 42001?',
    options: [
      'To eliminate all AI systems from the organization',
      'To identify, analyze, and evaluate risks associated with AI systems to prevent unwanted outcomes',
      'To assign blame for AI-related incidents',
      'To create barriers to AI innovation',
    ],
    correctAnswer: 1,
    explanation: 'AI risk identification aims to systematically identify, analyze, and evaluate potential risks associated with AI systems across their lifecycle to ensure the organization can prevent or mitigate unwanted outcomes.',
  },
  {
    id: 2,
    question: 'According to ISO/IEC 42001 Annex B, which of the following is a key control area for managing AI risks?',
    options: [
      'Limiting all AI development to external vendors only',
      'AI system impact assessment to understand potential harms and consequences',
      'Requiring AI systems to achieve perfect accuracy before deployment',
      'Eliminating any system that has ever produced an error',
    ],
    correctAnswer: 1,
    explanation: 'Annex B includes AI system impact assessment as a key control area, requiring organizations to assess potential impacts and harms of AI systems before deployment.',
  },
  {
    id: 3,
    question: 'How should opportunities be approached under ISO/IEC 42001?',
    options: [
      'Opportunities are not mentioned in the standard',
      'Only risks should be identified; opportunities are outside the scope',
      'Opportunities related to AI should be identified and evaluated, just as risks are',
      'Opportunities are the responsibility of the marketing department only',
    ],
    correctAnswer: 2,
    explanation: 'Clause 6.1 requires the organization to determine both risks AND opportunities related to the AIMS and establish processes to address them for continuous improvement.',
  },
  {
    id: 4,
    question: 'What is a risk register in the context of ISO/IEC 42001?',
    options: [
      'A list of all employees in the risk management department',
      'A documented record of identified AI risks, their assessment, treatment plans, and residual risk levels',
      'A compliance form required only for large organizations',
      'A marketing document for communicating with customers',
    ],
    correctAnswer: 1,
    explanation: 'A risk register is a documented inventory of identified AI risks that includes assessment results, treatment decisions, control implementation plans, and tracking of residual risk levels.',
  },
  {
    id: 5,
    question: 'How does ISO/IEC 42001 expect AI risk management to integrate with enterprise risk management?',
    options: [
      'AI risk management is separate and should not be integrated',
      'AI risks should be addressed within the organization\'s overall risk management framework',
      'Only IT department risks should be considered; AI risks are handled separately',
      'Enterprise risk management should be abandoned in favor of AI-only risk management',
    ],
    correctAnswer: 1,
    explanation: 'ISO/IEC 42001 expects AI risk management to be integrated with the organization\'s broader enterprise risk management processes and governance structures.',
  },
  {
    id: 6,
    question: 'Which types of risks should be considered during AI risk assessment according to ISO/IEC 42001?',
    options: [
      'Only technical performance risks',
      'Only regulatory compliance risks',
      'Risks across the AI system lifecycle including technical, operational, compliance, safety, security, and governance risks',
      'Only financial risks to the organization',
    ],
    correctAnswer: 2,
    explanation: 'AI risk assessment should be comprehensive and consider technical risks, operational risks, compliance risks, safety risks, security risks, and governance risks throughout the AI system lifecycle.',
  },
  {
    id: 7,
    question: 'What does risk treatment mean in ISO/IEC 42001?',
    options: [
      'Ignoring identified risks and hoping they do not occur',
      'Avoiding all AI system development to eliminate risks',
      'Selecting and implementing controls and strategies to modify the level of risk',
      'Transferring all risk responsibility to external auditors',
    ],
    correctAnswer: 2,
    explanation: 'Risk treatment involves selecting and implementing appropriate controls, mitigation strategies, and risk acceptance decisions to ensure residual risks align with organizational risk appetite and tolerance levels.',
  },
  {
    id: 8,
    question: 'According to Annex B of ISO/IEC 42001, what is the purpose of a risk assessment process for AI systems?',
    options: [
      'To determine if AI systems should be purchased from specific vendors',
      'To identify, analyze, and prioritize risks based on likelihood and impact to enable informed risk treatment decisions',
      'To ensure all AI systems perform identically',
      'To replace traditional risk assessment methodologies entirely',
    ],
    correctAnswer: 1,
    explanation: 'Annex B establishes that AI risk assessment should identify risks, analyze their likelihood and impact, and prioritize them to support informed decision-making about risk treatment and control implementation.',
  },
  {
    id: 9,
    question: 'What should be documented regarding the treatment of identified AI risks?',
    options: [
      'Nothing needs to be documented if risks are mitigated',
      'Risk treatment decisions, assigned responsibilities, timelines, and the controls implemented to address the risks',
      'Only risks that materialized need documentation',
      'Risk documentation is the sole responsibility of external auditors',
    ],
    correctAnswer: 1,
    explanation: 'Risk treatment decisions, responsibility assignments, implementation timelines, and control selections must be documented as part of the risk management plan and tracked in the risk register.',
  },
  {
    id: 10,
    question: 'How frequently should AI risks be reassessed according to ISO/IEC 42001?',
    options: [
      'Only when the organization experiences an incident',
      'Once during the initial implementation and then not again',
      'Periodically and whenever there are changes to AI systems, organizational context, or risk factors',
      'Never; initial risk assessment is sufficient for the lifetime of the system',
    ],
    correctAnswer: 2,
    explanation: 'ISO/IEC 42001 requires ongoing monitoring and periodic reassessment of AI risks to account for changes in systems, organizational context, regulatory environment, threat landscape, and operational conditions.',
  },
];
