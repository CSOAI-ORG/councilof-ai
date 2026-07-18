import type { QuizQuestion } from '@/types/quiz';

export const financialTradingAiModule2Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is MiFID II and how does it affect AI trading in the EU?',
    options: [
      'A type of AI trading algorithm',
      'Markets in Financial Instruments Directive II - requires controls for algorithmic trading',
      'A financial trading platform',
      'An AI certification standard',
    ],
    correctAnswer: 1,
    explanation: 'MiFID II is EU regulation that requires firms using algorithmic trading to have effective systems, risk controls, governance, and to notify regulators about their algorithmic trading activities.',
  },
  {
    id: 2,
    question: 'What is "pre-trade risk control" in AI trading?',
    options: [
      'Controlling risks before developing AI',
      'Automated checks that evaluate orders before execution to prevent erroneous or excessive trades',
      'Risk assessment for new traders',
      'Pre-market research',
    ],
    correctAnswer: 1,
    explanation: 'Pre-trade risk controls are automated checks that evaluate orders before execution, including price collars, position limits, and message rate limits to prevent erroneous or excessive trading.',
  },
  {
    id: 3,
    question: 'What is "explainability" requirement for AI trading models?',
    options: [
      'Explaining trading to novices',
      'The ability to understand and explain how AI trading models make decisions for regulatory and risk purposes',
      'Marketing explanations',
      'Explaining profits to shareholders',
    ],
    correctAnswer: 1,
    explanation: 'Explainability in AI trading requires the ability to understand and explain how models make trading decisions, which is essential for regulatory compliance, risk management, and model validation.',
  },
  {
    id: 4,
    question: 'What is "best execution" obligation in AI trading?',
    options: [
      'Executing trades as fast as possible',
      'The regulatory requirement to achieve the best possible result for clients when executing orders',
      'Using the best AI algorithms',
      'Executing only profitable trades',
    ],
    correctAnswer: 1,
    explanation: 'Best execution is the regulatory obligation to take all sufficient steps to achieve the best possible result for clients when executing orders, considering price, cost, speed, and likelihood of execution.',
  },
  {
    id: 5,
    question: 'What is "order-to-trade ratio" monitoring in AI trading?',
    options: [
      'Ratio of orders to traders',
      'Surveillance of the ratio between orders placed and trades executed to detect manipulation',
      'Trade efficiency metric',
      'Order queue management',
    ],
    correctAnswer: 1,
    explanation: 'Order-to-trade ratio monitoring tracks the relationship between orders placed and actual trades executed, helping detect potential market manipulation like spoofing or layering.',
  },
  {
    id: 6,
    question: 'What is "backtesting" in AI trading development?',
    options: [
      'Testing AI on backup systems',
      'Evaluating trading strategies using historical data to assess potential performance',
      'Testing after system failure',
      'Background testing during trading',
    ],
    correctAnswer: 1,
    explanation: 'Backtesting evaluates AI trading strategies by simulating their performance on historical market data, though it has limitations as past performance may not predict future results.',
  },
  {
    id: 7,
    question: 'What is "slippage" in AI trading?',
    options: [
      'System errors',
      'The difference between expected trade price and actual execution price',
      'Trader mistakes',
      'Data transmission delays',
    ],
    correctAnswer: 1,
    explanation: 'Slippage is the difference between the expected price of a trade and the price at which it\'s actually executed, which can significantly impact AI trading strategy performance.',
  },
  {
    id: 8,
    question: 'What is "latency arbitrage" in AI trading?',
    options: [
      'Trading delayed orders',
      'Exploiting speed advantages to profit from price differences across venues',
      'Arbitrating latency disputes',
      'Slow trading strategies',
    ],
    correctAnswer: 1,
    explanation: 'Latency arbitrage exploits speed advantages (faster data feeds and execution) to profit from tiny price differences across trading venues, raising fairness concerns in markets.',
  },
  {
    id: 9,
    question: 'What is "dark pool" trading and AI implications?',
    options: [
      'Illegal underground trading',
      'Private exchanges where AI can execute trades with less price impact but reduced transparency',
      'Trading after market hours',
      'Trading in low-light conditions',
    ],
    correctAnswer: 1,
    explanation: 'Dark pools are private trading venues where large orders can be executed with less market impact. AI trading in dark pools raises concerns about transparency, fairness, and price discovery.',
  },
  {
    id: 10,
    question: 'What is "circuit breaker" in trading markets?',
    options: [
      'Electrical safety equipment',
      'Market-wide or individual security trading halts triggered by extreme price movements',
      'Breaking trading circuits',
      'Network protection systems',
    ],
    correctAnswer: 1,
    explanation: 'Circuit breakers are automatic mechanisms that temporarily halt trading when prices move beyond specified thresholds, designed to prevent panic selling and allow orderly price discovery.',
  },
];
