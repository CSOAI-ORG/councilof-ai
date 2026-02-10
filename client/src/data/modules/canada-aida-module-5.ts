import type { QuizQuestion } from '@/types/quiz';

export const canadaAidaModule5Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'How does AIDA interact with the Consumer Privacy Protection Act (CPPA)?',
    options: [
      'They are completely separate with no interaction',
      'AIDA replaces CPPA for AI systems',
      'They work together, with CPPA governing privacy and AIDA governing AI-specific requirements',
      'CPPA only applies to non-AI systems',
    ],
    correctAnswer: 2,
    explanation: 'AIDA and CPPA work together as complementary legislation. CPPA governs privacy aspects of data processing while AIDA addresses AI-specific requirements, and organizations must comply with both.',
  },
  {
    id: 2,
    question: 'What is the relationship between AIDA and provincial privacy laws?',
    options: [
      'AIDA overrides all provincial laws',
      'Provincial laws override AIDA',
      'AIDA applies federally while provincial laws may add additional requirements',
      'There is no relationship',
    ],
    correctAnswer: 2,
    explanation: 'AIDA applies at the federal level, while provincial privacy and AI laws may add additional requirements. Organizations must comply with both federal and applicable provincial requirements.',
  },
  {
    id: 3,
    question: 'How does AIDA address cross-border AI data transfers?',
    options: [
      'Cross-border transfers are prohibited',
      'No restrictions on cross-border transfers',
      'Transfers must ensure equivalent protection and comply with Canadian requirements',
      'Only transfers to the US are allowed',
    ],
    correctAnswer: 2,
    explanation: 'AIDA requires that cross-border AI data transfers ensure equivalent protection to Canadian standards and that organizations maintain compliance with Canadian requirements regardless of where data is processed.',
  },
  {
    id: 4,
    question: 'What sector-specific regulations might apply alongside AIDA?',
    options: [
      'No sector-specific regulations apply',
      'Only healthcare regulations',
      'Financial services, healthcare, telecommunications, and other sector-specific regulations',
      'Only telecommunications regulations',
    ],
    correctAnswer: 2,
    explanation: 'Various sector-specific regulations may apply alongside AIDA, including those governing financial services, healthcare, telecommunications, and other regulated industries.',
  },
  {
    id: 5,
    question: 'How does AIDA relate to Canada\'s human rights legislation?',
    options: [
      'AIDA replaces human rights legislation for AI',
      'Human rights legislation doesn\'t apply to AI',
      'AIDA complements human rights legislation, requiring AI systems to respect human rights',
      'Only provincial human rights codes apply',
    ],
    correctAnswer: 2,
    explanation: 'AIDA complements Canada\'s human rights legislation, requiring that AI systems be designed and used in ways that respect human rights and do not discriminate on prohibited grounds.',
  },
  {
    id: 6,
    question: 'What is the role of the Office of the Privacy Commissioner in AI regulation?',
    options: [
      'No role in AI regulation',
      'Sole regulator of AI systems',
      'Oversees privacy aspects of AI systems in coordination with AI-specific regulators',
      'Only handles complaints',
    ],
    correctAnswer: 2,
    explanation: 'The Office of the Privacy Commissioner oversees privacy aspects of AI systems, working in coordination with AI-specific regulators to ensure comprehensive oversight of AI systems.',
  },
  {
    id: 7,
    question: 'How does AIDA address AI in federally regulated industries?',
    options: [
      'Federally regulated industries are exempt',
      'Additional requirements may apply to federally regulated industries',
      'Only provincial requirements apply',
      'No specific provisions for federally regulated industries',
    ],
    correctAnswer: 1,
    explanation: 'Federally regulated industries (banking, telecommunications, transportation) may face additional AI requirements under both AIDA and their sector-specific regulatory frameworks.',
  },
  {
    id: 8,
    question: 'What is the relationship between AIDA and competition law?',
    options: [
      'No relationship',
      'AIDA overrides competition law',
      'Both apply, with competition law addressing AI-related market practices',
      'Competition law doesn\'t apply to AI',
    ],
    correctAnswer: 2,
    explanation: 'Both AIDA and competition law apply to AI systems, with competition law addressing issues like algorithmic collusion, market manipulation, and anti-competitive AI practices.',
  },
  {
    id: 9,
    question: 'How does AIDA interact with intellectual property law?',
    options: [
      'AIDA eliminates IP protection for AI',
      'IP law doesn\'t apply to AI systems',
      'Both apply, with IP law governing AI-related inventions and data rights',
      'Only patents apply to AI',
    ],
    correctAnswer: 2,
    explanation: 'AIDA and intellectual property law both apply to AI systems, with IP law governing issues like AI-related inventions, copyright in AI-generated works, and data rights.',
  },
  {
    id: 10,
    question: 'What international frameworks influence AIDA\'s approach to AI regulation?',
    options: [
      'No international influence',
      'Only US regulations',
      'OECD AI Principles, EU AI Act, and other international frameworks',
      'Only UN guidelines',
    ],
    correctAnswer: 2,
    explanation: 'AIDA is influenced by international frameworks including the OECD AI Principles, the EU AI Act, and other international guidelines, promoting interoperability with global AI governance approaches.',
  },
];
