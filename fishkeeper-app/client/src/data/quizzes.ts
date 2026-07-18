/**
 * Course Quiz Data
 * Questions for training modules
 */

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Quiz {
  moduleId: string;
  title: string;
  questions: QuizQuestion[];
}

// EU AI Act Module Quizzes
export const euAiActQuiz: Quiz = {
  moduleId: "eu-ai-act-intro",
  title: "EU AI Act Fundamentals",
  questions: [
    {
      id: "euai-1",
      question: "What is the primary purpose of the EU AI Act?",
      options: [
        "To ban all AI systems in the EU",
        "To create a regulatory framework for AI systems based on risk",
        "To promote AI development without restrictions",
        "To tax AI companies"
      ],
      correctAnswer: 1,
      explanation: "The EU AI Act creates a risk-based regulatory framework that categorizes AI systems and applies different requirements based on their risk level."
    },
    {
      id: "euai-2",
      question: "Which AI systems are considered 'high-risk' under the EU AI Act?",
      options: [
        "All AI systems",
        "Only facial recognition systems",
        "AI systems used in critical infrastructure, education, employment, and law enforcement",
        "AI systems that cost more than €1 million"
      ],
      correctAnswer: 2,
      explanation: "High-risk AI systems include those used in critical infrastructure, education and vocational training, employment, essential services, law enforcement, and biometric identification."
    },
    {
      id: "euai-3",
      question: "What happens to AI systems classified as 'unacceptable risk'?",
      options: [
        "They are subject to additional documentation",
        "They require annual certification",
        "They are prohibited from being placed on the EU market",
        "They must be registered with the EU"
      ],
      correctAnswer: 2,
      explanation: "AI systems classified as unacceptable risk are prohibited. This includes social scoring systems and certain real-time biometric identification systems."
    }
  ]
};

// NIST AI RMF Module Quizzes
export const nistRmfQuiz: Quiz = {
  moduleId: "nist-rmf-intro",
  title: "NIST AI Risk Management Framework",
  questions: [
    {
      id: "nist-1",
      question: "What are the four core functions of the NIST AI RMF?",
      options: [
        "Plan, Do, Check, Act",
        "Govern, Map, Measure, Manage",
        "Identify, Protect, Detect, Respond",
        "Assess, Mitigate, Monitor, Report"
      ],
      correctAnswer: 1,
      explanation: "The NIST AI RMF core functions are: GOVERN (establish governance), MAP (understand context and risks), MEASURE (analyze and assess), and MANAGE (prioritize and address risks)."
    },
    {
      id: "nist-2",
      question: "What is the purpose of the 'Map' function in NIST AI RMF?",
      options: [
        "To create geographic maps of AI systems",
        "To understand the context, potential impacts, and risks of AI systems",
        "To map network connections",
        "To visualize data flows"
      ],
      correctAnswer: 1,
      explanation: "The Map function helps organizations understand the context in which AI systems operate, identify potential impacts, and recognize risks throughout the AI lifecycle."
    }
  ]
};

// ISO 42001 Module Quizzes
export const iso42001Quiz: Quiz = {
  moduleId: "iso-42001-intro",
  title: "ISO 42001 AI Management System",
  questions: [
    {
      id: "iso-1",
      question: "What type of standard is ISO 42001?",
      options: [
        "A technical specification for AI algorithms",
        "A management system standard for AI",
        "A data privacy regulation",
        "A software development methodology"
      ],
      correctAnswer: 1,
      explanation: "ISO 42001 is a management system standard that provides requirements for establishing, implementing, maintaining, and continually improving an AI management system (AIMS)."
    },
    {
      id: "iso-2",
      question: "What does ISO 42001 follow the same structure as?",
      options: [
        "GDPR",
        "EU AI Act",
        "ISO/IEC management system standards (Annex SL)",
        "NIST Cybersecurity Framework"
      ],
      correctAnswer: 2,
      explanation: "ISO 42001 follows the harmonized structure of ISO/IEC management system standards (Annex SL), making it compatible with ISO 9001, ISO 27001, and other management system standards."
    }
  ]
};

// Export all quizzes
export const allQuizzes: Quiz[] = [euAiActQuiz, nistRmfQuiz, iso42001Quiz];

export function getQuizByModuleId(moduleId: string): Quiz | undefined {
  return allQuizzes.find(quiz => quiz.moduleId === moduleId);
}

// Alias for backwards compatibility
export const getModuleQuiz = getQuizByModuleId;
