import type { QuizQuestion } from '@/types/quiz';

export const nistAiRmfModule5Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the primary purpose of the MEASURE function?',
    options: [
      'To count AI systems',
      'To assess, analyze, and track AI risks and trustworthy characteristics using metrics',
      'To measure development costs',
      'To measure team productivity',
    ],
    correctAnswer: 1,
    explanation: 'The MEASURE function uses quantitative and qualitative metrics, testing, and evaluation to assess, analyze, and track AI risks and trustworthy AI characteristics throughout the AI lifecycle. It provides evidence for informed decision-making.',
  },
  {
    id: 2,
    question: 'What types of metrics should be used to measure AI systems?',
    options: [
      'Only accuracy metrics',
      'A combination of technical, operational, and socio-technical metrics aligned with trustworthy AI characteristics',
      'Only cost metrics',
      'Only speed metrics',
    ],
    correctAnswer: 1,
    explanation: 'Organizations should use a combination of technical metrics (accuracy, robustness), operational metrics (performance, reliability), and socio-technical metrics (fairness, transparency, accountability) that align with the seven trustworthy AI characteristics.',
  },
  {
    id: 3,
    question: 'Should AI systems be tested before deployment?',
    options: [
      'No, testing is unnecessary',
      'Yes, comprehensive testing including performance, safety, fairness, and robustness is essential',
      'Only if legally required',
      'Only for high-risk systems',
    ],
    correctAnswer: 1,
    explanation: 'Yes, comprehensive testing is essential before deployment. This includes performance testing, safety testing, fairness testing, robustness testing, security testing, and testing under diverse conditions and edge cases.',
  },
  {
    id: 4,
    question: 'What is the purpose of fairness metrics?',
    options: [
      'To maximize profit',
      'To identify and mitigate bias and ensure equitable treatment across different groups',
      'To reduce development time',
      'To avoid documentation',
    ],
    correctAnswer: 1,
    explanation: 'Fairness metrics help identify and mitigate bias in AI systems, ensuring equitable treatment across different demographic groups, protected characteristics, and contexts. They measure disparate impact, equal opportunity, and other fairness criteria.',
  },
  {
    id: 5,
    question: 'Should AI systems be measured only during development?',
    options: [
      'Yes, measurement is only needed during development',
      'No, continuous measurement and monitoring are needed throughout the AI lifecycle',
      'Only for the first month after deployment',
      'Only when incidents occur',
    ],
    correctAnswer: 1,
    explanation: 'No, continuous measurement and monitoring are essential throughout the AI lifecycle. AI systems can degrade, encounter new data distributions, or face new risks after deployment. Ongoing measurement enables timely detection and response.',
  },
  {
    id: 6,
    question: 'What is the role of human evaluation in the MEASURE function?',
    options: [
      'Human evaluation is unnecessary',
      'Human evaluation complements automated metrics by assessing context, nuance, and socio-technical impacts',
      'Human evaluation replaces all automated metrics',
      'Human evaluation is only for marketing',
    ],
    correctAnswer: 1,
    explanation: 'Human evaluation complements automated metrics by assessing aspects that are difficult to quantify, such as contextual appropriateness, nuanced impacts, user experience, and alignment with human values. Both are essential.',
  },
  {
    id: 7,
    question: 'Should metrics be transparent and explainable?',
    options: [
      'No, metrics can be opaque',
      'Yes, metrics should be transparent, well-documented, and explainable to stakeholders',
      'Only for external stakeholders',
      'Only if legally required',
    ],
    correctAnswer: 1,
    explanation: 'Yes, metrics should be transparent, well-documented, and explainable to relevant stakeholders. This includes documenting what is measured, how it is measured, limitations of metrics, and how results inform decisions.',
  },
  {
    id: 8,
    question: 'What is the purpose of robustness testing?',
    options: [
      'To test marketing materials',
      'To evaluate AI system performance under adversarial conditions, edge cases, and distribution shifts',
      'To test development tools',
      'To test team collaboration',
    ],
    correctAnswer: 1,
    explanation: 'Robustness testing evaluates how AI systems perform under adversarial conditions, edge cases, out-of-distribution data, and distribution shifts. It helps identify vulnerabilities and ensure reliable performance in real-world conditions.',
  },
  {
    id: 9,
    question: 'How does the MEASURE function relate to the MANAGE function?',
    options: [
      'They are unrelated',
      'MEASURE provides data and insights that inform MANAGE actions and interventions',
      'MEASURE replaces MANAGE',
      'MANAGE comes before MEASURE',
    ],
    correctAnswer: 1,
    explanation: 'MEASURE provides data, insights, and evidence that inform MANAGE actions and interventions. Measurement results trigger risk responses, system updates, incident responses, and continuous improvement activities in the MANAGE function.',
  },
  {
    id: 10,
    question: 'Should measurement approaches be validated?',
    options: [
      'No, validation is unnecessary',
      'Yes, metrics and measurement approaches should be validated to ensure they accurately capture intended characteristics',
      'Only for academic research',
      'Only if stakeholders complain',
    ],
    correctAnswer: 1,
    explanation: 'Yes, metrics and measurement approaches should be validated to ensure they accurately capture the intended characteristics, are reliable, and are appropriate for the context. Invalid metrics can lead to false confidence and poor decisions.',
  },
];
