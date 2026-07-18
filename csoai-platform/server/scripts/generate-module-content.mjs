/**
 * Generate Comprehensive Module Content using Gemini API
 * 
 * This script generates 5,000+ word educational content for NIST AI RMF and ISO 42001 modules
 * matching the quality standard of EU AI Act modules.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { writeFileSync } from 'fs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// Module definitions
const nistModules = [
  {
    id: 2,
    title: 'Trustworthy AI Characteristics',
    framework: 'NIST AI RMF',
    topics: [
      'All 7 trustworthy AI characteristics in depth',
      'Valid & Reliable: accuracy, robustness, generalizability',
      'Safe: harm prevention, fail-safe mechanisms',
      'Secure & Resilient: cybersecurity, adversarial robustness',
      'Accountable & Transparent: documentation, auditability',
      'Explainable & Interpretable: model transparency, decision explanations',
      'Privacy-Enhanced: data protection, privacy-preserving techniques',
      'Fair with Harmful Bias Managed: fairness metrics, bias mitigation',
      'Practical examples and implementation guidance for each characteristic',
      'Trade-offs and balancing between characteristics'
    ]
  },
  {
    id: 3,
    title: 'GOVERN Function',
    framework: 'NIST AI RMF',
    topics: [
      'Governance structure for AI risk management',
      'Policies, procedures, and processes',
      'Organizational roles and responsibilities',
      'Risk management culture and leadership commitment',
      'AI governance frameworks and best practices',
      'Integration with enterprise risk management',
      'Stakeholder engagement and communication',
      'Governance metrics and performance indicators',
      'Cross-functional collaboration and coordination',
      'Continuous improvement of governance practices'
    ]
  },
  {
    id: 4,
    title: 'MAP Function',
    framework: 'NIST AI RMF',
    topics: [
      'Context mapping and organizational understanding',
      'AI system categorization and classification',
      'Impact assessment methodologies',
      'Stakeholder identification and analysis',
      'Risk identification and documentation',
      'Legal, regulatory, and ethical considerations',
      'Foreseeable misuse and unintended consequences',
      'AI lifecycle stage considerations',
      'Documentation and record-keeping requirements',
      'Practical mapping exercises and templates'
    ]
  },
  {
    id: 5,
    title: 'MEASURE Function',
    framework: 'NIST AI RMF',
    topics: [
      'Metrics and measurement frameworks',
      'Performance evaluation methodologies',
      'Fairness and bias testing approaches',
      'Robustness and reliability assessment',
      'Security and privacy testing',
      'Explainability evaluation methods',
      'Validation and verification processes',
      'Continuous monitoring strategies',
      'Benchmarking and baseline establishment',
      'Measurement tools and platforms'
    ]
  },
  {
    id: 6,
    title: 'MANAGE Function',
    framework: 'NIST AI RMF',
    topics: [
      'Risk response strategies (avoid, mitigate, transfer, accept)',
      'Incident response and management',
      'Change management for AI systems',
      'Continuous monitoring and adaptation',
      'System updates and maintenance',
      'Decommissioning and retirement processes',
      'Documentation and reporting requirements',
      'Stakeholder communication during incidents',
      'Lessons learned and continuous improvement',
      'Integration with organizational processes'
    ]
  },
  {
    id: 7,
    title: 'AI Lifecycle and Actors',
    framework: 'NIST AI RMF',
    topics: [
      'Four AI lifecycle stages: Plan & Design, Develop, Deploy, Operate & Monitor',
      'Detailed activities and considerations for each stage',
      'AI actor roles: developers, deployers, users, affected parties',
      'Responsibilities and accountabilities by role',
      'Supply chain considerations and third-party risks',
      'Collaboration and handoffs between actors',
      'Training and competence requirements',
      'Documentation requirements throughout lifecycle',
      'Lifecycle-specific risk management activities',
      'Best practices for each stage and role'
    ]
  },
  {
    id: 8,
    title: 'Implementation Roadmap',
    framework: 'NIST AI RMF',
    topics: [
      'Step-by-step implementation approach',
      'Organizational readiness assessment',
      'Maturity models and capability levels',
      'Resource planning and allocation',
      'Integration with existing management systems',
      'Phased implementation strategies',
      'Quick wins and pilot projects',
      'Common challenges and solutions',
      'Success factors and best practices',
      'Continuous improvement and evolution'
    ]
  }
];

const isoModules = [
  {
    id: 2,
    title: 'AIMS Requirements and Structure',
    framework: 'ISO 42001',
    topics: [
      'ISO 42001 structure: 10 clauses following High-Level Structure (HLS)',
      'Detailed explanation of each clause (4-10)',
      'Mandatory vs optional requirements',
      'Documentation requirements and hierarchy',
      'Annex A controls overview and categories',
      'Integration with other ISO standards (27001, 9001, etc.)',
      'Applicability and scope considerations',
      'Conformity assessment requirements',
      'Certification implications',
      'Practical guidance for each clause'
    ]
  },
  {
    id: 3,
    title: 'Context and Leadership',
    framework: 'ISO 42001',
    topics: [
      'Clause 4: Understanding organizational context',
      'Internal and external issues analysis',
      'Interested parties identification and requirements',
      'AIMS scope definition and boundaries',
      'Clause 5: Leadership and commitment requirements',
      'Top management responsibilities',
      'AI policy development and communication',
      'Organizational roles, responsibilities, and authorities',
      'Leadership commitment demonstration',
      'Practical examples and templates'
    ]
  },
  {
    id: 4,
    title: 'Planning and Risk Management',
    framework: 'ISO 42001',
    topics: [
      'Clause 6: Planning for the AIMS',
      'Risk and opportunity identification',
      'AI risk assessment methodologies',
      'Risk treatment options and strategies',
      'AI objectives setting and planning',
      'Statement of Applicability (SoA) development',
      'Risk treatment plans and implementation',
      'Integration with enterprise risk management',
      'Documentation and record-keeping',
      'Practical risk assessment exercises'
    ]
  },
  {
    id: 5,
    title: 'Support and Operations',
    framework: 'ISO 42001',
    topics: [
      'Clause 7: Support requirements',
      'Resources: people, infrastructure, technology, knowledge',
      'Competence determination and development',
      'Awareness programs and training',
      'Communication planning and execution',
      'Documented information management',
      'Clause 8: Operational planning and control',
      'AI system lifecycle management',
      'Change management processes',
      'Supplier and external provider management'
    ]
  },
  {
    id: 6,
    title: 'Performance Evaluation',
    framework: 'ISO 42001',
    topics: [
      'Clause 9: Performance evaluation requirements',
      'Monitoring and measurement planning',
      'Performance indicators and metrics',
      'Internal audit program and execution',
      'Auditor competence and independence',
      'Audit planning, execution, and reporting',
      'Management review process and frequency',
      'Management review inputs and outputs',
      'Evaluation results documentation',
      'Continuous performance improvement'
    ]
  },
  {
    id: 7,
    title: 'Improvement and Certification',
    framework: 'ISO 42001',
    topics: [
      'Clause 10: Continual improvement requirements',
      'Nonconformity identification and management',
      'Corrective action process and root cause analysis',
      'Preventive action and proactive improvement',
      'ISO 42001 certification process overview',
      'Stage 1 and Stage 2 audit preparation',
      'Surveillance audit requirements',
      'Recertification process',
      'Certification maintenance and continuous compliance',
      'Best practices for certification success'
    ]
  },
  {
    id: 8,
    title: 'Implementation Best Practices',
    framework: 'ISO 42001',
    topics: [
      'Step-by-step implementation roadmap',
      'Implementation timeline and milestones',
      'Resource requirements and planning',
      'Integration with existing management systems',
      'Phased vs big-bang implementation approaches',
      'Common implementation challenges and solutions',
      'Success factors and critical success criteria',
      'Organizational culture and change management',
      'Alignment with business strategy',
      'Real-world case studies and lessons learned'
    ]
  }
];

async function generateModuleContent(module) {
  const prompt = `You are an expert technical writer creating comprehensive educational content for professional certification training.

Create a detailed, professional educational module with the following specifications:

**Module Title**: ${module.title}
**Framework**: ${module.framework}
**Target Word Count**: 5,000-6,000 words
**Target Audience**: Professionals seeking certification in AI governance and risk management

**Topics to Cover**:
${module.topics.map((topic, i) => `${i + 1}. ${topic}`).join('\n')}

**Content Structure Requirements**:
1. Start with a compelling introduction explaining why this module matters
2. Use clear hierarchical headings (##, ###, ####)
3. Include practical examples and real-world scenarios
4. Add tables, lists, and blockquotes for key concepts
5. Provide actionable implementation guidance
6. Include "Key Takeaways" section at the end with ✅ checkmarks
7. Use professional, clear language suitable for technical professionals
8. Include specific technical details and methodologies
9. Reference industry best practices and standards
10. End with a conclusion that ties concepts together

**Style Guidelines**:
- Write in complete, well-structured paragraphs
- Use Markdown formatting for structure and emphasis
- Include concrete examples with specific details
- Balance theory with practical application
- Maintain professional, authoritative tone
- Avoid marketing language; focus on education
- Use bullet points sparingly; prefer paragraphs
- Include relevant technical terminology with explanations

**Quality Standard**: Match the depth and professionalism of graduate-level technical education materials.

Generate the complete module content now in Markdown format:`;

  console.log(`\nGenerating content for: ${module.framework} - ${module.title}...`);
  
  const result = await model.generateContent(prompt);
  const content = result.response.text();
  
  console.log(`✓ Generated ${content.length} characters`);
  
  return content;
}

async function main() {
  const allModules = [...nistModules, ...isoModules];
  const results = [];
  
  console.log(`Starting generation of ${allModules.length} modules...`);
  
  for (const module of allModules) {
    try {
      const content = await generateModuleContent(module);
      results.push({
        framework: module.framework,
        id: module.id,
        title: module.title,
        content: content,
        wordCount: content.split(/\s+/).length
      });
      
      // Rate limiting: wait 2 seconds between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error generating ${module.title}:`, error.message);
      results.push({
        framework: module.framework,
        id: module.id,
        title: module.title,
        error: error.message
      });
    }
  }
  
  // Save results to JSON file
  writeFileSync(
    'generated-module-content.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n=== Generation Complete ===');
  console.log(`Total modules: ${results.length}`);
  console.log(`Successful: ${results.filter(r => !r.error).length}`);
  console.log(`Failed: ${results.filter(r => r.error).length}`);
  console.log(`Total words: ${results.reduce((sum, r) => sum + (r.wordCount || 0), 0).toLocaleString()}`);
  console.log('\nResults saved to: generated-module-content.json');
}

main().catch(console.error);
