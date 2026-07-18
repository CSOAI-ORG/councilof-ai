import type { QuizQuestion } from '@/types/quiz';

export const nistAiRmfModule2Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What does "Valid & Reliable" mean for AI systems?',
    options: [
      'The system is expensive',
      'The system performs consistently and accurately across contexts',
      'The system is fast',
      'The system uses the latest technology',
    ],
    correctAnswer: 1,
    explanation: 'Valid & Reliable means the AI system performs its intended function consistently and accurately across different contexts, populations, and time periods. This includes technical robustness, generalization ability, and reproducibility of results.',
  },
  {
    id: 2,
    question: 'What is the primary concern of the "Safe" characteristic?',
    options: [
      'Cybersecurity threats',
      'Financial risks',
      'Physical and psychological harm to people and the environment',
      'Legal compliance',
    ],
    correctAnswer: 2,
    explanation: 'The "Safe" characteristic focuses on preventing physical and psychological harm to people, communities, organizations, and the environment. This includes safety testing, fail-safe mechanisms, and ongoing monitoring for harmful outcomes.',
  },
  {
    id: 3,
    question: 'What does "Secure & Resilient" encompass?',
    options: [
      'Only cybersecurity protections',
      'Protection against attacks and ability to recover from disruptions',
      'Only physical security',
      'Only data backup',
    ],
    correctAnswer: 1,
    explanation: 'Secure & Resilient encompasses both protection against adversarial attacks (cybersecurity) and the ability to recover from disruptions (resilience). This includes defending against data poisoning, model theft, adversarial examples, and maintaining functionality under stress.',
  },
  {
    id: 4,
    question: 'What is a key component of "Accountable & Transparent"?',
    options: [
      'Keeping all AI details secret',
      'Clear documentation and ability to trace decisions',
      'Using the cheapest technology',
      'Automating everything',
    ],
    correctAnswer: 1,
    explanation: 'Accountable & Transparent requires clear documentation of AI system design, data sources, decision-making processes, and the ability to trace decisions back to their origins. This enables oversight, audit, and accountability for AI outcomes.',
  },
  {
    id: 5,
    question: 'What does "Explainable & Interpretable" mean?',
    options: [
      'The AI must use simple algorithms only',
      'Stakeholders can understand how and why the AI makes decisions',
      'The AI must be open source',
      'The AI must be slow',
    ],
    correctAnswer: 1,
    explanation: 'Explainable & Interpretable means that stakeholders (users, affected individuals, auditors) can understand how and why the AI system makes specific decisions. The level of explanation should be appropriate to the audience and the system\'s impact.',
  },
  {
    id: 6,
    question: 'What is the focus of "Privacy-Enhanced"?',
    options: [
      'Collecting as much data as possible',
      'Protecting personal data and respecting privacy throughout the AI lifecycle',
      'Avoiding all data collection',
      'Using only public data',
    ],
    correctAnswer: 1,
    explanation: 'Privacy-Enhanced focuses on protecting personal data and respecting privacy throughout the entire AI lifecycle—from data collection and training to deployment and monitoring. This includes data minimization, consent, anonymization, and compliance with privacy regulations.',
  },
  {
    id: 7,
    question: 'What does "Fair with Harmful Bias Managed" address?',
    options: [
      'Ensuring equal outcomes for everyone',
      'Identifying and mitigating harmful biases that lead to unjust impacts',
      'Removing all statistical differences',
      'Treating everyone identically',
    ],
    correctAnswer: 1,
    explanation: 'This characteristic addresses identifying and mitigating harmful biases that lead to unjust or inequitable impacts on individuals or groups. Fairness is context-dependent and requires ongoing assessment, not simply equal outcomes or identical treatment.',
  },
  {
    id: 8,
    question: 'Can an AI system be considered trustworthy if it only meets some of the seven characteristics?',
    options: [
      'Yes, any three characteristics are sufficient',
      'Yes, as long as it is accurate',
      'No, all seven characteristics should be addressed proportionate to risk',
      'Yes, organizations can choose which to implement',
    ],
    correctAnswer: 2,
    explanation: 'No, trustworthy AI requires addressing all seven characteristics, though the depth of implementation should be proportionate to the AI system\'s risk level and context. Neglecting any characteristic can undermine trust and lead to harmful outcomes.',
  },
  {
    id: 9,
    question: 'Are the seven trustworthy AI characteristics static or evolving?',
    options: [
      'Static—they never change',
      'Evolving—they should be reassessed as AI systems and contexts change',
      'Static for 5 years',
      'Only change when regulations require it',
    ],
    correctAnswer: 1,
    explanation: 'The seven characteristics are evolving and should be continuously reassessed as AI systems change, new risks emerge, societal expectations shift, and technology advances. Trustworthiness is not a one-time achievement but an ongoing commitment.',
  },
  {
    id: 10,
    question: 'Which characteristic is most directly related to preventing discrimination?',
    options: [
      'Valid & Reliable',
      'Secure & Resilient',
      'Fair with Harmful Bias Managed',
      'Privacy-Enhanced',
    ],
    correctAnswer: 2,
    explanation: 'Fair with Harmful Bias Managed is most directly related to preventing discrimination. It focuses on identifying and mitigating biases that could lead to unjust treatment of individuals or groups based on protected characteristics or other sensitive attributes.',
  },
];
