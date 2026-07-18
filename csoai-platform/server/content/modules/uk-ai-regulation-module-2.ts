import type { QuizQuestion } from '@/types/quiz';

export const ukAiRegulationModule2Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What does "contestability" mean in the UK\'s AI principles?',
    options: [
      'The ability to compete with AI systems',
      'The ability for individuals to challenge AI decisions and seek human review or redress',
      'The competitive nature of the AI market',
      'The ability to contest AI patents',
    ],
    correctAnswer: 1,
    explanation: 'Contestability refers to ensuring individuals can challenge AI decisions that affect them, seek human review, and obtain appropriate redress when AI systems cause harm or make errors.',
  },
  {
    id: 2,
    question: 'How does the UK\'s sector-based approach affect AI developers?',
    options: [
      'They only need to comply with one regulator',
      'They may need to comply with multiple sector-specific regulators depending on their AI application',
      'No regulatory compliance is required',
      'Only EU regulations apply to UK developers',
    ],
    correctAnswer: 1,
    explanation: 'Under the UK\'s sector-based approach, AI developers may need to navigate requirements from multiple regulators (e.g., ICO for data, FCA for finance, CQC for healthcare) depending on their application domain.',
  },
  {
    id: 3,
    question: 'What is the UK\'s position on regulating general-purpose AI (GPAI)?',
    options: [
      'All GPAI is banned',
      'GPAI is exempt from all regulation',
      'Exploring appropriate oversight for frontier AI models through the AI Safety Institute',
      'Only EU regulations apply to GPAI in the UK',
    ],
    correctAnswer: 2,
    explanation: 'The UK is exploring appropriate oversight for general-purpose and frontier AI models through the AI Safety Institute, focusing on safety testing and evaluation rather than immediate legislation.',
  },
  {
    id: 4,
    question: 'What rights do UK citizens have regarding automated decision-making under UK GDPR?',
    options: [
      'No specific rights for automated decisions',
      'Right to not be subject to solely automated decisions with legal/significant effects, with exceptions',
      'Automatic right to compensation for any automated decision',
      'Right to opt out of all AI systems',
    ],
    correctAnswer: 1,
    explanation: 'Under UK GDPR Article 22, individuals have the right not to be subject to decisions based solely on automated processing that produce legal or similarly significant effects, with certain exceptions.',
  },
  {
    id: 5,
    question: 'What is the "Alan Turing Institute" in the UK AI governance landscape?',
    options: [
      'A regulatory enforcement body',
      'The UK\'s national institute for data science and AI, providing research and policy guidance',
      'A private AI company',
      'The UK\'s AI patent office',
    ],
    correctAnswer: 1,
    explanation: 'The Alan Turing Institute is the UK\'s national institute for data science and AI, conducting research and providing guidance on AI ethics, governance, and policy to inform the regulatory landscape.',
  },
  {
    id: 6,
    question: 'How does the UK approach AI in healthcare regulation?',
    options: [
      'No specific healthcare AI regulation exists',
      'MHRA and CQC provide sector-specific oversight for medical AI devices and healthcare delivery',
      'All healthcare AI must be approved by the EU',
      'Healthcare AI is completely unregulated',
    ],
    correctAnswer: 1,
    explanation: 'The MHRA (Medicines and Healthcare products Regulatory Agency) regulates AI as medical devices, while the CQC oversees AI use in healthcare delivery, ensuring patient safety and quality of care.',
  },
  {
    id: 7,
    question: 'What is the UK\'s approach to AI transparency requirements?',
    options: [
      'No transparency requirements exist',
      'Regulators are expected to interpret and apply transparency principles within their sectors',
      'All AI decisions must be published publicly',
      'Only chatbots require transparency disclosure',
    ],
    correctAnswer: 1,
    explanation: 'Under the UK framework, sector regulators interpret and apply transparency principles within their domains, requiring appropriate disclosure of AI use based on context and potential impact.',
  },
  {
    id: 8,
    question: 'What penalties can UK regulators impose for AI-related violations?',
    options: [
      'Only warnings with no financial penalties',
      'Sector-specific penalties apply, with ICO able to impose fines up to 17.5M or 4% of turnover under UK GDPR',
      'Maximum penalty of 1000 pounds',
      'Only EU can impose penalties',
    ],
    correctAnswer: 1,
    explanation: 'UK regulators can impose sector-specific penalties. The ICO can fine up to 17.5 million pounds or 4% of global turnover under UK GDPR, while other regulators have their own enforcement powers.',
  },
  {
    id: 9,
    question: 'What is the relationship between UK AI regulation and the EU AI Act post-Brexit?',
    options: [
      'UK automatically follows EU AI Act',
      'UK has developed its own approach but organizations operating in both jurisdictions must comply with both',
      'EU AI Act has no relevance to UK organizations',
      'UK regulations are stricter than EU in all areas',
    ],
    correctAnswer: 1,
    explanation: 'Post-Brexit, the UK has developed its own regulatory approach. However, UK organizations operating in the EU or serving EU customers must still comply with the EU AI Act.',
  },
  {
    id: 10,
    question: 'What is the UK government\'s stance on AI innovation versus regulation?',
    options: [
      'Regulation should completely stop AI innovation',
      'Balance pro-innovation approach with proportionate safeguards to maintain global competitiveness',
      'No regulation is needed for innovation',
      'Only foreign AI companies should be regulated',
    ],
    correctAnswer: 1,
    explanation: 'The UK emphasizes a pro-innovation approach that balances fostering AI development with proportionate safeguards, aiming to maintain global competitiveness while addressing legitimate concerns.',
  },
];
