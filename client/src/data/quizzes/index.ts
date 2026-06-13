import type { QuizQuestion } from '@/types/quiz';

// EU AI Act imports
import { euAiActModule1Quiz } from '../modules/eu-ai-act-module-1';
import { euAiActModule2Quiz } from '../modules/eu-ai-act-module-2';
import { euAiActModule3Quiz } from '../modules/eu-ai-act-module-3';
import { euAiActModule4Quiz } from '../modules/eu-ai-act-module-4';
import { euAiActModule5Quiz } from '../modules/eu-ai-act-module-5';
import { euAiActModule6Quiz } from '../modules/eu-ai-act-module-6';
import { euAiActModule7Quiz } from '../modules/eu-ai-act-module-7';

// NIST AI RMF imports
import { nistAiRmfModule1Quiz } from '../modules/nist-ai-rmf-module-1';
import { nistAiRmfModule2Quiz } from '../modules/nist-ai-rmf-module-2';
import { nistAiRmfModule3Quiz } from '../modules/nist-ai-rmf-module-3';
import { nistAiRmfModule4Quiz } from '../modules/nist-ai-rmf-module-4';
import { nistAiRmfModule5Quiz } from '../modules/nist-ai-rmf-module-5';
import { nistAiRmfModule6Quiz } from '../modules/nist-ai-rmf-module-6';
import { nistAiRmfModule7Quiz } from '../modules/nist-ai-rmf-module-7';

// UK AI Safety imports
import { ukAiSafetyModule1Quiz } from '../modules/uk-ai-safety-module-1';
import { ukAiSafetyModule2Quiz } from '../modules/uk-ai-safety-module-2';
import { ukAiSafetyModule3Quiz } from '../modules/uk-ai-safety-module-3';
import { ukAiSafetyModule4Quiz } from '../modules/uk-ai-safety-module-4';
import { ukAiSafetyModule5Quiz } from '../modules/uk-ai-safety-module-5';
import { ukAiSafetyModule6Quiz } from '../modules/uk-ai-safety-module-6';
import { ukAiSafetyModule7Quiz } from '../modules/uk-ai-safety-module-7';

// Canada AIDA imports
import { canadaAidaModule1Quiz } from '../modules/canada-aida-module-1';
import { canadaAidaModule2Quiz } from '../modules/canada-aida-module-2';
import { canadaAidaModule3Quiz } from '../modules/canada-aida-module-3';
import { canadaAidaModule4Quiz } from '../modules/canada-aida-module-4';
import { canadaAidaModule5Quiz } from '../modules/canada-aida-module-5';
import { canadaAidaModule6Quiz } from '../modules/canada-aida-module-6';
import { canadaAidaModule7Quiz } from '../modules/canada-aida-module-7';

// Australia AI Ethics imports
import { australiaAiEthicsModule1Quiz } from '../modules/australia-ai-ethics-module-1';
import { australiaAiEthicsModule2Quiz } from '../modules/australia-ai-ethics-module-2';
import { australiaAiEthicsModule3Quiz } from '../modules/australia-ai-ethics-module-3';
import { australiaAiEthicsModule4Quiz } from '../modules/australia-ai-ethics-module-4';
import { australiaAiEthicsModule5Quiz } from '../modules/australia-ai-ethics-module-5';
import { australiaAiEthicsModule6Quiz } from '../modules/australia-ai-ethics-module-6';
import { australiaAiEthicsModule7Quiz } from '../modules/australia-ai-ethics-module-7';

// ISO 42001 imports
import { iso42001Module1Quiz } from '../modules/iso-42001-module-1';
import { iso42001Module2Quiz } from '../modules/iso-42001-module-2';
import { iso42001Module3Quiz } from '../modules/iso-42001-module-3';
import { iso42001Module4Quiz } from '../modules/iso-42001-module-4';
import { iso42001Module5Quiz } from '../modules/iso-42001-module-5';
import { iso42001Module6Quiz } from '../modules/iso-42001-module-6';
import { iso42001Module7Quiz } from '../modules/iso-42001-module-7';

// China TC260 imports
import { chinaTc260Module1Quiz } from '../modules/china-tc260-module-1';
import { chinaTc260Module2Quiz } from '../modules/china-tc260-module-2';
import { chinaTc260Module3Quiz } from '../modules/china-tc260-module-3';
import { chinaTc260Module4Quiz } from '../modules/china-tc260-module-4';
import { chinaTc260Module5Quiz } from '../modules/china-tc260-module-5';
import { chinaTc260Module6Quiz } from '../modules/china-tc260-module-6';
import { chinaTc260Module7Quiz } from '../modules/china-tc260-module-7';

// Course ID to quiz mapping
const courseQuizzes: Record<number, QuizQuestion[][]> = {
  100001: [
    euAiActModule1Quiz,
    euAiActModule2Quiz,
    euAiActModule3Quiz,
    euAiActModule4Quiz,
    euAiActModule5Quiz,
    euAiActModule6Quiz,
    euAiActModule7Quiz,
  ],
  100002: [
    nistAiRmfModule1Quiz,
    nistAiRmfModule2Quiz,
    nistAiRmfModule3Quiz,
    nistAiRmfModule4Quiz,
    nistAiRmfModule5Quiz,
    nistAiRmfModule6Quiz,
    nistAiRmfModule7Quiz,
  ],
  100003: [
    ukAiSafetyModule1Quiz,
    ukAiSafetyModule2Quiz,
    ukAiSafetyModule3Quiz,
    ukAiSafetyModule4Quiz,
    ukAiSafetyModule5Quiz,
    ukAiSafetyModule6Quiz,
    ukAiSafetyModule7Quiz,
  ],
  100004: [
    canadaAidaModule1Quiz,
    canadaAidaModule2Quiz,
    canadaAidaModule3Quiz,
    canadaAidaModule4Quiz,
    canadaAidaModule5Quiz,
    canadaAidaModule6Quiz,
    canadaAidaModule7Quiz,
  ],
  100005: [
    australiaAiEthicsModule1Quiz,
    australiaAiEthicsModule2Quiz,
    australiaAiEthicsModule3Quiz,
    australiaAiEthicsModule4Quiz,
    australiaAiEthicsModule5Quiz,
    australiaAiEthicsModule6Quiz,
    australiaAiEthicsModule7Quiz,
  ],
  100006: [
    iso42001Module1Quiz,
    iso42001Module2Quiz,
    iso42001Module3Quiz,
    iso42001Module4Quiz,
    iso42001Module5Quiz,
    iso42001Module6Quiz,
    iso42001Module7Quiz,
  ],
  100007: [
    chinaTc260Module1Quiz,
    chinaTc260Module2Quiz,
    chinaTc260Module3Quiz,
    chinaTc260Module4Quiz,
    chinaTc260Module5Quiz,
    chinaTc260Module6Quiz,
    chinaTc260Module7Quiz,
  ],
};

/**
 * Get quiz questions for a specific course module
 * @param courseId - The course ID (100001-100007)
 * @param moduleIndex - The module index (0-based, 0 = module 1, 6 = module 7)
 * @returns Array of quiz questions, or null if course or module not found
 */
export function getModuleQuiz(courseId: number, moduleIndex: number): QuizQuestion[] | null {
  const courseQuizzesArray = courseQuizzes[courseId];

  if (!courseQuizzesArray) {
    return null;
  }

  if (moduleIndex < 0 || moduleIndex >= courseQuizzesArray.length) {
    return null;
  }

  return courseQuizzesArray[moduleIndex];
}
