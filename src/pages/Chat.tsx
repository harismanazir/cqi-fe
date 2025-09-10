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
        console.log('[Chat] Initializing chat session with uploadDir:', uploadDir);
        setIsInitializing(true);
        
        const result = await apiClient.startChatSession(uploadDir || undefined);
        console.log('[Chat] Chat session started:', result);
        
        setSessionId(result.session_id);
        
        // Update welcome message with codebase info if available
        if (result.codebase_info?.path && result.codebase_info.path !== '.') {
          setMessages([{
            id: 'welcome',
            content: `Hi! I'm your AI code assistant. I've connected to your uploaded codebase and I'm ready to help you analyze your code, explain functions, suggest improvements, find security issues, and answer any questions. What would you like to know?`,
            role: 'assistant',
            timestamp: new Date()
          }]);
        }
        
        toast({
          title: "Chat Ready!",
          description: "Connected to your code analysis backend.",
        });
        
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to chat backend. Using demo mode.",
          variant: "destructive"
        });
        
        // Set a mock session ID for demo mode
        setSessionId('demo-session');
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

  // Enhanced AI responses based on the analysis output format
  const getEnhancedResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('security') || message.includes('vulnerabilit')) {
      return `I've analyzed your codebase for security vulnerabilities based on the LangGraph multi-agent analysis. Here are the key findings:

## 🔒 Security Analysis Results

### Critical/High Issues Found:
- **Hardcoded Credentials**: API keys found directly in code files
  - **Location**: Line 13 in main configuration files
  - **Risk**: Exposure of sensitive credentials
  - **Fix**: Use environment variables or secure secrets management

- **Input Validation Issues**: Unvalidated user input detected
  - **Location**: Multiple endpoints and functions
  - **Risk**: Potential injection attacks
  - **Fix**: Implement proper input sanitization and validation

### Recommendations:
1. **Immediate**: Move all hardcoded secrets to environment variables
2. **Short-term**: Implement comprehensive input validation
3. **Long-term**: Add security scanning to your CI/CD pipeline

Would you like me to dive deeper into any specific security issue or provide code examples for the fixes?`;
    }
    
    if (message.includes('performance') || message.includes('optimize')) {
      return `## ⚡ Performance Analysis Complete!

Based on the LangGraph Performance Agent analysis, here are the optimization opportunities:

### High Impact Improvements:
1. **Inefficient String Operations** - Multiple instances found
   - Use f-strings or join() methods instead of concatenation
   - Potential 40-60% performance improvement

2. **Unnecessary Object Creation** - Resource waste detected
   - Cache frequently created objects
   - Implement object pooling for heavy operations

3. **I/O Bottlenecks** - Blocking operations identified
   - Implement async/await patterns
   - Add connection pooling for database operations

### Performance Metrics:
- **Current Processing Time**: ~19.14s for analysis
- **Optimization Potential**: Up to 50% improvement
- **Memory Usage**: Can be reduced by 30% with object caching

Would you like specific code examples for implementing these optimizations?`;
    }
    
    if (message.includes('quality') || message.includes('review') || message.includes('complexity')) {
      return `## 📊 Code Quality Assessment

Based on the LangGraph multi-agent analysis (Security, Performance, Complexity, Documentation):

### Overall Analysis Results:
- **Files Analyzed**: Multiple code files processed
- **Total Issues Found**: 21 issues across all categories
- **Processing Time**: 19.14 seconds
- **LLM Tokens Used**: 3,456 tokens

### Agent Results Breakdown:
- **Security Agent**: 3 issues found (confidence: 90%)
- **Complexity Agent**: 5 issues found (confidence: 85%)  
- **Performance Agent**: 3 issues found (confidence: 80%)
- **Documentation Agent**: 10 issues found (confidence: 80%)

### Issue Severity Distribution:
- **High Priority**: 3 issues requiring immediate attention
- **Medium Priority**: 9 issues for next sprint
- **Low Priority**: 9 issues for future improvement

### Top Complexity Issues:
1. **High Cyclomatic Complexity** - Functions with too many conditional paths
2. **Long Functions/Methods** - Break into smaller, focused functions
3. **Deep Nesting Levels** - Simplify conditional logic
4. **Too Many Parameters** - Use data structures or builder patterns

Would you like detailed recommendations for any specific area?`;
    }
    
    if (message.includes('documentation') || message.includes('comment')) {
      return `## 📚 Documentation Analysis Results

The Documentation Agent found several areas for improvement:

### Missing Documentation Issues:
- **10 total documentation issues found**
- **Functions lacking docstrings**: Multiple public methods need documentation
- **Unclear variable names**: Several variables could be more descriptive

### Specific Findings:
1. **Missing Function Documentation**:
   \`\`\`python
   # Current - lacks documentation
   def retrieve_docs(query):
       # implementation
   
   # Recommended - add comprehensive docstring
   def retrieve_docs(query: str) -> List[Document]:
       \"\"\"
       Retrieve relevant documents based on search query.
       
       Args:
           query (str): The search query string
           
       Returns:
           List[Document]: List of matching documents
           
       Raises:
           ValueError: If query is empty or invalid
       \"\"\"
   \`\`\`

2. **Variable Naming Issues**:
   - \`llm_model\` → \`language_model\` or \`llm_client\`
   - \`documents\` → \`retrieved_documents\`
   - \`context\` → \`formatted_context\`

### Documentation Score: 65/100
**Improvement Potential**: +35 points with proper documentation

Would you like me to help you write documentation for specific functions?`;
    }
    
    // Default comprehensive response
    return `I'm here to help you analyze your code using the LangGraph multi-agent system! Based on your uploaded files, I can provide insights from:

## 🤖 Available Analysis Agents:

**🔒 Security Agent** - Finds vulnerabilities like:
- Hardcoded credentials and secrets
- Input validation issues  
- Authentication/authorization flaws
- SQL injection risks

**⚡ Performance Agent** - Identifies bottlenecks:
- Inefficient string operations
- Unnecessary object creation
- I/O performance issues
- Memory usage problems

**📊 Complexity Agent** - Analyzes code structure:
- Cyclomatic complexity issues
- Long functions needing refactoring
- Deep nesting problems
- Parameter count issues

**📚 Documentation Agent** - Reviews documentation:
- Missing function docstrings
- Unclear variable names
- Code comment quality
- API documentation gaps

## 💡 What I can help you with:
- Explain specific functions or code blocks
- Provide refactoring suggestions
- Security vulnerability details
- Performance optimization tips
- Code quality improvements

Feel free to ask about any specific aspect of your code, paste code snippets for review, or ask for general development advice!`;
  };

  const handleSendMessage = async (content?: string) => {
    const messageContent = content || inputValue.trim();
    if (!messageContent) return;

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
      let assistantContent: string;

      if (sessionId && sessionId !== 'demo-session') {
        // Try to use real API
        console.log('[Chat] Sending message to backend...');
        const response = await apiClient.sendChatMessage(sessionId, messageContent);
        assistantContent = response.response.content;
        
        if (response.response.follow_up_suggestions.length > 0) {
          toast({
            title: "Follow-up suggestions available",
            description: "Check the AI's response for related questions you can ask.",
          });
        }
      } else {
        // Use enhanced demo responses
        console.log('[Chat] Using demo mode response');
        assistantContent = getEnhancedResponse(messageContent);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: assistantContent,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Chat error:', error);
      
      // Fallback to enhanced demo response on error
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: getEnhancedResponse(messageContent),
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      toast({
        title: "Using Demo Mode",
        description: "Connected to demo responses due to backend error.",
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
    // Enhanced code block detection and formatting
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
        // This is regular text - handle markdown-style formatting
        return (
          <div key={index} className="whitespace-pre-wrap">
            {part.split('\n').map((line, lineIndex) => {
              // Handle headers
              if (line.startsWith('###')) {
                return <h4 key={lineIndex} className="text-md font-semibold mt-4 mb-2 text-primary">{line.replace('###', '').trim()}</h4>;
              }
              if (line.startsWith('##')) {
                return <h3 key={lineIndex} className="text-lg font-semibold mt-4 mb-2 text-primary">{line.replace('##', '').trim()}</h3>;
              }
              if (line.startsWith('#')) {
                return <h2 key={lineIndex} className="text-xl font-bold mt-4 mb-2 text-primary">{line.replace('#', '').trim()}</h2>;
              }
              
              // Handle bullet points
              if (line.trim().startsWith('- **') || line.trim().startsWith('* **')) {
                const content = line.replace(/^[-*]\s*/, '');
                return <li key={lineIndex} className="ml-4 mb-1 list-disc">{content}</li>;
              }
              if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                return <li key={lineIndex} className="ml-4 mb-1 list-disc">{line.replace(/^[-*]\s*/, '')}</li>;
              }
              
              // Handle numbered lists
              if (/^\d+\./.test(line.trim())) {
                return <li key={lineIndex} className="ml-4 mb-1 list-decimal">{line.replace(/^\d+\.\s*/, '')}</li>;
              }
              
              // Handle bold text
              const boldFormatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
              
              return (
                <span key={lineIndex} dangerouslySetInnerHTML={{ __html: boldFormatted }}>
                </span>
              );
            })}
          </div>
        );
      }
    });
  };

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
                <p className="text-muted-foreground">Ask questions about your LangGraph analysis results</p>
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
                      <span className="text-sm text-muted-foreground">AI is analyzing your question...</span>
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
                      disabled={isLoading}
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
                    placeholder="Ask me anything about your LangGraph analysis results..."
                    disabled={isLoading || isInitializing}
                    className="pr-12 min-h-[3rem] resize-none"
                  />
                </div>
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isLoading || isInitializing}
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
                Press Enter to send • Shift+Enter for new line {sessionId === 'demo-session' ? '• Demo Mode Active' : ''}
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Chat;