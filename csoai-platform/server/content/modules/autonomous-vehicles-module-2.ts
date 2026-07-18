import type { QuizQuestion } from '@/types/quiz';

export const autonomousVehiclesModule2Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is "V2X" communication in autonomous vehicles?',
    options: [
      'Vehicle-to-X (vehicle to everything) communication enabling data exchange with infrastructure and other vehicles',
      'Version 2.X software updates',
      'Vehicle-to-X-ray security scanning',
      'Vendor-to-exchange sales channels',
    ],
    correctAnswer: 0,
    explanation: 'V2X (Vehicle-to-Everything) communication enables autonomous vehicles to exchange data with other vehicles (V2V), infrastructure (V2I), pedestrians (V2P), and networks (V2N) to enhance safety and efficiency.',
  },
  {
    id: 2,
    question: 'What is "cybersecurity" requirement for autonomous vehicles?',
    options: [
      'Optional security measures',
      'Mandatory protection against hacking, data breaches, and malicious interference with vehicle systems',
      'Only protects against theft',
      'Cyber insurance requirement',
    ],
    correctAnswer: 1,
    explanation: 'Autonomous vehicles require robust cybersecurity to protect against hacking, unauthorized access, data breaches, and malicious interference that could compromise vehicle safety or privacy.',
  },
  {
    id: 3,
    question: 'What is "over-the-air" (OTA) update safety concern?',
    options: [
      'Air quality during updates',
      'Security and safety risks from remotely updating vehicle software while ensuring updates don\'t introduce new hazards',
      'Radio frequency interference',
      'Updates while vehicle is airborne',
    ],
    correctAnswer: 1,
    explanation: 'OTA updates for autonomous vehicles raise concerns about update security, ensuring updates don\'t introduce new safety hazards, and managing the transition if updates fail or behave unexpectedly.',
  },
  {
    id: 4,
    question: 'What is "functional safety" standard ISO 26262?',
    options: [
      'General ISO quality standard',
      'International standard for functional safety of electrical/electronic systems in road vehicles',
      'Factory safety standard',
      'Financial safety standard',
    ],
    correctAnswer: 1,
    explanation: 'ISO 26262 is the international standard for functional safety of electrical, electronic, and programmable electronic systems in road vehicles, including guidance applicable to autonomous driving systems.',
  },
  {
    id: 5,
    question: 'What is "SOTIF" (Safety of the Intended Functionality)?',
    options: [
      'Software testing framework',
      'Standard addressing safety risks from functional limitations and foreseeable misuse rather than system failures',
      'Security threat identification',
      'Staff on-the-job training framework',
    ],
    correctAnswer: 1,
    explanation: 'SOTIF (ISO 21448) addresses safety risks from functional limitations of the intended functionality and foreseeable misuse, complementing ISO 26262 which focuses on system failures.',
  },
  {
    id: 6,
    question: 'What data privacy concerns exist for autonomous vehicles?',
    options: [
      'No privacy concerns for vehicles',
      'Collection of location data, driving patterns, passenger information, and surrounding environment data',
      'Only concerns about vehicle identification numbers',
      'Privacy only applies to commercial vehicles',
    ],
    correctAnswer: 1,
    explanation: 'Autonomous vehicles collect extensive data including location history, driving patterns, passenger information, and recordings of surroundings, raising significant privacy concerns requiring appropriate protections.',
  },
  {
    id: 7,
    question: 'What is "validation" versus "verification" in AV safety?',
    options: [
      'They are identical concepts',
      'Verification checks if the system is built correctly; validation checks if it meets real-world safety needs',
      'Verification is for software, validation for hardware',
      'Validation comes before verification',
    ],
    correctAnswer: 1,
    explanation: 'Verification confirms the system is built correctly according to specifications, while validation confirms the system meets real-world safety needs and performs safely in actual operating conditions.',
  },
  {
    id: 8,
    question: 'What is "scenario-based testing" for autonomous vehicles?',
    options: [
      'Testing different weather scenarios only',
      'Systematic testing using defined driving scenarios to evaluate AV safety and performance',
      'Creating fictional test scenarios',
      'Testing actor performance in scenarios',
    ],
    correctAnswer: 1,
    explanation: 'Scenario-based testing uses a comprehensive set of defined driving scenarios (normal, challenging, and edge cases) to systematically evaluate autonomous vehicle safety and performance.',
  },
  {
    id: 9,
    question: 'What is "shadow mode" testing in autonomous vehicles?',
    options: [
      'Testing in the dark',
      'Running autonomous systems in parallel with human drivers to compare decisions without taking control',
      'Hidden camera testing',
      'Testing backup shadow systems',
    ],
    correctAnswer: 1,
    explanation: 'Shadow mode runs autonomous systems in parallel with human drivers, comparing what the AI would do with human decisions to identify discrepancies and train the system without taking control.',
  },
  {
    id: 10,
    question: 'What is "geofencing" in autonomous vehicle operation?',
    options: [
      'Physical fences around test areas',
      'Virtual boundaries limiting where autonomous vehicles can operate',
      'Geographic data encryption',
      'Fence detection by sensors',
    ],
    correctAnswer: 1,
    explanation: 'Geofencing uses GPS and mapping to create virtual boundaries that limit where autonomous vehicles can operate in autonomous mode, often restricting operation to validated areas.',
  },
];
