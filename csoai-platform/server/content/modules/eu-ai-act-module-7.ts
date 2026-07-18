import type { QuizQuestion } from '@/types/quiz';

export const euAiActModule7Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What must providers disclose when AI systems interact with natural persons?',
    options: [
      'The cost of the system',
      'That the person is interacting with an AI system',
      'The training data sources',
      'The system architecture',
    ],
    correctAnswer: 1,
    explanation: 'Article 52 requires that when AI systems interact with natural persons, they must be designed to inform people that they are interacting with an AI system, unless this is obvious from the circumstances. This applies to chatbots, virtual assistants, and similar systems.',
  },
  {
    id: 2,
    question: 'What must be disclosed when AI generates or manipulates image, audio, or video content?',
    options: [
      'The AI model used',
      'That the content has been artificially generated or manipulated',
      'The cost of generation',
      'The training dataset',
    ],
    correctAnswer: 1,
    explanation: 'Article 52 requires clear disclosure that content has been artificially generated or manipulated when AI creates deepfakes or synthetic media. This helps combat misinformation and protects people from being deceived by AI-generated content.',
  },
  {
    id: 3,
    question: 'What defines a General Purpose AI (GPAI) model?',
    options: [
      'AI used only by government',
      'AI trained on general data that can perform a wide range of tasks',
      'AI with human-level intelligence',
      'AI used in multiple countries',
    ],
    correctAnswer: 1,
    explanation: 'GPAI models are trained on broad data at scale and can perform a wide range of tasks (like GPT-4, Claude, Gemini). They are distinguished from specialized AI systems designed for specific tasks.',
  },
  {
    id: 4,
    question: 'What are the two tiers of GPAI regulation?',
    options: [
      'Free and Premium',
      'Baseline and Systemic Risk',
      'Open Source and Proprietary',
      'Domestic and International',
    ],
    correctAnswer: 1,
    explanation: 'The EU AI Act creates two tiers: Baseline GPAI (lighter obligations like transparency and copyright compliance) and GPAI with Systemic Risk (additional obligations like model evaluation, adversarial testing, and incident reporting).',
  },
  {
    id: 5,
    question: 'When is a GPAI model considered to have "systemic risk"?',
    options: [
      'When it costs over €10 million',
      'When it has high impact capabilities, typically with >10^25 FLOPs',
      'When it has over 1 million users',
      'When it is used in healthcare',
    ],
    correctAnswer: 1,
    explanation: 'A GPAI model has systemic risk if it has high impact capabilities, assessed primarily by computational power used for training (>10^25 FLOPs) or other indicators like advanced capabilities, wide reach, or potential for serious negative impacts.',
  },
  {
    id: 6,
    question: 'What must GPAI providers document?',
    options: [
      'Only the model architecture',
      'Training data, model capabilities, limitations, and copyright compliance',
      'Only the API documentation',
      'Just the pricing structure',
    ],
    correctAnswer: 1,
    explanation: 'Article 53 requires GPAI providers to prepare technical documentation on training data (including copyright compliance), model architecture, capabilities, limitations, and measures to ensure compliance with copyright law.',
  },
  {
    id: 7,
    question: 'What is the role of the AI Office?',
    options: [
      'To develop AI systems',
      'To supervise GPAI models and coordinate EU-wide enforcement',
      'To fund AI research',
      'To train AI professionals',
    ],
    correctAnswer: 1,
    explanation: 'The AI Office (within the European Commission) supervises GPAI models, coordinates enforcement across member states, maintains the EU database of AI systems, and provides guidance on the AI Act\'s implementation.',
  },
  {
    id: 8,
    question: 'What is the European AI Board?',
    options: [
      'A company that develops AI',
      'An advisory body of member state representatives',
      'A court for AI disputes',
      'A research institution',
    ],
    correctAnswer: 1,
    explanation: 'The European AI Board consists of representatives from all member states and advises the Commission on AI Act implementation, promotes consistent application across the EU, and facilitates cooperation between national authorities.',
  },
  {
    id: 9,
    question: 'What must deployers of emotion recognition or biometric categorization systems disclose?',
    options: [
      'Nothing, these systems are prohibited',
      'That the system is being used to process their personal data',
      'The cost of the system',
      'The vendor name',
    ],
    correctAnswer: 1,
    explanation: 'Article 26 requires deployers of emotion recognition or biometric categorization systems to inform natural persons that they are being subjected to such systems. This transparency requirement protects people\'s dignity and privacy.',
  },
  {
    id: 10,
    question: 'Can GPAI providers be held liable if their model is used in a high-risk AI system?',
    options: [
      'Yes, they are always liable',
      'No, liability transfers to the high-risk AI system provider',
      'Yes, but only for systemic risk models',
      'No, GPAI providers are exempt from liability',
    ],
    correctAnswer: 1,
    explanation: 'Liability primarily rests with the provider of the high-risk AI system, not the GPAI model provider. However, GPAI providers must still comply with their own obligations (transparency, copyright, systemic risk measures) and could face penalties for non-compliance with those.',
  },
];
