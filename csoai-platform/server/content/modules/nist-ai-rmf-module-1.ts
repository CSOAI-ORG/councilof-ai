import type { QuizQuestion } from '@/types/quiz';

export const nistAiRmfModule1Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'When was the NIST AI Risk Management Framework (AI RMF) released?',
    options: [
      'January 2021',
      'January 2023',
      'August 2024',
      'December 2025',
    ],
    correctAnswer: 1,
    explanation: 'The NIST AI RMF 1.0 was released in January 2023 after extensive public consultation. It provides a voluntary framework for managing risks associated with artificial intelligence systems.',
  },
  {
    id: 2,
    question: 'Is the NIST AI RMF mandatory for organizations?',
    options: [
      'Yes, mandatory for all US organizations',
      'No, it is voluntary and flexible',
      'Yes, mandatory for government only',
      'Yes, mandatory for AI companies only',
    ],
    correctAnswer: 1,
    explanation: 'The NIST AI RMF is voluntary and designed to be flexible, adaptable, and applicable to organizations of all sizes and sectors. It provides guidance rather than prescriptive requirements, allowing organizations to tailor implementation to their specific context.',
  },
  {
    id: 3,
    question: 'What are the four core functions of the NIST AI RMF?',
    options: [
      'Plan, Do, Check, Act',
      'Govern, Map, Measure, Manage',
      'Identify, Protect, Detect, Respond',
      'Design, Build, Test, Deploy',
    ],
    correctAnswer: 1,
    explanation: 'The four core functions are GOVERN, MAP, MEASURE, and MANAGE. These functions provide a structured approach to AI risk management: GOVERN establishes policies, MAP identifies context and risks, MEASURE evaluates performance, and MANAGE implements mitigation strategies.',
  },
  {
    id: 4,
    question: 'How many characteristics of trustworthy AI does the NIST AI RMF identify?',
    options: [
      'Three',
      'Five',
      'Seven',
      'Ten',
    ],
    correctAnswer: 2,
    explanation: 'The NIST AI RMF identifies seven characteristics of trustworthy AI: Valid & Reliable, Safe, Secure & Resilient, Accountable & Transparent, Explainable & Interpretable, Privacy-Enhanced, and Fair with Harmful Bias Managed.',
  },
  {
    id: 5,
    question: 'Which framework is the NIST AI RMF designed to align with?',
    options: [
      'Only ISO 27001',
      'Only EU AI Act',
      'Multiple frameworks including NIST CSF, ISO standards, and EU AI Act',
      'No other frameworks',
    ],
    correctAnswer: 2,
    explanation: 'The NIST AI RMF is designed to be interoperable with multiple frameworks including the NIST Cybersecurity Framework (CSF), ISO/IEC standards (42001, 27001), EU AI Act, and other risk management frameworks. This enables organizations to integrate AI risk management into existing processes.',
  },
  {
    id: 6,
    question: 'Who developed the NIST AI RMF?',
    options: [
      'European Commission',
      'US National Institute of Standards and Technology (NIST)',
      'International Organization for Standardization (ISO)',
      'OpenAI',
    ],
    correctAnswer: 1,
    explanation: 'The AI RMF was developed by the US National Institute of Standards and Technology (NIST), a non-regulatory agency of the US Department of Commerce. NIST develops standards and guidelines to promote innovation and industrial competitiveness.',
  },
  {
    id: 7,
    question: 'What is the primary goal of the NIST AI RMF?',
    options: [
      'To prohibit certain AI applications',
      'To help organizations manage AI risks while fostering innovation',
      'To certify AI systems',
      'To regulate AI companies',
    ],
    correctAnswer: 1,
    explanation: 'The primary goal is to help organizations manage AI risks while fostering innovation and maintaining public trust. The framework balances risk management with enabling beneficial AI development, rather than imposing prohibitions or mandatory certification.',
  },
  {
    id: 8,
    question: 'Can small organizations use the NIST AI RMF?',
    options: [
      'No, only for large enterprises',
      'No, only for government agencies',
      'Yes, it is designed to be scalable for organizations of all sizes',
      'No, only for AI developers',
    ],
    correctAnswer: 2,
    explanation: 'Yes, the NIST AI RMF is explicitly designed to be scalable and applicable to organizations of all sizes, from startups to large enterprises. Organizations can tailor the framework to their resources, risk appetite, and AI use cases.',
  },
  {
    id: 9,
    question: 'What methodology does the NIST AI RMF follow?',
    options: [
      'Waterfall',
      'Agile',
      'Risk-based approach with continuous improvement',
      'Six Sigma',
    ],
    correctAnswer: 2,
    explanation: 'The NIST AI RMF follows a risk-based approach with continuous improvement. It emphasizes ongoing monitoring, measurement, and adaptation as AI systems evolve and new risks emerge, rather than a one-time compliance exercise.',
  },
  {
    id: 10,
    question: 'Does the NIST AI RMF apply to all types of AI systems?',
    options: [
      'No, only high-risk AI',
      'No, only machine learning systems',
      'Yes, it applies to all AI systems regardless of risk level',
      'No, only generative AI',
    ],
    correctAnswer: 2,
    explanation: 'Yes, the NIST AI RMF applies to all AI systems, though the depth and rigor of implementation should be proportionate to the risk level. Organizations should tailor their approach based on the specific context, capabilities, and potential impacts of each AI system.',
  },
];
