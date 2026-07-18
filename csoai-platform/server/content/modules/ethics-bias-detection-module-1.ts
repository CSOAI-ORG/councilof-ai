import type { QuizQuestion } from '@/types/quiz';

export const ethicsBiasDetectionModule1Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is "algorithmic bias" in AI systems?',
    options: [
      'A mathematical optimization technique',
      'Systematic errors in AI outputs that create unfair outcomes for certain groups',
      'Bias in algorithm selection by developers',
      'Preference for certain programming languages',
    ],
    correctAnswer: 1,
    explanation: 'Algorithmic bias refers to systematic and repeatable errors in AI systems that create unfair outcomes for certain groups, often based on characteristics like race, gender, age, or socioeconomic status.',
  },
  {
    id: 2,
    question: 'Which type of bias occurs when training data does not accurately represent the population the AI will serve?',
    options: [
      'Confirmation bias',
      'Selection bias',
      'Representation bias',
      'Automation bias',
    ],
    correctAnswer: 2,
    explanation: 'Representation bias occurs when the training data does not accurately represent the population the AI system will serve, leading to poor performance or unfair outcomes for underrepresented groups.',
  },
  {
    id: 3,
    question: 'What is "historical bias" in AI training data?',
    options: [
      'Using data from too long ago',
      'Bias in how historical events are recorded',
      'When training data reflects past discrimination and societal inequities',
      'Preference for historical data over recent data',
    ],
    correctAnswer: 2,
    explanation: 'Historical bias occurs when training data reflects past discrimination and societal inequities. Even accurate historical data can perpetuate bias if it encodes discriminatory patterns from the past.',
  },
  {
    id: 4,
    question: 'What is "measurement bias" in AI systems?',
    options: [
      'Using incorrect units of measurement',
      'When the features or labels used to train AI systematically differ across groups',
      'Errors in measuring AI performance',
      'Bias in how AI accuracy is reported',
    ],
    correctAnswer: 1,
    explanation: 'Measurement bias occurs when the features, proxies, or labels used to train AI systems are defined or measured differently across groups, leading to systematic errors in predictions for certain populations.',
  },
  {
    id: 5,
    question: 'Which famous case demonstrated gender bias in AI hiring systems?',
    options: [
      'Google Photos labeling incident',
      'Amazon recruitment AI bias case',
      'COMPAS recidivism tool',
      'Microsoft Tay chatbot',
    ],
    correctAnswer: 1,
    explanation: 'Amazon\'s AI recruitment system was found to systematically disadvantage women because it was trained on historical hiring data that reflected past gender imbalances in the tech industry.',
  },
  {
    id: 6,
    question: 'What is "disparate impact" in the context of AI fairness?',
    options: [
      'Different AI systems producing different results',
      'When a seemingly neutral AI practice disproportionately affects protected groups',
      'Impact of AI on different industries',
      'Varying impact of AI on different hardware',
    ],
    correctAnswer: 1,
    explanation: 'Disparate impact occurs when a seemingly neutral AI practice or decision disproportionately affects members of protected groups, even without intentional discrimination.',
  },
  {
    id: 7,
    question: 'What does "demographic parity" mean as a fairness metric?',
    options: [
      'Equal numbers of users from each demographic',
      'Equal positive outcome rates across different demographic groups',
      'Equal representation in AI development teams',
      'Equal access to AI technology',
    ],
    correctAnswer: 1,
    explanation: 'Demographic parity (or statistical parity) requires that the rate of positive outcomes be equal across different demographic groups. It\'s one of several mathematical definitions of fairness.',
  },
  {
    id: 8,
    question: 'What is "equalized odds" as a fairness criterion?',
    options: [
      'All predictions have equal probability',
      'Equal true positive and false positive rates across groups',
      'Equal distribution of positive and negative outcomes',
      'Randomizing predictions to ensure fairness',
    ],
    correctAnswer: 1,
    explanation: 'Equalized odds requires that an AI system have equal true positive rates and equal false positive rates across protected groups. This means the error rates are balanced across groups.',
  },
  {
    id: 9,
    question: 'What is "automation bias"?',
    options: [
      'Bias in automated manufacturing',
      'The tendency to over-rely on automated decision-making systems',
      'Preference for automated over manual processes',
      'Bias in automation software',
    ],
    correctAnswer: 1,
    explanation: 'Automation bias is the human tendency to over-rely on automated decision-making systems, often accepting AI recommendations without sufficient critical evaluation, which can amplify AI biases.',
  },
  {
    id: 10,
    question: 'What is "intersectionality" in the context of AI bias?',
    options: [
      'How different AI systems interact',
      'Where different road systems meet',
      'How multiple identity characteristics combine to create unique bias experiences',
      'The intersection of AI and other technologies',
    ],
    correctAnswer: 2,
    explanation: 'Intersectionality recognizes that individuals with multiple marginalized identities may experience unique forms of bias that are not captured by analyzing single characteristics alone (e.g., bias against Black women differs from bias against Black men or white women).',
  },
];
