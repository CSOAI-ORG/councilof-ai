import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageCircle, 
  Mail, 
  Send, 
  Bot, 
  User, 
  ChevronDown, 
  BookOpen, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  ArrowRight,
  Clock,
  Search
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isHumanRequest?: boolean;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: '1',
  role: 'assistant',
  content: `Hello! 👋 I'm the CSOAI Support Assistant, available 24/7 to help you.

I can assist you with:
• **Account & Login Issues** - Password resets, account access
• **Course & Training Questions** - Enrollment, progress, certificates
• **Payment & Billing** - Subscriptions, refunds, promo codes
• **Technical Support** - Platform issues, browser compatibility
• **Certification Exams** - Exam preparation, results, retakes
• **Watchdog Program** - Incident reporting, analyst applications

How can I help you today?`,
  timestamp: new Date(),
};

// Knowledge base for AI responses
const KNOWLEDGE_BASE = {
  password: {
    keywords: ['password', 'forgot', 'reset', 'login', 'cant login', "can't login", 'access'],
    response: `I understand you're having trouble with your password. Here's how to reset it:

1. Go to the **Login page**
2. Click **"Forgot Password?"** below the login form
3. Enter your email address
4. Check your inbox (and spam folder) for the reset link
5. Click the link and create a new password

**Note:** The reset link expires in 1 hour. If you don't receive the email within 5 minutes, please check your spam folder or try again.

Would you like me to connect you with a human support agent for further assistance?`
  },
  payment: {
    keywords: ['payment', 'billing', 'charge', 'refund', 'subscription', 'cancel', 'price', 'cost', 'promo', 'discount', 'founding', 'free'],
    response: `I can help with payment and billing questions!

**Common Payment Topics:**
• **FOUNDING10K Code** - First 10,000 signups get free access to the £499 course
• **Monthly Plans** - Flexible payment options available for all courses
• **Refunds** - 30-day money-back guarantee on all purchases
• **Subscription Management** - Manage your subscription in Settings → Payment

**For specific billing issues** (refunds, disputed charges, or account-specific questions), I recommend connecting with our human support team who can access your account details.

Would you like me to connect you with a human agent?`
  },
  course: {
    keywords: ['course', 'training', 'enroll', 'enrolled', 'progress', 'lesson', 'module', 'certificate', 'complete', 'finish'],
    response: `I can help with course-related questions!

**Course Access:**
• View your enrolled courses at **My Courses**
• Track progress with the progress bar on each course
• Resume where you left off - your progress is saved automatically

**Certificates:**
• Certificates are issued upon completing all lessons
• Download certificates from **My Certificates** page
• Certificates include your name, completion date, and course details

**Having trouble with a specific course?** Please let me know which course and what issue you're experiencing, or I can connect you with human support.`
  },
  exam: {
    keywords: ['exam', 'test', 'certification', 'pass', 'fail', 'score', 'retake', 'attempt'],
    response: `Here's information about the certification exam:

**Exam Details:**
• 50 multiple-choice questions
• 2-hour time limit
• 70% passing score required
• Covers all major AI safety frameworks

**Retakes:**
• You can retake the exam after 24 hours
• Review your previous attempts at **Certification → Review Past Exams**

**Preparation Tips:**
• Complete all training modules first
• Review the framework-specific courses (EU AI Act, NIST, etc.)
• Use the practice questions in each module

Need more specific help with exam preparation?`
  },
  watchdog: {
    keywords: ['watchdog', 'incident', 'report', 'analyst', 'safety', 'job', 'apply'],
    response: `The Watchdog Program is our AI safety incident reporting system.

**For the Public:**
• Report AI safety incidents at **Watchdog → Report Incident**
• Track your reports in your dashboard
• All reports are reviewed by certified analysts

**Becoming an Analyst:**
1. Complete the CEASAI training program
2. Pass the certification exam (70% minimum)
3. Apply through **Watchdog → Analyst Jobs**
4. Start reviewing incidents

**Analyst Benefits:**
• Remote work, flexible hours
• Meaningful work protecting humanity

Would you like more details about the analyst program?`
  },
  technical: {
    keywords: ['bug', 'error', 'broken', 'not working', "doesn't work", 'issue', 'problem', 'crash', 'slow', 'loading'],
    response: `I'm sorry you're experiencing technical issues. Let me help troubleshoot:

**Quick Fixes:**
1. **Refresh the page** (Ctrl/Cmd + R)
2. **Clear browser cache** (Ctrl/Cmd + Shift + Delete)
3. **Try a different browser** (Chrome, Firefox, Safari recommended)
4. **Disable browser extensions** that might interfere

**Still having issues?**
Please describe:
• What you were trying to do
• What error message you see (if any)
• Which browser you're using

I can connect you with our technical team for complex issues.`
  },
  human: {
    keywords: ['human', 'person', 'real person', 'agent', 'talk to someone', 'speak to', 'contact'],
    response: `I'll connect you with a human support agent right away.

**Please provide:**
• Your email address (for follow-up)
• A brief description of your issue

Our support team typically responds within:
• **Email:** 2-4 hours during business hours
• **Urgent issues:** Escalated immediately

Click the button below to submit your request to our human support team.`
  }
};

