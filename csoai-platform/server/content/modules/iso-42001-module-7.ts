import type { QuizQuestion } from '@/types/quiz';

export const iso42001Module7Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is continual improvement in ISO 42001?',
    options: [
      'One-time improvements',
      'Recurring activity to enhance AIMS suitability, adequacy, and effectiveness',
      'Only fixing problems',
      'Only adding new features',
    ],
    correctAnswer: 1,
    explanation: 'Continual improvement is a recurring activity to enhance the suitability, adequacy, and effectiveness of the AIMS. It involves systematically identifying improvement opportunities, implementing changes, and evaluating results to drive ongoing enhancement.',
  },
  {
    id: 2,
    question: 'What is a nonconformity in ISO 42001?',
    options: [
      'A minor mistake',
      'Non-fulfillment of a requirement',
      'A suggestion for improvement',
      'A best practice',
    ],
    correctAnswer: 1,
    explanation: 'A nonconformity is the non-fulfillment of a requirement. This could be a failure to meet ISO 42001 requirements, organizational requirements, legal requirements, or customer requirements. Nonconformities must be addressed through corrective action.',
  },
  {
    id: 3,
    question: 'What must organizations do when a nonconformity occurs?',
    options: [
      'Ignore it if minor',
      'React, evaluate the need for action, implement corrective action, and review effectiveness',
      'Only document it',
      'Only inform management',
    ],
    correctAnswer: 1,
    explanation: 'When a nonconformity occurs, organizations must: react to it and take action to control and correct it, evaluate the need for action to eliminate root causes, implement corrective action, review the effectiveness of corrective action, and update risks and opportunities if needed.',
  },
  {
    id: 4,
    question: 'What is the difference between correction and corrective action?',
    options: [
      'They are the same',
      'Correction addresses the immediate problem; corrective action eliminates the root cause',
      'Correction is permanent; corrective action is temporary',
      'There is no difference',
    ],
    correctAnswer: 1,
    explanation: 'Correction addresses the immediate problem or symptom (e.g., fixing a bug), while corrective action eliminates the root cause to prevent recurrence (e.g., improving the development process). Both are needed for effective problem resolution.',
  },
  {
    id: 5,
    question: 'Should corrective actions be documented?',
    options: [
      'No, documentation is optional',
      'Yes, the nature of nonconformities, actions taken, and results must be retained as evidence',
      'Only for major nonconformities',
      'Only if auditors request it',
    ],
    correctAnswer: 1,
    explanation: 'Yes, organizations must retain documented information as evidence of the nature of nonconformities, any subsequent actions taken, and the results of corrective action. This demonstrates systematic problem resolution and supports learning.',
  },
  {
    id: 6,
    question: 'What is the purpose of ISO 42001 certification?',
    options: [
      'Only for marketing',
      'To demonstrate independent verification of AIMS conformity to ISO 42001 requirements',
      'To avoid regulation',
      'To replace internal audits',
    ],
    correctAnswer: 1,
    explanation: 'ISO 42001 certification provides independent third-party verification that an organization\'s AIMS conforms to ISO 42001 requirements. It demonstrates commitment to responsible AI, enhances credibility, and can support regulatory compliance.',
  },
  {
    id: 7,
    question: 'What are the stages of ISO 42001 certification?',
    options: [
      'Only one audit',
      'Stage 1 (documentation review), Stage 2 (implementation audit), and surveillance audits',
      'Only Stage 2 audit',
      'Only surveillance audits',
    ],
    correctAnswer: 1,
    explanation: 'Certification involves: Stage 1 audit (review of documented information and readiness), Stage 2 audit (on-site verification of implementation and effectiveness), and ongoing surveillance audits (typically every 6-12 months) to maintain certification.',
  },
  {
    id: 8,
    question: 'How long is ISO 42001 certification valid?',
    options: [
      'Forever once obtained',
      'Typically 3 years, subject to successful surveillance audits',
      '1 year',
      '10 years',
    ],
    correctAnswer: 1,
    explanation: 'ISO 42001 certification is typically valid for 3 years, subject to successful surveillance audits (usually conducted every 6-12 months). After 3 years, a recertification audit is required to renew the certificate.',
  },
  {
    id: 9,
    question: 'Can certification be suspended or withdrawn?',
    options: [
      'No, certification is permanent',
      'Yes, if major nonconformities are found or not addressed',
      'Only if the organization requests it',
      'Only if fees are not paid',
    ],
    correctAnswer: 1,
    explanation: 'Yes, certification can be suspended or withdrawn if major nonconformities are identified during surveillance audits and not adequately addressed, if the organization fails to maintain the AIMS, or if there are serious breaches of certification requirements.',
  },
  {
    id: 10,
    question: 'Should organizations pursue continual improvement even after certification?',
    options: [
      'No, certification is the end goal',
      'Yes, continual improvement is an ongoing requirement, not a one-time achievement',
      'Only if auditors require it',
      'Only if problems occur',
    ],
    correctAnswer: 1,
    explanation: 'Yes, continual improvement is an ongoing requirement of ISO 42001, not a one-time achievement. Organizations must continuously seek opportunities to enhance AIMS effectiveness, even after certification. Certification is a milestone, not the destination.',
  },
];
