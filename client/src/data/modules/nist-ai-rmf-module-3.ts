import type { QuizQuestion } from '@/types/quiz';

export const nistAiRmfModule3Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the primary purpose of the MAP function in the NIST AI RMF?',
    options: [
      'To deploy AI models to production',
      'To identify, assess, and categorize risks associated with AI systems',
      'To measure the performance of AI models',
      'To train new machine learning models',
    ],
    correctAnswer: 1,
    explanation: 'The MAP function focuses on identifying, characterizing, and prioritizing risks associated with AI systems. It involves understanding the context, assessing potential risks, and mapping stakeholder impacts.',
  },
  {
    id: 2,
    question: 'Which of the following is a key activity in the context identification phase of MAP?',
    options: [
      'Deploying the AI model to users',
      'Understanding the intended use case, stakeholders, and operational environment of the AI system',
      'Measuring the accuracy of predictions',
      'Testing the robustness of the model',
    ],
    correctAnswer: 1,
    explanation: 'Context identification involves understanding the specific use case, intended purpose, stakeholders, operational environment, and constraints. This foundation is essential for effective risk assessment.',
  },
  {
    id: 3,
    question: 'What is "risk categorization" in the context of the MAP function?',
    options: [
      'Ranking AI projects by budget size',
      'Grouping risks by type or dimension, such as fairness, security, robustness, and transparency',
      'Sorting AI models by accuracy',
      'Organizing data by file size',
    ],
    correctAnswer: 1,
    explanation: 'Risk categorization involves grouping risks by meaningful dimensions such as fairness and bias, security and robustness, transparency and explainability, and other relevant risk categories.',
  },
  {
    id: 4,
    question: 'What does "stakeholder impact mapping" help organizations understand?',
    options: [
      'How much budget each department needs',
      'Which individuals or groups may be affected by the AI system and how they might be impacted',
      'The computational resources required for the AI model',
      'The timeline for model training',
    ],
    correctAnswer: 1,
    explanation: 'Stakeholder impact mapping identifies who will be affected by an AI system (e.g., users, customers, employees, the public) and assesses how different stakeholder groups might experience positive or negative impacts.',
  },
  {
    id: 5,
    question: 'Which of the following is a potential data risk that should be identified during the MAP function?',
    options: [
      'The color of the visualization dashboard',
      'Bias in training data, data quality issues, or inadequate representation of certain populations',
      'The programming language used to develop the model',
      'The size of the development team',
    ],
    correctAnswer: 1,
    explanation: 'Data risks include issues such as bias in training data, missing data, data quality problems, inadequate representation of minority populations, and privacy concerns related to personal data.',
  },
  {
    id: 6,
    question: 'What types of model risks should be addressed during MAP?',
    options: [
      'Whether the model is built with Python or R',
      'Risks related to model performance, robustness, interpretability, and potential for misuse',
      'The storage capacity needed for the model',
      'Whether the model uses deep learning or traditional ML',
    ],
    correctAnswer: 1,
    explanation: 'Model risks encompass performance degradation, adversarial attacks, lack of robustness to input variations, poor explainability, and potential for misuse or unintended consequences.',
  },
  {
    id: 7,
    question: 'Why is third-party and supply chain risk assessment important in the MAP function?',
    options: [
      'To reduce the cost of AI projects',
      'To accelerate model deployment',
      'Because AI systems often depend on external components, data sources, or services that may introduce risks',
      'To simplify project management',
    ],
    correctAnswer: 2,
    explanation: 'Organizations often depend on third-party data providers, open-source models, cloud services, and other external components. Assessing these supply chain risks is essential for understanding overall system risk.',
  },
  {
    id: 8,
    question: 'What should be included in a comprehensive risk assessment during MAP?',
    options: [
      'Only technical performance metrics',
      'Only compliance requirements',
      'A holistic assessment covering technical, operational, social, and regulatory dimensions of risk',
      'Only financial considerations',
    ],
    correctAnswer: 2,
    explanation: 'Comprehensive risk assessment in MAP should address technical risks, operational risks, societal impacts, fairness and bias concerns, security risks, regulatory compliance, and other relevant dimensions.',
  },
  {
    id: 9,
    question: 'How does MAP help inform decisions about which AI projects to pursue?',
    options: [
      'It does not influence project decisions',
      'By providing a systematic understanding of risks, organizations can make informed decisions about whether to proceed, modify scope, or avoid certain AI projects',
      'It only provides guidance after projects are complete',
      'It is used only for documentation purposes',
    ],
    correctAnswer: 1,
    explanation: 'The risk assessment from MAP provides crucial information to inform governance decisions about which AI projects align with organizational risk tolerance and which may require scope modifications or risk mitigation.',
  },
  {
    id: 10,
    question: 'Which of the following best represents the relationship between MAP and the other RMF functions?',
    options: [
      'MAP is independent of other functions',
      'MAP identifies and characterizes risks that inform the MEASURE and MANAGE functions',
      'MAP is only used after MEASURE is complete',
      'MAP replaces the need for the GOVERN function',
    ],
    correctAnswer: 1,
    explanation: 'The MAP function is fundamental to the RMF process. The risks identified and characterized in MAP directly inform what needs to be measured, how it should be measured, and what management strategies are appropriate.',
  },
];
