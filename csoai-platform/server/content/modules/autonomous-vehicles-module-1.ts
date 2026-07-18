import type { QuizQuestion } from '@/types/quiz';

export const autonomousVehiclesModule1Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What are the SAE levels of driving automation?',
    options: [
      'Levels 1-3 covering basic to advanced features',
      'Levels 0-5 ranging from no automation to full automation',
      'Levels A-F for different vehicle types',
      'Levels 1-10 based on speed capabilities',
    ],
    correctAnswer: 1,
    explanation: 'SAE International defines six levels (0-5) of driving automation, from Level 0 (no automation) through Level 5 (full automation with no human intervention needed in any condition).',
  },
  {
    id: 2,
    question: 'What is a "Safety Driver" in autonomous vehicle testing?',
    options: [
      'A safe driving instructor',
      'A human operator ready to take control if the autonomous system fails',
      'A vehicle safety engineer',
      'An AI safety monitoring system',
    ],
    correctAnswer: 1,
    explanation: 'A safety driver is a trained human operator who monitors autonomous vehicle operation during testing and is ready to immediately take control if the AI system fails or encounters situations it cannot handle.',
  },
  {
    id: 3,
    question: 'What is "Operational Design Domain" (ODD) in autonomous vehicles?',
    options: [
      'The design of the vehicle interior',
      'The specific conditions under which an autonomous system is designed to function',
      'Domain name for autonomous vehicle websites',
      'Software development methodology for autonomous vehicles',
    ],
    correctAnswer: 1,
    explanation: 'The ODD defines the specific operating conditions under which an autonomous driving system is designed to function, including roadway types, geographic areas, speed ranges, and environmental conditions.',
  },
  {
    id: 4,
    question: 'What is the "trolley problem" dilemma in autonomous vehicle ethics?',
    options: [
      'Electric trolley vehicle regulations',
      'Ethical dilemmas about how AVs should choose between harmful outcomes in unavoidable accidents',
      'Problems with autonomous trolleys',
      'Shopping cart automation issues',
    ],
    correctAnswer: 1,
    explanation: 'The trolley problem in AV ethics refers to dilemmas about how autonomous vehicles should be programmed to choose between different harmful outcomes when accidents are unavoidable.',
  },
  {
    id: 5,
    question: 'What is "disengagement" in autonomous vehicle safety reporting?',
    options: [
      'Ending a vehicle lease',
      'When the autonomous system transfers control to a human driver or shuts down',
      'Vehicle disconnection from network',
      'Employee separation from AV companies',
    ],
    correctAnswer: 1,
    explanation: 'A disengagement occurs when the autonomous driving system transfers control to a human driver (either automatically or upon human request) or shuts down due to a system failure or situation it cannot handle.',
  },
  {
    id: 6,
    question: 'Which US agency issues safety standards for autonomous vehicles?',
    options: [
      'FAA',
      'NHTSA (National Highway Traffic Safety Administration)',
      'FCC',
      'EPA',
    ],
    correctAnswer: 1,
    explanation: 'NHTSA is the primary federal agency responsible for vehicle safety, issuing Federal Motor Vehicle Safety Standards (FMVSS) and guidance for autonomous vehicle safety.',
  },
  {
    id: 7,
    question: 'What is "sensor fusion" in autonomous vehicles?',
    options: [
      'Combining sensor manufacturers',
      'Integrating data from multiple sensors (cameras, radar, lidar) to create comprehensive environment understanding',
      'Fusing broken sensors together',
      'Sensor heat management',
    ],
    correctAnswer: 1,
    explanation: 'Sensor fusion combines data from multiple sensor types (cameras, radar, lidar, ultrasonic) to create a more complete and reliable understanding of the vehicle\'s environment.',
  },
  {
    id: 8,
    question: 'What is "edge case" in autonomous vehicle safety?',
    options: [
      'Driving on road edges',
      'Rare or unusual situations that are difficult for AI to handle correctly',
      'Cases near geographic borders',
      'Legal edge cases in AV law',
    ],
    correctAnswer: 1,
    explanation: 'Edge cases are rare, unusual, or unexpected situations (like unusual road debris or uncommon traffic patterns) that autonomous systems may not have encountered in training and may struggle to handle safely.',
  },
  {
    id: 9,
    question: 'What is "minimum risk condition" (MRC) in autonomous vehicles?',
    options: [
      'Minimum insurance requirements',
      'A safe state the vehicle achieves when it cannot continue automated operation',
      'Lowest risk driving conditions',
      'Minimum risk investors accept',
    ],
    correctAnswer: 1,
    explanation: 'The MRC is a safe state that an autonomous vehicle achieves when it can no longer safely continue automated operation, such as safely pulling over and stopping.',
  },
  {
    id: 10,
    question: 'What liability considerations apply to autonomous vehicle accidents?',
    options: [
      'Only the driver is ever liable',
      'Complex questions involving manufacturers, software developers, operators, and possibly no human at fault',
      'Insurance companies are always liable',
      'The government assumes all liability',
    ],
    correctAnswer: 1,
    explanation: 'AV accidents raise complex liability questions involving vehicle manufacturers, software/AI developers, operators, and situations where no human may be at fault, requiring new legal frameworks.',
  },
];
