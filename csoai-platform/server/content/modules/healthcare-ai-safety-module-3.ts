import type { QuizQuestion } from '@/types/quiz';

export const healthcareAiSafetyModule3Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is "AI-assisted diagnosis" versus "AI-autonomous diagnosis"?',
    options: [
      'They are the same thing',
      'AI-assisted supports clinician decisions while AI-autonomous makes independent diagnostic determinations',
      'AI-assisted is for emergency care only',
      'AI-autonomous requires human confirmation',
    ],
    correctAnswer: 1,
    explanation: 'AI-assisted diagnosis supports clinician decision-making while maintaining human oversight, whereas AI-autonomous diagnosis makes independent diagnostic determinations, which faces stricter regulatory scrutiny.',
  },
  {
    id: 2,
    question: 'What is "interoperability" in healthcare AI systems?',
    options: [
      'AI systems that can operate internationally',
      'The ability of AI systems to exchange and use information with other healthcare systems',
      'Operating AI across different hospitals',
      'International AI standards',
    ],
    correctAnswer: 1,
    explanation: 'Interoperability refers to the ability of healthcare AI systems to exchange and effectively use information with electronic health records, other clinical systems, and healthcare IT infrastructure.',
  },
  {
    id: 3,
    question: 'What is "fail-safe design" in healthcare AI?',
    options: [
      'AI that never fails',
      'Design ensuring AI systems default to safe states when errors or failures occur',
      'Safe storage of AI systems',
      'Backup AI systems',
    ],
    correctAnswer: 1,
    explanation: 'Fail-safe design ensures that when healthcare AI systems encounter errors, malfunctions, or unexpected situations, they default to safe states that prevent patient harm.',
  },
  {
    id: 4,
    question: 'What is "alert fatigue" in clinical AI systems?',
    options: [
      'Tired clinicians missing alerts',
      'Clinicians becoming desensitized to AI alerts due to excessive or false alarms',
      'Fatigue in alert systems',
      'Slow alert processing',
    ],
    correctAnswer: 1,
    explanation: 'Alert fatigue occurs when clinicians become desensitized to AI alerts due to excessive or frequent false alarms, potentially causing them to miss or ignore critical warnings.',
  },
  {
    id: 5,
    question: 'What is the "black box problem" in healthcare AI?',
    options: [
      'Physical appearance of AI hardware',
      'Difficulty understanding how complex AI models reach clinical decisions',
      'Hidden costs of AI systems',
      'Secure storage requirements',
    ],
    correctAnswer: 1,
    explanation: 'The black box problem refers to the difficulty in understanding how complex AI models (especially deep learning) reach their clinical decisions, which can challenge trust, oversight, and regulatory approval.',
  },
  {
    id: 6,
    question: 'What is "informed consent" regarding healthcare AI?',
    options: [
      'Consent for AI developers',
      'Patient understanding and agreement to have AI involved in their care',
      'Consent for data collection only',
      'Hospital consent for AI purchase',
    ],
    correctAnswer: 1,
    explanation: 'Informed consent for healthcare AI involves ensuring patients understand when and how AI is involved in their care and have the opportunity to consent to or refuse AI-assisted diagnosis or treatment.',
  },
  {
    id: 7,
    question: 'What is "calibration" in healthcare AI diagnostics?',
    options: [
      'Calibrating medical equipment',
      'Ensuring predicted probabilities accurately reflect true clinical outcomes',
      'Calibrating AI hardware',
      'Setting up AI systems',
    ],
    correctAnswer: 1,
    explanation: 'Calibration in healthcare AI ensures that when the system predicts a probability (e.g., 80% chance of disease), the actual observed rate of the condition matches that predicted probability.',
  },
  {
    id: 8,
    question: 'What is "clinical integration" of healthcare AI?',
    options: [
      'Integrating clinics together',
      'Effectively incorporating AI into clinical workflows and decision-making processes',
      'Integrating AI vendors',
      'Combining multiple AI systems',
    ],
    correctAnswer: 1,
    explanation: 'Clinical integration involves effectively incorporating AI systems into existing clinical workflows, ensuring they enhance rather than disrupt care delivery and are used appropriately by healthcare professionals.',
  },
  {
    id: 9,
    question: 'What is "model drift" in healthcare AI?',
    options: [
      'Moving AI to different locations',
      'Degradation in AI performance over time as data patterns change',
      'Changes in AI pricing',
      'Shifting AI responsibilities',
    ],
    correctAnswer: 1,
    explanation: 'Model drift occurs when AI performance degrades over time because the characteristics of incoming data differ from the data used to train the model, requiring ongoing monitoring and retraining.',
  },
  {
    id: 10,
    question: 'What is "human-AI teaming" in healthcare?',
    options: [
      'AI competing with humans',
      'Collaborative approach where AI augments clinician capabilities while humans provide oversight',
      'Teams of humans who develop AI',
      'AI training human clinicians',
    ],
    correctAnswer: 1,
    explanation: 'Human-AI teaming is a collaborative approach where AI systems augment clinician capabilities and decision-making while humans provide oversight, context, and final judgment on patient care.',
  },
];
