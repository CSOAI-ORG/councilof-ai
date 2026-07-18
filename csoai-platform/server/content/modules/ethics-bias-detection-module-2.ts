import type { QuizQuestion } from '@/types/quiz';

export const ethicsBiasDetectionModule2Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is a "confusion matrix" used for in bias detection?',
    options: [
      'Measuring user confusion with AI systems',
      'Analyzing true/false positives and negatives to assess model performance across groups',
      'Documenting confusing AI behaviors',
      'Creating confusion in adversarial attacks',
    ],
    correctAnswer: 1,
    explanation: 'A confusion matrix shows true positives, true negatives, false positives, and false negatives. Analyzing these metrics separately for different groups helps detect disparities in AI system performance.',
  },
  {
    id: 2,
    question: 'What is "counterfactual fairness"?',
    options: [
      'Measuring what would happen if we count facts differently',
      'A decision is fair if it would be the same had a person\'s protected attributes been different',
      'Fairness that counts against certain groups',
      'Using counter-examples to test fairness',
    ],
    correctAnswer: 1,
    explanation: 'Counterfactual fairness requires that a decision would be the same in a hypothetical world where an individual\'s protected attributes (like race or gender) were different, while everything else remained the same.',
  },
  {
    id: 3,
    question: 'Which technique involves modifying training data to reduce bias before model training?',
    options: [
      'Post-processing',
      'In-processing',
      'Pre-processing',
      'Re-processing',
    ],
    correctAnswer: 2,
    explanation: 'Pre-processing techniques modify the training data before the model is trained to reduce bias. This includes resampling, reweighting, or transforming data to remove discriminatory patterns.',
  },
  {
    id: 4,
    question: 'What is "reweighting" as a bias mitigation technique?',
    options: [
      'Changing the physical weight of hardware',
      'Assigning different importance weights to training samples to balance group representation',
      'Recalculating model weights after training',
      'Weighing the pros and cons of AI deployment',
    ],
    correctAnswer: 1,
    explanation: 'Reweighting assigns different importance weights to training samples to correct for imbalanced representation. This can help ensure that underrepresented groups have appropriate influence on model learning.',
  },
  {
    id: 5,
    question: 'What is "calibration" in the context of fair AI?',
    options: [
      'Adjusting AI hardware settings',
      'Ensuring predicted probabilities accurately reflect actual outcomes across groups',
      'Calibrating user expectations of AI',
      'Setting up AI monitoring systems',
    ],
    correctAnswer: 1,
    explanation: 'Calibration ensures that when an AI system predicts a certain probability of an outcome, that probability accurately reflects the true likelihood across all groups. Good calibration is important for fair decision-making.',
  },
  {
    id: 6,
    question: 'What is a "fairness-aware algorithm"?',
    options: [
      'An algorithm that only works with fair data',
      'An algorithm designed to incorporate fairness constraints during training',
      'An algorithm aware of unfair use',
      'An algorithm that reports unfair outcomes',
    ],
    correctAnswer: 1,
    explanation: 'Fairness-aware algorithms incorporate fairness constraints or objectives directly into the training process (in-processing), balancing accuracy with fairness requirements.',
  },
  {
    id: 7,
    question: 'What is "threshold adjustment" in bias mitigation?',
    options: [
      'Setting higher thresholds for AI approval',
      'Using different decision thresholds for different groups to equalize outcomes',
      'Adjusting the threshold for detecting bias',
      'Setting limits on AI processing',
    ],
    correctAnswer: 1,
    explanation: 'Threshold adjustment is a post-processing technique where different decision thresholds are applied to different groups to achieve fairer outcomes. This modifies decisions after the model has made predictions.',
  },
  {
    id: 8,
    question: 'What is an "AI fairness audit"?',
    options: [
      'A financial audit of AI companies',
      'A systematic assessment of AI system fairness across protected groups and decision points',
      'Auditing AI code for bugs',
      'An audit of AI energy consumption',
    ],
    correctAnswer: 1,
    explanation: 'An AI fairness audit is a systematic assessment that evaluates an AI system\'s fairness across protected groups, examining data, algorithms, and outcomes to identify and address potential biases.',
  },
  {
    id: 9,
    question: 'What is the "impossibility theorem" in AI fairness?',
    options: [
      'It is impossible to create fair AI',
      'Certain fairness criteria cannot all be satisfied simultaneously except in special cases',
      'It is impossible to measure fairness',
      'Bias cannot be completely eliminated',
    ],
    correctAnswer: 1,
    explanation: 'The impossibility theorem (Kleinberg et al.) demonstrates that certain fairness criteria (like demographic parity, equalized odds, and calibration) cannot all be satisfied simultaneously, except in special circumstances.',
  },
  {
    id: 10,
    question: 'What is the purpose of "fairness testing" in AI systems?',
    options: [
      'Testing if AI treats testers fairly',
      'Systematically evaluating whether AI systems produce equitable outcomes across groups',
      'Testing if AI fairness reports are accurate',
      'Testing user perceptions of fairness',
    ],
    correctAnswer: 1,
    explanation: 'Fairness testing systematically evaluates whether AI systems produce equitable outcomes across different demographic groups, using various fairness metrics and test cases to identify potential discrimination.',
  },
];
