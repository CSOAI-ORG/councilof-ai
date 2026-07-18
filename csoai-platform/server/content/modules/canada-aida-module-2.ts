import type { QuizQuestion } from '@/types/quiz';

export const canadaAidaModule2Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What transparency requirements does AIDA impose on high-impact AI systems?',
    options: [
      'No transparency requirements',
      'Organizations must publish descriptions of AI systems and provide plain-language explanations of decisions',
      'Only source code disclosure',
      'Transparency only for government AI',
    ],
    correctAnswer: 1,
    explanation: 'AIDA requires organizations to publish descriptions of high-impact AI systems and provide individuals with plain-language explanations of AI decisions that affect them.',
  },
  {
    id: 2,
    question: 'How does AIDA define "biased output" from AI systems?',
    options: [
      'Any incorrect prediction',
      'Content that adversely differentiates based on prohibited grounds of discrimination',
      'Output that favors the AI developer',
      'Statistically improbable results',
    ],
    correctAnswer: 1,
    explanation: 'AIDA defines biased output as content that adversely differentiates against individuals based on prohibited grounds of discrimination under the Canadian Human Rights Act.',
  },
  {
    id: 3,
    question: 'What is required under AIDA for AI systems that generate or manage content?',
    options: [
      'No specific requirements',
      'Assessment of whether the system could be used to generate harmful or manipulative content',
      'Only content filtering requirements',
      'Automatic content approval',
    ],
    correctAnswer: 1,
    explanation: 'AIDA requires assessment of AI systems that generate or manage content to determine if they could be used to create harmful, manipulative, or deceptive content.',
  },
  {
    id: 4,
    question: 'What is the Directive on Automated Decision-Making in Canada?',
    options: [
      'Part of AIDA legislation',
      'A Treasury Board policy requiring impact assessments for federal government AI systems',
      'A private sector AI guideline',
      'Provincial AI regulation',
    ],
    correctAnswer: 1,
    explanation: 'The Directive on Automated Decision-Making is a Treasury Board policy that requires federal government institutions to conduct Algorithmic Impact Assessments before deploying AI systems.',
  },
  {
    id: 5,
    question: 'What is an Algorithmic Impact Assessment (AIA) in the Canadian context?',
    options: [
      'Assessment of algorithm performance only',
      'A tool to assess and mitigate risks of automated decision systems in government',
      'Private sector AI audit requirement',
      'Assessment of AI training data',
    ],
    correctAnswer: 1,
    explanation: 'The AIA is a questionnaire-based tool that helps federal government institutions assess the risks of automated decision systems and determine appropriate mitigation measures and transparency requirements.',
  },
  {
    id: 6,
    question: 'How does AIDA address anonymized data used in AI systems?',
    options: [
      'Anonymized data is not covered',
      'AIDA may apply to AI systems using anonymized data if they have high-impact outcomes',
      'Only PIPEDA covers anonymized data',
      'All anonymized data use is exempt',
    ],
    correctAnswer: 1,
    explanation: 'Unlike PIPEDA which focuses on personal information, AIDA\'s requirements apply to high-impact AI systems regardless of whether they use personal or anonymized data.',
  },
  {
    id: 7,
    question: 'What is Canada\'s approach to regulating general-purpose AI (GPAI)?',
    options: [
      'GPAI is completely banned',
      'AIDA includes provisions that could apply to GPAI when used in high-impact contexts',
      'Only provincial laws regulate GPAI',
      'GPAI is exempt from all regulation',
    ],
    correctAnswer: 1,
    explanation: 'AIDA\'s risk-based approach means that general-purpose AI systems become subject to requirements when they are deployed in high-impact contexts, similar to the EU approach.',
  },
  {
    id: 8,
    question: 'What role does the Office of the Privacy Commissioner of Canada play in AI regulation?',
    options: [
      'No role in AI regulation',
      'Enforces privacy aspects of AI including PIPEDA compliance and provides guidance on AI and privacy',
      'Only investigates AI-related cybercrime',
      'Develops AI systems for government',
    ],
    correctAnswer: 1,
    explanation: 'The OPC enforces PIPEDA provisions relevant to AI, provides guidance on privacy-respecting AI development, and investigates complaints about AI systems processing personal information.',
  },
  {
    id: 9,
    question: 'What is the relationship between AIDA and Canada\'s Anti-Spam Legislation (CASL)?',
    options: [
      'They are unrelated',
      'AI systems sending commercial electronic messages must comply with CASL in addition to AIDA',
      'AIDA replaces CASL',
      'CASL only applies to human-sent messages',
    ],
    correctAnswer: 1,
    explanation: 'AI systems that send commercial electronic messages must comply with CASL requirements for consent and unsubscribe mechanisms, in addition to any applicable AIDA provisions.',
  },
  {
    id: 10,
    question: 'What audit powers would regulators have under AIDA?',
    options: [
      'No audit powers',
      'Power to enter premises, require production of documents, and conduct compliance audits',
      'Only voluntary audits',
      'Audits require court approval in all cases',
    ],
    correctAnswer: 1,
    explanation: 'AIDA proposes giving the AI and Data Commissioner significant audit powers, including entering premises, requiring document production, and conducting comprehensive compliance audits.',
  },
];
