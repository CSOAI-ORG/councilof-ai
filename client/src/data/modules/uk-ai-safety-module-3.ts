import type { QuizQuestion } from '@/types/quiz';

export const ukAiSafetyModule3Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What are the key testing methodologies used by the AI Safety Institute?',
    options: ['Only automated testing', 'Combination of automated, human, and adversarial testing', 'Only user surveys', 'Only code review'],
    correctAnswer: 1,
    explanation: 'The AI Safety Institute uses a combination of automated testing, human evaluation, and adversarial testing.'
  },
  {
    id: 2,
    question: 'What is "model evaluation" in AI safety?',
    options: ['Checking the price of a model', 'Systematic assessment of AI capabilities and risks', 'Marketing analysis', 'User satisfaction surveys'],
    correctAnswer: 1,
    explanation: 'Model evaluation involves systematic assessment of an AI model\'s capabilities, limitations, and potential risks.'
  },
  {
    id: 3,
    question: 'How does the AI Safety Institute approach bias testing?',
    options: ['Ignores bias', 'Tests for demographic biases and fairness across groups', 'Only tests for speed', 'Relies on developer claims'],
    correctAnswer: 1,
    explanation: 'The AI Safety Institute tests for demographic biases and fairness across different groups.'
  },
  {
    id: 4,
    question: 'What is "capability elicitation" testing?',
    options: ['Training new capabilities', 'Discovering hidden or emergent capabilities in AI systems', 'Marketing capabilities', 'User training'],
    correctAnswer: 1,
    explanation: 'Capability elicitation testing aims to discover hidden or emergent capabilities in AI systems.'
  },
  {
    id: 5,
    question: 'How does the AI Safety Institute test for harmful content generation?',
    options: ['Does not test this', 'Systematic probing for ability to generate harmful content', 'Only checks spelling', 'Relies on filters only'],
    correctAnswer: 1,
    explanation: 'The AI Safety Institute systematically probes AI models for their ability to generate harmful content.'
  },
  {
    id: 6,
    question: 'What is the role of human evaluators in AI safety testing?',
    options: ['None', 'Assessing nuanced outputs that automated tests may miss', 'Only for marketing', 'Replacing AI entirely'],
    correctAnswer: 1,
    explanation: 'Human evaluators assess nuanced AI outputs and identify subtle harms that automated tests may miss.'
  },
  {
    id: 7,
    question: 'How does the AI Safety Institute approach robustness testing?',
    options: ['Does not test robustness', 'Tests model behavior under various perturbations and edge cases', 'Only tests normal inputs', 'Relies on developer testing'],
    correctAnswer: 1,
    explanation: 'Robustness testing examines how AI models behave under various perturbations and edge cases.'
  },
  {
    id: 8,
    question: 'What is "jailbreaking" in AI safety testing?',
    options: ['Physical security testing', 'Attempts to bypass AI safety measures through clever prompting', 'Installing software', 'Network security'],
    correctAnswer: 1,
    explanation: 'Jailbreaking refers to attempts to bypass AI safety measures through clever prompting techniques.'
  },
  {
    id: 9,
    question: 'How does the AI Safety Institute share evaluation results?',
    options: ['Keeps all results secret', 'Shares findings with developers and publishes research', 'Sells results', 'Only shares with government'],
    correctAnswer: 1,
    explanation: 'The AI Safety Institute shares evaluation results with developers and publishes research findings.'
  },
  {
    id: 10,
    question: 'What is the purpose of benchmark development at the AI Safety Institute?',
    options: ['Marketing', 'Creating standardized tests to measure AI safety across models', 'Ranking companies', 'Setting prices'],
    correctAnswer: 1,
    explanation: 'Benchmark development creates standardized tests to measure and compare AI safety across different models.'
  }
];
