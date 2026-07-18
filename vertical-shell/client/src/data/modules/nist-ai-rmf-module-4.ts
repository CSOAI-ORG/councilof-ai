import type { QuizQuestion } from '@/types/quiz';

export const nistAiRmfModule4Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the primary goal of the MEASURE function in the NIST AI RMF?',
    options: [
      'To design AI models with maximum accuracy',
      'To quantify and assess identified risks through metrics and testing',
      'To deploy AI systems to production',
      'To eliminate all AI-related risks',
    ],
    correctAnswer: 1,
    explanation: 'The MEASURE function focuses on quantifying, assessing, and evaluating identified risks through various metrics, tests, and evaluation approaches.',
  },
  {
    id: 2,
    question: 'What is the difference between quantitative and qualitative risk metrics in AI assessment?',
    options: [
      'Quantitative metrics are always better than qualitative metrics',
      'Quantitative metrics use numerical measurements, while qualitative metrics describe risks using descriptive language and expert judgment',
      'They are the same thing',
      'Qualitative metrics are only used in healthcare',
    ],
    correctAnswer: 1,
    explanation: 'Quantitative metrics provide numerical measurements of risk (e.g., false positive rate, model accuracy). Qualitative metrics involve descriptive assessments based on expert judgment and stakeholder perspectives.',
  },
  {
    id: 3,
    question: 'What type of testing is essential for identifying fairness and bias issues in AI models?',
    options: [
      'Only accuracy testing',
      'Fairness testing, bias detection, and evaluation across demographic groups and use cases',
      'Only speed tests',
      'No specific testing is needed',
    ],
    correctAnswer: 1,
    explanation: 'Fairness and bias testing involves evaluating model performance across different demographic groups, geographic regions, and other relevant segments to identify disparate impacts.',
  },
  {
    id: 4,
    question: 'What does "robustness testing" measure in AI systems?',
    options: [
      'How quickly the model trains',
      'How well the model handles adversarial inputs, noisy data, and edge cases',
      'The cost of the AI project',
      'The color scheme of the user interface',
    ],
    correctAnswer: 1,
    explanation: 'Robustness testing evaluates how an AI system performs under adverse conditions, including adversarial attacks, noisy or corrupted data, and inputs outside its expected operating range.',
  },
  {
    id: 5,
    question: 'Which of the following is a key performance evaluation criterion for responsible AI?',
    options: [
      'Maximizing profit regardless of impact',
      'Accuracy on the majority population only',
      'Performance that is both accurate and fair across different demographic groups and use cases',
      'Speed of predictions above all else',
    ],
    correctAnswer: 2,
    explanation: 'Responsible AI performance evaluation requires considering not just overall accuracy but also fairness across groups, robustness, security, and alignment with organizational values.',
  },
  {
    id: 6,
    question: 'What is continuous monitoring in the context of MEASURE?',
    options: [
      'Checking model accuracy once before deployment',
      'Ongoing assessment of AI system performance, risks, and impacts throughout the system lifecycle',
      'Monitoring only the servers the model runs on',
      'Checking for model accuracy only during development',
    ],
    correctAnswer: 1,
    explanation: 'Continuous monitoring involves systematically tracking model performance, identifying drift, detecting new risks, and assessing impacts on stakeholders throughout the system\'s operational life.',
  },
  {
    id: 7,
    question: 'Why is model explainability important as a measurement criterion?',
    options: [
      'It is not important',
      'It helps stakeholders understand how the model makes decisions and builds trust in the system',
      'It only matters for marketing purposes',
      'It is only needed for simple models',
    ],
    correctAnswer: 1,
    explanation: 'Explainability helps users, stakeholders, and regulators understand how AI systems make decisions. This is especially critical for high-stakes applications where decisions affect individuals.',
  },
  {
    id: 8,
    question: 'What types of tools and approaches should be used in the MEASURE function?',
    options: [
      'Only manual testing',
      'A combination of automated testing tools, statistical analysis, fairness frameworks, explainability methods, and expert evaluation',
      'Only machine learning models',
      'No tools are needed',
    ],
    correctAnswer: 1,
    explanation: 'MEASURE employs diverse approaches including automated testing tools, statistical analysis, fairness toolkits, explainability frameworks, simulation, expert review, and user testing.',
  },
  {
    id: 9,
    question: 'What is benchmarking in the context of AI risk measurement?',
    options: [
      'The initial development phase of an AI model',
      'Comparing an AI system\'s performance and risk characteristics against standards, baselines, or similar systems',
      'The deployment of a model to production',
      'Training the model to high accuracy',
    ],
    correctAnswer: 1,
    explanation: 'Benchmarking involves comparing an AI system\'s performance, fairness, robustness, and other risk characteristics against established standards, baseline models, or similar systems in the field.',
  },
  {
    id: 10,
    question: 'How does MEASURE support the MANAGE function?',
    options: [
      'MEASURE and MANAGE are independent',
      'Measurement results inform MANAGE decisions about which risks require mitigation, acceptance, or avoidance',
      'MANAGE is not needed if MEASURE is done well',
      'MEASURE only supports the GOVERN function',
    ],
    correctAnswer: 1,
    explanation: 'The metrics, test results, and risk assessments produced by MEASURE directly inform the MANAGE function\'s decisions about risk response strategies and mitigation measures.',
  },
];
