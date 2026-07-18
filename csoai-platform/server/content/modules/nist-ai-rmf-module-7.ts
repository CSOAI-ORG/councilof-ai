import type { QuizQuestion } from '@/types/quiz';

export const nistAiRmfModule7Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What are the key stages of the AI lifecycle according to NIST AI RMF?',
    options: [
      'Only development and deployment',
      'Plan and Design, Develop, Deploy, Operate and Monitor',
      'Only testing and deployment',
      'Only design and operation',
    ],
    correctAnswer: 1,
    explanation: 'The NIST AI RMF identifies four key stages: Plan and Design (defining requirements and architecture), Develop (building and testing), Deploy (releasing to production), and Operate and Monitor (ongoing operation and oversight). Risks can emerge at any stage.',
  },
  {
    id: 2,
    question: 'Who are AI actors according to NIST AI RMF?',
    options: [
      'Only AI developers',
      'All individuals and organizations involved in the AI lifecycle, including developers, deployers, users, and affected parties',
      'Only AI users',
      'Only AI researchers',
    ],
    correctAnswer: 1,
    explanation: 'AI actors include all individuals and organizations involved in the AI lifecycle: developers, deployers, users, affected individuals and communities, regulators, standards bodies, researchers, and civil society. Each has roles and responsibilities.',
  },
  {
    id: 3,
    question: 'What is the role of AI developers?',
    options: [
      'Only writing code',
      'Designing, building, and testing AI systems with risk management integrated throughout',
      'Only testing AI systems',
      'Only documenting AI systems',
    ],
    correctAnswer: 1,
    explanation: 'AI developers design, build, and test AI systems with risk management integrated throughout the development process. They are responsible for implementing technical safeguards, conducting testing, and documenting system characteristics and limitations.',
  },
  {
    id: 4,
    question: 'What is the role of AI deployers?',
    options: [
      'Only installing software',
      'Deploying AI systems into operational contexts, monitoring performance, and managing risks',
      'Only marketing AI systems',
      'Only purchasing AI systems',
    ],
    correctAnswer: 1,
    explanation: 'AI deployers deploy AI systems into operational contexts, configure them for specific uses, monitor performance, manage risks, respond to incidents, and ensure systems remain aligned with intended purposes and risk thresholds.',
  },
  {
    id: 5,
    question: 'Should AI users be trained on AI system capabilities and limitations?',
    options: [
      'No, training is unnecessary',
      'Yes, users should understand capabilities, limitations, and appropriate use',
      'Only for complex systems',
      'Only if legally required',
    ],
    correctAnswer: 1,
    explanation: 'Yes, AI users should be trained to understand system capabilities, limitations, appropriate use cases, and how to identify and report issues. User training is essential for safe and effective AI use.',
  },
  {
    id: 6,
    question: 'What is the role of affected individuals and communities?',
    options: [
      'No role—they are passive recipients',
      'Providing feedback, raising concerns, and participating in governance where appropriate',
      'Only complaining when things go wrong',
      'Only using AI systems',
    ],
    correctAnswer: 1,
    explanation: 'Affected individuals and communities should have mechanisms to provide feedback, raise concerns, seek redress, and participate in governance processes where appropriate. Their perspectives are essential for identifying real-world impacts.',
  },
  {
    id: 7,
    question: 'Should responsibilities be clearly defined for each AI actor?',
    options: [
      'No, responsibilities can be ambiguous',
      'Yes, clear roles and responsibilities prevent gaps and overlaps in risk management',
      'Only for large organizations',
      'Only if legally required',
    ],
    correctAnswer: 1,
    explanation: 'Yes, clear roles and responsibilities for each AI actor prevent gaps and overlaps in risk management. Ambiguity leads to assumptions that "someone else" is handling risks, resulting in unmanaged risks.',
  },
  {
    id: 8,
    question: 'What happens during the "Plan and Design" stage?',
    options: [
      'Only budgeting',
      'Defining requirements, assessing feasibility, identifying risks, and designing architecture',
      'Only writing code',
      'Only testing',
    ],
    correctAnswer: 1,
    explanation: 'During Plan and Design, teams define requirements, assess feasibility, identify potential risks and impacts, engage stakeholders, design system architecture, and establish risk management approaches. Early risk identification is crucial.',
  },
  {
    id: 9,
    question: 'Should AI systems be monitored after deployment?',
    options: [
      'No, deployment is the end',
      'Yes, continuous monitoring is essential to detect performance degradation and emerging risks',
      'Only for the first week',
      'Only if incidents occur',
    ],
    correctAnswer: 1,
    explanation: 'Yes, continuous monitoring after deployment is essential. AI systems can degrade, encounter new data distributions, face new risks, or be used in unintended ways. Monitoring enables timely detection and response.',
  },
  {
    id: 10,
    question: 'Can one organization play multiple AI actor roles?',
    options: [
      'No, roles must be separate organizations',
      'Yes, one organization can be both developer and deployer, but should clearly distinguish responsibilities',
      'Only for small organizations',
      'Only if legally allowed',
    ],
    correctAnswer: 1,
    explanation: 'Yes, one organization can play multiple roles (e.g., both developer and deployer). However, it should clearly distinguish responsibilities for each role and ensure appropriate oversight and accountability for each function.',
  },
];
