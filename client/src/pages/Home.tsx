/*
 * CSOAI Home Page - Open WebUI Inspired Design
 * Welcome screen with suggestion cards for AI Safety tasks
 * "Hello, [Name] - How can I help you today?"
 * Functional LLM chat for compliance questions
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { 
  Plus, 
  Mic, 
  ArrowUp,
  FileCheck,
  AlertTriangle,
  Users,
  Eye,
  Zap,
  Loader2,
  User,
  Bot,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import DashboardLayout from "@/components/DashboardLayout";
import AISystemNotice from "@/components/AISystemNotice";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const suggestionPrompts = [
  {
    title: "Run compliance check",
    subtitle: "for EU AI Act requirements",
    icon: FileCheck,
    action: "/compliance",
    prompt: "What are the key compliance requirements under the EU AI Act for high-risk AI systems?"
  },
  {
    title: "Assess AI system risk",
    subtitle: "using multi-framework analysis",
    icon: AlertTriangle,
    action: "/ai-systems",
    prompt: "How do I classify my AI system's risk level according to the EU AI Act?"
  },
  {
    title: "View agent council",
    subtitle: "33-seat voting status",
    icon: Users,
    action: "/agent-council",
    prompt: "Explain how the designed 33-seat council voting works, and what n_eff 1.21/3 means."
  },
  {
    title: "Check Watchdog reports",
    subtitle: "public incident submissions",
    icon: Eye,
    action: "/watchdog",
    prompt: "What types of AI safety incidents should be reported to The Watchdog?"
  },
];

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userName = user?.name || "Admin";

  // Chat mutation
  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.response,
        timestamp: data.timestamp,
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (error) => {
      toast.error("Failed to send message", { description: error.message });
      // Remove the pending user message
      setMessages(prev => prev.slice(0, -1));
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSuggestionClick = (prompt: string) => {
    setInputValue(prompt);
    // Auto-submit the suggestion
    handleSubmitMessage(prompt);
  };

  const handleSubmitMessage = (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    // Send to API
    sendMessage.mutate({ message: text });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmitMessage();
  };

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const hasMessages = messages.length > 0;

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        <div className="px-4 pt-4 max-w-3xl mx-auto w-full">
          <AISystemNotice route="/old-home" />
        </div>
        {/* Messages Area or Welcome Screen */}
        <div className="flex-1 overflow-y-auto">
          {hasMessages ? (
            // Chat Messages
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex gap-4 ${message.role === "user" ? "justify-end" : ""}`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                    <div className={`flex-1 max-w-[80%] ${message.role === "user" ? "text-right" : ""}`}>
                      <div
                        className={`inline-block p-4 rounded-2xl ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <Streamdown>{message.content}</Streamdown>
                          </div>
                        ) : (
                          <p>{message.content}</p>
                        )}
                      </div>
                      {message.role === "assistant" && (
                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-muted-foreground"
                            onClick={() => handleCopy(message.content, message.id)}
                          >
                            {copiedId === message.id ? (
                              <Check className="h-3 w-3 mr-1" />
                            ) : (
                              <Copy className="h-3 w-3 mr-1" />
                            )}
                            {copiedId === message.id ? "Copied" : "Copy"}
                          </Button>
                        </div>
                      )}
                    </div>
                    {message.role === "user" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Loading indicator */}
              {sendMessage.isPending && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">CSOAI is thinking...</span>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          ) : (
            // Welcome Screen - Centered like Open WebUI
            <div className="flex-1 flex flex-col items-center justify-center px-8 lg:px-20 h-full">
              <div className="w-full max-w-3xl">
                {/* CSOAI Logo/Avatar */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex justify-start mb-2"
                >
                  <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-sm">
                    CSOAI
                  </div>
                </motion.div>

                {/* Welcome Message */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                  className="mb-4"
                >
                  <h1 className="text-3xl font-primary font-semibold text-foreground">
                    Hello, {userName}
                  </h1>
                  <p className="text-xl text-muted-foreground">
                    How can I help you today?
                  </p>
                </motion.div>

                {/* Suggested Label */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: 0.2 }}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2"
                >
                  <Zap className="h-3 w-3" />
                  <span>Suggested</span>
                </motion.div>

                {/* Suggestion Cards - Open WebUI Grid Style */}
                <div className="grid grid-cols-2 gap-2 mb-8">
                  {suggestionPrompts.map((prompt, idx) => {
                    const Icon = prompt.icon;
                    return (
                      <motion.button
                        key={prompt.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: 0.1 + idx * 0.06 }}
                        onClick={() => handleSuggestionClick(prompt.prompt)}
                        className="suggestion-card text-left group"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground group-hover:text-foreground transition line-clamp-1">
                            {prompt.title}
                          </span>
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {prompt.subtitle}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Input Bar - Open WebUI Style */}
        <div className="p-4 pb-6 border-t border-border bg-background">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit}>
              <div className="relative flex items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setMessages([]);
                    toast.success("Chat cleared");
                  }}
                >
                  <Plus className="h-5 w-5" />
                </Button>
                
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about AI safety, compliance, or governance..."
                  className="pl-12 pr-20 py-6 rounded-2xl bg-secondary border-0 text-base placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
                  disabled={sendMessage.isPending}
                />
                
                <div className="absolute right-2 flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => toast.info("Voice input coming soon")}
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!inputValue.trim() || sendMessage.isPending}
                    className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30"
                  >
                    {sendMessage.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowUp className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </form>
            
            {/* Disclaimer */}
            <p className="text-center text-xs text-muted-foreground mt-2">
              CSOAI can make mistakes. Verify compliance information with legal experts.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
