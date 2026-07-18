import type { QuizQuestion } from '@/types/quiz';

export const financialTradingAiModule1Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is "algorithmic trading" in financial markets?',
    options: [
      'Trading algorithms as products',
      'Using computer programs to automatically execute trades based on predefined rules and AI analysis',
      'Calculating trading taxes',
      'Algorithm development for trading education',
    ],
    correctAnswer: 1,
    explanation: 'Algorithmic trading uses computer programs to automatically execute financial trades based on predefined rules, mathematical models, and increasingly AI/ML analysis of market conditions.',
  },
  {
    id: 2,
    question: 'What is a "flash crash" in the context of AI trading?',
    options: [
      'A camera flash during trading',
      'Rapid, extreme market price movements often exacerbated by algorithmic trading systems',
      'System crashes during flash sales',
      'Quick training of AI models',
    ],
    correctAnswer: 1,
    explanation: 'A flash crash is a rapid, deep, and volatile fall in security prices, often triggered or exacerbated by high-frequency algorithmic trading systems responding to each other in feedback loops.',
  },
  {
    id: 3,
    question: 'Which US regulatory body primarily oversees AI in securities trading?',
    options: [
      'Federal Reserve',
      'SEC (Securities and Exchange Commission)',
      'FDIC',
      'Department of Commerce',
    ],
    correctAnswer: 1,
    explanation: 'The SEC oversees AI in securities trading, establishing rules for algorithmic trading, market manipulation prevention, and disclosure requirements for automated trading systems.',
  },
  {
    id: 4,
    question: 'What is "market manipulation" in the context of AI trading?',
    options: [
      'Legal market strategies',
      'Using AI to artificially influence prices or deceive other market participants',
      'Manual adjustment of market data',
      'Marketing AI trading products',
    ],
    correctAnswer: 1,
    explanation: 'Market manipulation using AI includes practices like spoofing (placing then canceling orders) or layering to artificially influence prices or deceive other market participants.',
  },
  {
    id: 5,
    question: 'What is "spoofing" in AI trading?',
    options: [
      'Fake AI trading platforms',
      'Placing orders intended to be canceled to create false impressions of demand',
      'Copying other traders\' strategies',
      'Testing trading systems with fake data',
    ],
    correctAnswer: 1,
    explanation: 'Spoofing is an illegal practice where traders place orders they intend to cancel before execution, creating false impressions of market demand to manipulate prices.',
  },
  {
    id: 6,
    question: 'What is "model risk" in AI trading systems?',
    options: [
      'Risk to fashion models',
      'The risk that trading models may be flawed, misused, or perform poorly in changing conditions',
      'Risk of model theft',
      'Physical damage to model hardware',
    ],
    correctAnswer: 1,
    explanation: 'Model risk encompasses the risk that trading models may contain errors, be based on incorrect assumptions, or perform poorly in market conditions different from those used in development.',
  },
  {
    id: 7,
    question: 'What is "high-frequency trading" (HFT)?',
    options: [
      'Trading during busy hours',
      'Automated trading characterized by extremely high speeds, high turnover, and holding periods of milliseconds',
      'Frequent manual trading',
      'Trading high-frequency products',
    ],
    correctAnswer: 1,
    explanation: 'HFT uses sophisticated AI and algorithms to execute trades at extremely high speeds (milliseconds or microseconds), often holding positions for very short periods to capitalize on tiny price movements.',
  },
  {
    id: 8,
    question: 'What is FINRA\'s role in regulating AI trading?',
    options: [
      'No role in AI trading',
      'Self-regulatory organization that oversees broker-dealers\' use of algorithmic trading and market integrity',
      'Only regulates human traders',
      'International AI trading body',
    ],
    correctAnswer: 1,
    explanation: 'FINRA (Financial Industry Regulatory Authority) oversees broker-dealers\' compliance with securities laws, including requirements for algorithmic trading controls, testing, and supervision.',
  },
  {
    id: 9,
    question: 'What is "systemic risk" related to AI trading?',
    options: [
      'Risk to individual traders',
      'The risk that widespread AI trading could destabilize entire financial markets',
      'Risk of computer system failures',
      'Systematic trading strategies',
    ],
    correctAnswer: 1,
    explanation: 'Systemic risk in AI trading refers to the concern that widespread use of similar AI trading strategies could create correlated behaviors that destabilize financial markets during stress periods.',
  },
  {
    id: 10,
    question: 'What is a "kill switch" in algorithmic trading?',
    options: [
      'A violent trading strategy',
      'A mechanism to immediately halt automated trading when problems are detected',
      'Terminating competitor algorithms',
      'Ending a trading account',
    ],
    correctAnswer: 1,
    explanation: 'A kill switch is a mandatory safety mechanism that can immediately halt all automated trading activity when erroneous behavior, excessive risk, or market disruption is detected.',
  },
];
