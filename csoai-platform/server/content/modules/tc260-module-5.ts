import type { QuizQuestion } from '@/types/quiz';

export const tc260Module5Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the scope of TC260 generative AI governance?',
    options: [
      'Only text generation',
      'Text, image, audio, video, and code generation services',
      'Only image generation',
      'Only AI used by government',
    ],
    correctAnswer: 1,
    explanation: 'TC260 generative AI governance covers all forms of AI-generated content including text, images, audio, video, and code, reflecting the broad capabilities of modern generative AI systems.',
  },
  {
    id: 2,
    question: 'What content safety requirements apply to generative AI under TC260?',
    options: [
      'No content restrictions',
      'Prohibition of illegal content, harmful information, and disinformation',
      'Only political content restrictions',
      'Content restrictions are optional',
    ],
    correctAnswer: 1,
    explanation: 'TC260 requires generative AI services to implement content safety measures preventing generation of illegal content, harmful information, false information, and content violating social ethics.',
  },
  {
    id: 3,
    question: 'How must generative AI services handle user-generated prompts under TC260?',
    options: [
      'No review required',
      'Input filtering, content moderation, and inappropriate request rejection',
      'Accept all prompts without limits',
      'Only check for copyright',
    ],
    correctAnswer: 1,
    explanation: 'TC260 requires generative AI services to implement input filtering, content moderation for prompts, and mechanisms to reject requests for harmful or illegal content.',
  },
  {
    id: 4,
    question: 'What labeling requirements apply to AI-generated content under TC260?',
    options: [
      'No labeling required',
      'Clear identification that content is AI-generated',
      'Only for commercial content',
      'Labels are prohibited',
    ],
    correctAnswer: 1,
    explanation: 'TC260 requires that AI-generated content be clearly labeled or identified as AI-generated to prevent confusion with human-created content and combat deepfakes.',
  },
  {
    id: 5,
    question: 'What training data requirements apply to generative AI under TC260?',
    options: [
      'Any data can be used',
      'Legal acquisition, quality assessment, and harmful content filtering',
      'Only public data allowed',
      'No requirements for training data',
    ],
    correctAnswer: 1,
    explanation: 'TC260 requires that generative AI training data be legally acquired, quality-assessed, and filtered to remove harmful, illegal, or biased content before training.',
  },
  {
    id: 6,
    question: 'How does TC260 address generative AI service registration?',
    options: [
      'No registration needed',
      'Registration with CAC required before public service launch',
      'Only for foreign companies',
      'Post-launch registration only',
    ],
    correctAnswer: 1,
    explanation: 'TC260 requires generative AI service providers to register with the Cyberspace Administration of China (CAC) before launching services to the public.',
  },
  {
    id: 7,
    question: 'What user protection measures are required for generative AI under TC260?',
    options: [
      'No user protections',
      'Terms of service, complaint mechanisms, and content appeal processes',
      'Only privacy policy',
      'User protections are optional',
    ],
    correctAnswer: 1,
    explanation: 'TC260 requires comprehensive user protections including clear terms of service, complaint mechanisms for problematic content, and processes for users to appeal content decisions.',
  },
  {
    id: 8,
    question: 'How does TC260 handle synthetic media and deepfakes?',
    options: [
      'No specific rules',
      'Strict identification, consent requirements, and misuse prevention',
      'Deepfakes are completely banned',
      'Only commercial deepfakes regulated',
    ],
    correctAnswer: 1,
    explanation: 'TC260 requires strict controls on synthetic media including identification labels, consent from depicted individuals, and measures to prevent misuse for fraud or defamation.',
  },
  {
    id: 9,
    question: 'What ongoing monitoring is required for generative AI services under TC260?',
    options: [
      'No monitoring required',
      'Continuous content monitoring, incident reporting, and model updates',
      'Only annual reviews',
      'Monitoring is prohibited',
    ],
    correctAnswer: 1,
    explanation: 'TC260 requires continuous monitoring of generative AI outputs, prompt reporting of content safety incidents, and regular updates to address emerging risks.',
  },
  {
    id: 10,
    question: 'What security assessments are required for generative AI under TC260?',
    options: [
      'No assessments needed',
      'Pre-launch algorithm assessment and ongoing security evaluations',
      'Only penetration testing',
      'Assessment is voluntary',
    ],
    correctAnswer: 1,
    explanation: 'TC260 requires pre-launch algorithm security assessments for generative AI services, followed by ongoing security evaluations to identify and address vulnerabilities.',
  },
];