export default function Support() {
  const { user } = useAuth();
  const submitHumanRequest = trpc.support.submitHumanRequest.useMutation();
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHumanForm, setShowHumanForm] = useState(false);
  const [humanRequestEmail, setHumanRequestEmail] = useState(user?.email || '');
  const [humanRequestMessage, setHumanRequestMessage] = useState('');
  const [isSubmittingHumanRequest, setIsSubmittingHumanRequest] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'Support - CSOAI';
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const findBestResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check each knowledge base category
    for (const [category, data] of Object.entries(KNOWLEDGE_BASE)) {
      if (data.keywords.some(keyword => lowerMessage.includes(keyword))) {
        return data.response;
      }
    }
    
    // Default response if no match
    return `Thank you for your question. I want to make sure I understand correctly so I can help you best.

Could you please provide more details about:
• What specific issue are you experiencing?
• What were you trying to do when this happened?

Alternatively, I can connect you with a human support agent who can assist you directly. Just say "connect me to human support" and I'll arrange that for you.`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Check if user wants human support
    const wantsHuman = inputValue.toLowerCase().includes('human') || 
                       inputValue.toLowerCase().includes('person') ||
                       inputValue.toLowerCase().includes('agent') ||
                       inputValue.toLowerCase().includes('talk to someone');

    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    const response = findBestResponse(inputValue);
    
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      isHumanRequest: wantsHuman || response.includes('connect you with a human'),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);

    // Show human form if appropriate
    if (wantsHuman || response.includes('connect you with a human')) {
      setShowHumanForm(true);
    }
  };

  const handleHumanSupportRequest = async () => {
    if (!humanRequestEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSubmittingHumanRequest(true);

    try {
      // Send email to admin via tRPC
      const result = await submitHumanRequest.mutateAsync({
        email: humanRequestEmail,
        message: humanRequestMessage || 'User requested human support via chat',
        chatHistory: messages.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp.toISOString(),
        })),
        userId: user?.id,
        userName: user?.name,
      });

      if (result.success) {
        toast.success('Your request has been submitted! Our team will contact you within 2-4 hours.');
        setShowHumanForm(false);
        
        const confirmMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `✅ **Request Submitted Successfully!**

Your human support request has been sent to our team. Here's what happens next:

• **Email confirmation** sent to ${humanRequestEmail}
• **Response time:** 2-4 hours during business hours
• **Urgent issues:** Escalated immediately

Our team has access to this chat history to help resolve your issue quickly.

Is there anything else I can help you with in the meantime?`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, confirmMessage]);
      }
    } catch (error) {
      toast.error('Failed to submit request. Please try again or email support@csoai.org directly.');
    } finally {
      setIsSubmittingHumanRequest(false);
    }
  };

  const faqs = [
    {
      question: 'How do I reset my password?',
      answer: 'Go to the Login page and click "Forgot Password?" Enter your email address and check your inbox for the reset link. The link expires in 1 hour.',
    },
    {
      question: 'How do I use the FOUNDING10K promo code?',
      answer: 'Enter FOUNDING10K at checkout when enrolling in any course. This gives the first 10,000 users free access to the £499 course. The code is automatically applied if you\'re among the first 10,000 signups.',
    },
    {
      question: 'What is the passing score for the certification exam?',
      answer: 'You need 70% (35 out of 50 questions) to pass the certification exam. You have 2 hours to complete it, and can retake after 24 hours if needed.',
    },
    {
      question: 'How do I become a Watchdog Analyst?',
      answer: 'Complete the CEASAI training program, pass the certification exam with at least 70%, then apply through the Watchdog → Analyst Jobs page. Analysts review AI safety incidents for compliance.',
    },
    {
      question: 'Can I get a refund?',
      answer: 'Yes, we offer a 30-day money-back guarantee on all purchases. Contact our support team with your order details for a full refund.',
    },
    {
      question: 'How do I download my certificate?',
      answer: 'After completing a course, go to My Certificates page. Click the download button on your certificate to get a PDF version with your name, completion date, and course details.',
    },
  ];

  const helpCategories = [
    {
      title: 'Getting Started',
      icon: BookOpen,
      description: 'Learn the basics and get up and running',
      link: '/how-it-works',
    },
    {
      title: 'Training & Certification',
      icon: CheckCircle,
      description: 'Information about courses and exams',
      link: '/courses',
    },
    {
      title: 'Watchdog Program',
      icon: AlertCircle,
      description: 'Incident reporting and analyst roles',
      link: '/watchdog',
    },
  ];

  return (
    <div className="w-full bg-white min-h-screen">
      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeInUp}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              24/7 Support Center
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Get instant help from our AI assistant or connect with our human support team.
            </p>
            <p className="text-sm text-emerald-600 font-medium">
              <Clock className="inline h-4 w-4 mr-1" />
              AI Support: Available 24/7 • Human Support: 2-4 hour response time
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content - Chat and Quick Help */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* AI Chat Section */}
            <div className="lg:col-span-2">
              <Card className="h-[600px] flex flex-col shadow-lg border-emerald-100">
                {/* Chat Header */}
                <div className="p-4 border-b bg-emerald-50 rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                      <Bot className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">CSOAI Support Assistant</h3>
                      <p className="text-sm text-emerald-600 flex items-center gap-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        Online - Available 24/7
                      </p>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div 
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
                >
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === 'user'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-2">
                            <Bot className="h-4 w-4 text-emerald-600" />
                            <span className="text-xs font-medium text-emerald-600">Support Assistant</span>
                          </div>
                        )}
                        <div 
                          className="text-sm whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ 
                            __html: message.content
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\n/g, '<br/>')
                          }}
                        />
                        <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-emerald-100' : 'text-gray-400'}`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                          <span className="text-sm text-gray-500">Typing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Human Support Form */}
                {showHumanForm && (
                  <div className="p-4 bg-amber-50 border-t border-amber-200">
                    <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Connect with Human Support
                    </h4>
                    <div className="space-y-3">
                      <Input
                        type="email"
                        placeholder="Your email address"
                        value={humanRequestEmail}
                        onChange={(e) => setHumanRequestEmail(e.target.value)}
                        className="bg-white"
                      />
                      <Textarea
                        placeholder="Briefly describe your issue (optional - we have your chat history)"
                        value={humanRequestMessage}
                        onChange={(e) => setHumanRequestMessage(e.target.value)}
                        className="bg-white h-20"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleHumanSupportRequest}
                          disabled={isSubmittingHumanRequest}
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          {isSubmittingHumanRequest ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Mail className="h-4 w-4 mr-2" />
                              Submit Request
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowHumanForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Chat Input */}
                <div className="p-4 border-t bg-white rounded-b-lg">
                  <div className="flex gap-2">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your question..."
                      className="flex-1"
                      disabled={isTyping}
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isTyping}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Type "human support" anytime to connect with our team
                  </p>
                </div>
              </Card>
            </div>

            {/* Quick Help Sidebar */}
            <div className="space-y-6">
              {/* Quick Links */}
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
                <div className="space-y-3">
                  {helpCategories.map((category) => (
                    <a
                      key={category.title}
                      href={category.link}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                        <category.icon className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{category.title}</p>
                        <p className="text-xs text-gray-500">{category.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                    </a>
                  ))}
                </div>
              </Card>

              {/* Contact Info */}
              <Card className="p-6 bg-emerald-50 border-emerald-100">
                <h3 className="font-semibold text-gray-900 mb-4">Contact Us</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <a href="mailto:support@csoai.org" className="text-sm text-emerald-600 hover:underline">
                        support@csoai.org
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Chat Support</p>
                      <p className="text-sm text-gray-600">24/7 AI + Human backup</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <motion.h2 {...fadeInUp} className="text-3xl font-bold mb-8 text-center text-gray-900">
            Frequently Asked Questions
          </motion.h2>
          
          {/* Search FAQs */}
          <div className="relative max-w-xl mx-auto mb-8">
            <Search className="absolute left-4 top-3 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>

          <div className="space-y-4">
            {faqs
              .filter(faq => 
                !searchQuery || 
                faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                      <ChevronDown
                        className={`h-5 w-5 text-gray-600 transition-transform ${
                          expandedFAQ === index ? 'transform rotate-180' : ''
                        }`}
                      />
                    </div>
                    {expandedFAQ === index && (
                      <p className="mt-4 text-gray-600">{faq.answer}</p>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-emerald-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Still Need Help?
            </h2>
            <p className="text-xl text-emerald-100 mb-8">
              Our support team is here to help you succeed with CSOAI.
            </p>
            <a href="mailto:support@csoai.org">
              <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100">
                <Mail className="h-5 w-5 mr-2" />
                Email Support Team
              </Button>
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
