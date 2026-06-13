import type { QuizQuestion } from '@/types/quiz';

export const iso42001Module6Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the primary purpose of the Stage 1 audit in ISO/IEC 42001 certification?',
    options: [
      'To immediately certify the organization',
      'To assess organizational readiness, review AIMS documentation, and ensure prerequisite conditions are met',
      'To identify and assign penalties for nonconformities',
      'Stage 1 audits are not part of the ISO 42001 certification process',
    ],
    correctAnswer: 1,
    explanation: 'The Stage 1 (initial assessment) audit evaluates organizational readiness, reviews the documented AIMS, verifies that prerequisite conditions are met, and assesses the organization\'s preparedness for the Stage 2 audit.',
  },
  {
    id: 2,
    question: 'What occurs during the Stage 2 audit in ISO/IEC 42001 certification?',
    options: [
      'Only a document review is conducted',
      'A comprehensive assessment of AIMS implementation, controls, processes, and effectiveness through observation and evidence gathering',
      'Only financial records are examined',
      'Stage 2 audits are performed every month after certification',
    ],
    correctAnswer: 1,
    explanation: 'The Stage 2 (main audit) involves an in-depth assessment of how the AIMS is implemented and operated, including observation of processes, review of evidence, and interviews with personnel.',
  },
  {
    id: 3,
    question: 'How often must surveillance audits be conducted after ISO/IEC 42001 certification is awarded?',
    options: ['Every month', 'Annually', 'Every 5 years', 'Never; surveillance audits are not required'],
    correctAnswer: 1,
    explanation: 'After certification, surveillance audits must be conducted at least annually to verify that the AIMS continues to be implemented effectively and conforms to ISO/IEC 42001 requirements.',
  },
  {
    id: 4,
    question: 'What is the certification validity period for ISO/IEC 42001?',
    options: ['1 year', '2 years', '3 years', '5 years'],
    correctAnswer: 2,
    explanation: 'ISO/IEC 42001 certification is valid for 3 years. During this period, annual surveillance audits verify continued conformance, and a recertification audit is conducted before expiration.',
  },
  {
    id: 5,
    question: 'How should an organization select an accredited certification body for ISO/IEC 42001?',
    options: [
      'Any consultant can certify an AIMS',
      'Choose the least expensive option available',
      'Select a certification body accredited by a national accreditation body (like UKAS, ANSI, or equivalent) with credentials in ISO 42001',
      'Certification body selection is not important',
    ],
    correctAnswer: 2,
    explanation: 'Organizations should select a certification body that is accredited by a recognized national accreditation body (such as UKAS in the UK or ANSI in the US) and has specific accreditation for ISO/IEC 42001.',
  },
  {
    id: 6,
    question: 'What is a common nonconformity found during ISO/IEC 42001 audits?',
    options: [
      'Organizations achieving their AI policy objectives',
      'Documented AIMS processes that are not actually being followed in practice (implementation gap)',
      'Having too many internal audits',
      'Non-conformities are rare and unusual',
    ],
    correctAnswer: 1,
    explanation: 'A frequent finding is the gap between documented AIMS procedures and actual implementation, where organizations have policies written but are not following them consistently in practice.',
  },
  {
    id: 7,
    question: 'How should an organization address major nonconformities found during an ISO 42001 audit?',
    options: [
      'Nonconformities can be ignored if they are found by external auditors',
      'Corrective actions must be planned and implemented with root cause analysis, timeline, responsibility, and verification of effectiveness',
      'Major nonconformities automatically mean certification is denied with no opportunity for remediation',
      'Organizations can dispute the auditor\'s findings without taking action',
    ],
    correctAnswer: 1,
    explanation: 'Major nonconformities must be addressed through formal corrective actions that include root cause analysis, action planning, implementation, and verification of effectiveness within an agreed timeframe.',
  },
  {
    id: 8,
    question: 'What is the relationship between ISO/IEC 42001 and ISO 27001 in terms of certification?',
    options: [
      'Organizations must choose one standard or the other',
      'ISO 27001 is required before ISO 42001 certification',
      'Both standards can be certified separately or integrated based on organizational needs, with potential alignment of audit processes',
      'ISO 27001 and ISO 42001 cannot be implemented by the same organization',
    ],
    correctAnswer: 2,
    explanation: 'While ISO 27001 (information security) and ISO/IEC 42001 (AI management) can be certified separately, many organizations integrate them due to their complementary nature and common management system structure.',
  },
  {
    id: 9,
    question: 'How long should corrective actions be completed after a nonconformity is issued?',
    options: [
      'Within 30 days always',
      'No timeframe is specified',
      'Within a timeframe agreed between the organization and certification body, typically 30-90 days depending on severity',
      'Within 1 year',
    ],
    correctAnswer: 2,
    explanation: 'The timeline for corrective action completion is typically agreed during the audit, with major nonconformities usually required to be addressed within 30-60 days and minor within 90 days.',
  },
  {
    id: 10,
    question: 'What should be done to prepare for a recertification audit at the end of the 3-year certification period?',
    options: [
      'Recertification audits are the same as initial certification and require no special preparation',
      'Conduct management review, internal audits, verify improvements have been implemented, ensure nonconformities from previous audits are addressed, and document AIMS updates',
      'Recertification is not required if the organization has complied with all surveillance audits',
      'Organizations can avoid recertification by implementing frequent system updates',
    ],
    correctAnswer: 1,
    explanation: 'For recertification, organizations should conduct a thorough management review, ensure internal audits are current, verify all previous nonconformities have been resolved, and document any improvements or changes to the AIMS.',
  },
];
