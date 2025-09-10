import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/Sidebar';
import { 
  Send, 
  Bot, 
  User, 
  Code, 
  Loader2, 
  MessageSquare,
  Lightbulb,
  Shield,
  Zap,
  FileSearch,
  Copy,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';
import { apiClient, ChatResponse } from '@/lib/api';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  codeSnippet?: string;
  language?: string;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: "Hi! I'm your AI code assistant. I can help you analyze your codebase, explain functions, suggest improvements, find security issues, and answer any questions about your code. What would you like to know?",
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Get upload directory from URL params
  const uploadDir = searchParams.get('upload_dir');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat session
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setIsInitializing(true);
        const result = await apiClient.startChatSession(uploadDir || undefined);
        setSessionId(result.session_id);
        
        // Update welcome message with codebase info
        if (result.codebase_info.files > 0) {
          setMessages([{
            id: 'welcome',
            content: `Hi! I'm your AI code assistant. I've analyzed your codebase with ${result.codebase_info.files} files across ${result.codebase_info.languages.length} languages (${result.codebase_info.languages.join(', ')}). I can help you analyze code, explain functions, suggest improvements, find security issues, and answer any questions. What would you like to know?`,
            role: 'assistant',
            timestamp: new Date()
          }]);
        }
        
        toast({
          title: "Chat Ready!",
          description: `Connected to your codebase analysis.`,
        });
        
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to chat backend. Some features may not work.",
          variant: "destructive"
        });
      } finally {
        setIsInitializing(false);
      }
    };

    initializeChat();
  }, [uploadDir, toast]);

  const quickQuestions = [
    {
      icon: Shield,
      text: "Find security vulnerabilities in my code",
      color: "text-destructive bg-destructive/10"
    },
    {
      icon: Zap,
      text: "How can I improve performance?",
      color: "text-warning bg-warning/10"
    },
    {
      icon: Code,
      text: "Explain this function to me",
      color: "text-primary bg-primary/10"
    },
    {
      icon: FileSearch,
      text: "Review my code quality",
      color: "text-success bg-success/10"
    }
  ];

  // Simulated AI responses for demo purposes
  const getSimulatedResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('security') || message.includes('vulnerabilit')) {
      return `I've analyzed your codebase for security vulnerabilities. Here are my findings:

## Security Analysis Results

### 🔴 Critical Issues (2 found)
- **SQL Injection Risk**: Found in \`user-service.ts\` line 45
  \`\`\`typescript
  // Vulnerable code
  const query = "SELECT * FROM users WHERE id = " + userId;
  
  // Recommended fix
  const query = "SELECT * FROM users WHERE id = ?";
  db.query(query, [userId]);
  \`\`\`

- **XSS Vulnerability**: Unescaped user input in \`dashboard.tsx\`

### 🟡 Medium Issues (5 found)
- Missing input validation in authentication endpoints
- Weak password requirements
- Insufficient error handling that may leak sensitive info

### Recommendations:
1. Implement parameterized queries for all database operations
2. Add proper input sanitization and validation
3. Use HTTPS for all API communications
4. Implement rate limiting on authentication endpoints

Would you like me to dive deeper into any specific security issue?`;
    }
    
    if (message.includes('performance') || message.includes('optimize')) {
      return `## Performance Analysis Complete! ⚡

I've identified several optimization opportunities in your codebase:

### 🚀 High Impact Improvements
1. **Bundle Size Reduction** (Current: 2.4MB → Potential: 1.2MB)
   - Remove unused dependencies
   - Implement code splitting
   - Optimize image assets

2. **Component Optimization**
   \`\`\`tsx
   // Instead of re-rendering on every change
   const ExpensiveComponent = ({ data }) => {
     return <div>{data.map(item => <Item key={item.id} {...item} />)}</div>
   }
   
   // Use React.memo for better performance
   const OptimizedComponent = React.memo(({ data }) => {
     return <div>{data.map(item => <Item key={item.id} {...item} />)}</div>
   });
   \`\`\`

3. **API Call Optimization**
   - Implement request caching
   - Add pagination for large datasets
   - Use React Query for efficient data fetching

### 📊 Performance Metrics
- **First Contentful Paint**: 2.1s → Target: 1.2s
- **Largest Contentful Paint**: 3.8s → Target: 2.5s
- **Time to Interactive**: 4.2s → Target: 3.0s

Would you like specific implementation details for any of these optimizations?`;
    }
    
    if (message.includes('explain') || message.includes('function') || message.includes('code')) {
      return `I'd be happy to explain code functionality! Here's an example of what I can help you understand:

## Code Analysis Example

Let's look at this authentication function:

\`\`\`typescript
async function authenticateUser(email: string, password: string) {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }
    
    const isValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    return { user, token };
  } catch (error) {
    throw new Error('Authentication failed');
  }
}
\`\`\`

### 📝 Function Breakdown:
1. **Input Validation**: Takes email and password parameters
2. **User Lookup**: Searches database for user with matching email
3. **Password Verification**: Uses bcrypt to safely compare passwords
4. **Token Generation**: Creates JWT token for session management
5. **Error Handling**: Comprehensive try-catch for security

### 🛡️ Security Features:
- Password hashing with bcrypt
- JWT token with expiration
- Generic error messages (doesn't reveal if email exists)

Would you like me to explain any specific part of your code? Just paste it here!`;
    }
    
    if (message.includes('quality') || message.includes('review')) {
      return `## Code Quality Assessment 📊

I've performed a comprehensive code review of your project:

### 📈 Overall Score: 78/100

### ✅ Strengths
- **Good TypeScript Usage**: Proper type definitions and interfaces
- **Component Structure**: Well-organized React components
- **Modern Patterns**: Uses hooks and functional components effectively

### ⚠️ Areas for Improvement

#### 1. Code Consistency (Score: 6/10)
\`\`\`typescript
// Inconsistent naming - mix of camelCase and snake_case
const user_data = getUserData();
const userData = processUserInfo();

// Recommendation: Stick to camelCase consistently
const userData = getUserData();
const processedUserData = processUserInfo();
\`\`\`

#### 2. Error Handling (Score: 7/10)
- Missing try-catch blocks in async functions
- Generic error messages need improvement
- Add proper error boundaries in React components

#### 3. Documentation (Score: 5/10)
- Functions lack JSDoc comments
- Complex logic needs inline explanations
- Missing README sections

### 🎯 Action Items:
1. Add ESLint and Prettier for code consistency
2. Implement proper error handling patterns
3. Add comprehensive JSDoc comments
4. Write unit tests for critical functions

Would you like detailed recommendations for any specific area?`;
    }
    
    // Default response
    return `I'm here to help you with your code analysis! I can assist you with:

🔍 **Code Analysis**
- Security vulnerability scanning
- Performance optimization suggestions
- Code quality reviews
- Best practices recommendations

💡 **Code Explanation**
- Function and component breakdowns
- Algorithm explanations
- Architecture guidance
- Debugging assistance

🛠️ **Practical Help**
- Refactoring suggestions
- Bug identification
- Testing strategies
- Documentation improvements

Feel free to ask me about any specific part of your codebase, paste code snippets for review, or ask for general development advice. What would you like to explore?`;
  };

  const handleSendMessage = async (content?: string) => {
    const messageContent = content || inputValue.trim();
    if (!messageContent || !sessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await apiClient.sendChatMessage(sessionId, messageContent);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.response.content,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show follow-up suggestions if available
      if (response.response.follow_up_suggestions.length > 0) {
        toast({
          title: "Follow-up suggestions available",
          description: "Check the AI's response for related questions you can ask.",
        });
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I'm sorry, I encountered an error while processing your question: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or rephrase your question.`,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Chat Error",
        description: "Failed to get response from AI assistant.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard.",
    });
  };

  const formatMessage = (content: string) => {
    // Simple code block detection and formatting
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = content.split(codeBlockRegex);
    
    return parts.map((part, index) => {
      if (index % 3 === 1) {
        // This is a language identifier
        return null;
      } else if (index % 3 === 2) {
        // This is code content
        const language = parts[index - 1] || 'code';
        return (
          <div key={index} className="my-4">
            <div className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded-t-lg border">
              <Badge variant="outline" className="text-xs">
                {language}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(part)}
                className="h-6 w-6 p-0"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            <pre className="bg-muted p-4 rounded-b-lg overflow-x-auto border border-t-0">
              <code className="text-sm">{part}</code>
            </pre>
          </div>
        );
      } else {
        // This is regular text
        return (
          <span key={index} className="whitespace-pre-wrap">
            {part}
          </span>
        );
      }
    });
  };

  if (false) { // Removed API key requirement
    return null; // This block is now disabled
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex w-full">
        <Sidebar />
        
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
                  <MessageSquare className="w-6 h-6" />
                  AI Code Assistant
                </h1>
                <p className="text-muted-foreground">Ask questions about your codebase</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMessages([messages[0]]);
                  setInputValue('');
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-3xl ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50'
                    } rounded-2xl p-4 relative group`}
                  >
                    <div className="text-sm leading-relaxed">
                      {formatMessage(message.content)}
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
                      <span className="text-xs opacity-60">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(message.content)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-muted/50 rounded-2xl p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="p-6 border-t border-border bg-muted/20">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  Quick Questions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {quickQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start h-auto p-3 text-left"
                      onClick={() => handleSendMessage(question.text)}
                    >
                      <div className={`p-2 rounded-lg ${question.color} mr-3`}>
                        <question.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm">{question.text}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask me anything about your code..."
                    disabled={isLoading}
                    className="pr-12 min-h-[3rem] resize-none"
                  />
                </div>
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isLoading || isInitializing || !sessionId}
                  variant="hero"
                  size="lg"
                  className="px-6"
                >
                  {isLoading || isInitializing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Press Enter to send • Shift+Enter for new line
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Chat;