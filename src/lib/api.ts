/**
 * API Client for Code Quality Insight Backend
 * Updated to match the exact backend API structure
 */

const API_BASE_URL = 'http://localhost:8000';

export interface UploadedFile {
  name: string;
  path: string;
  size: number;
  type: string;
}

export interface UploadResponse {
  success: boolean;
  files: UploadedFile[];
  upload_dir: string;
  total_files: number;
}

// Backend API Response Types (matching the actual backend structure)
export interface IssueModel {
  severity: string;
  title: string;
  agent: string;
  file: string;
  line: number;
  description: string;
  fix: string;
}

export interface AgentPerformance {
  agent: string;
  issues: number;
  time: number;
  confidence: number;
  status: string;
}

export interface BackendAnalysisResult {
  file: string;
  language: string;
  lines: number;
  total_issues: number;
  processing_time: number;
  tokens_used: number;
  api_calls: number;
  completed_agents: string[];
  
  // Severity breakdown
  critical_issues: number; 
  high_issues: number;
  medium_issues: number;
  low_issues: number;
  
  // Agent performance
  agent_performance: AgentPerformance[];
  agent_breakdown: Record<string, number>;
  
  // Detailed issues (top 20)
  detailed_issues: IssueModel[];
  
  // Additional metadata
  timestamp: string;
  job_id: string;
}

export interface BackendResultsResponse {
  success: boolean;
  job_id: string;
  results: BackendAnalysisResult[];
  total_files: number;
  completion_time: string;
}

// Frontend display types (transformed from backend data)
export interface AnalysisResult {
  job_id: string;
  summary: {
    total_files: number;
    total_issues: number;
    severity_breakdown: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    agent_breakdown: Record<string, number>;
    overall_score: number;
  };
  metrics: {
    security_score: number;
    performance_score: number;
    code_quality_score: number;
    documentation_score: number;
  };
  files: FileResult[];
  analysis_time: number;
  timestamp: string;
}

export interface FileResult {
  file: string;
  path: string;
  language: string;
  lines: number;
  issues: Issue[];
  issues_count: number;
}

export interface Issue {
  title: string;
  description: string;
  severity: string;
  agent: string;
  line: number;
  suggestion: string;
  file?: string;
}

export interface AnalysisStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  start_time: string;
  completion_time?: string;
}

export interface ChatResponse {
  success: boolean;
  response: {
    content: string;
    confidence: number;
    source: string;
    processing_time: number;
    follow_up_suggestions: string[];
    related_files: string[];
  };
  timestamp: string;
}

export interface ChatSession {
  success: boolean;
  session_id: string;
  message: string;
  codebase_info: {
    path: string;
    status: string;
  };
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Upload files to backend
   */
  async uploadFiles(files: File[]): Promise<UploadResponse> {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch(`${this.baseURL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
  }

  /**
   * Start analysis job - Updated to match backend exactly
   */
  async startAnalysis(filePaths: string[], jobId: string): Promise<{ success: boolean; job_id: string; results_count: number }> {
    const response = await fetch(`${this.baseURL}/api/analyze/${jobId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_paths: filePaths,
        detailed: true,
        rag: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Analysis failed to start');
    }

    return response.json();
  }

  /**
   * Get analysis status
   */
  async getAnalysisStatus(jobId: string): Promise<AnalysisStatus> {
    const response = await fetch(`${this.baseURL}/api/status/${jobId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get status');
    }

    return response.json();
  }

  /**
   * Get analysis results and transform to frontend format
   */
  async getAnalysisResults(jobId: string): Promise<AnalysisResult> {
    const response = await fetch(`${this.baseURL}/api/results/${jobId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get results');
    }

    const backendData: BackendResultsResponse = await response.json();
    
    // Transform backend data to frontend format
    return this.transformBackendResults(backendData);
  }

  
private transformBackendResults(backendData: BackendResultsResponse): AnalysisResult {
  const results = backendData.results;
  
  // Calculate totals
  const totalFiles = results.length;
  const totalIssues = results.reduce((sum, file) => sum + file.total_issues, 0);
  
  // FIXED: Separate critical from high issues
  const totalCriticalIssues = results.reduce((sum, file) => {
    // Count critical issues from detailed_issues
    const criticalCount = file.detailed_issues.filter(issue => 
      issue.severity.toLowerCase() === 'critical'
    ).length;
    return sum + criticalCount;
  }, 0);
  
  const totalHighIssues = results.reduce((sum, file) => sum + file.high_issues, 0);
  const totalMediumIssues = results.reduce((sum, file) => sum + file.medium_issues, 0);
  const totalLowIssues = results.reduce((sum, file) => sum + file.low_issues, 0);
  
  // FIXED: Calculate agent breakdown with correct mapping
  // const agentBreakdown: Record<string, number> = {};
  // results.forEach(file => {
  //   file.agent_performance.forEach(agent => {
  //     const agentKey = agent.agent.toLowerCase();
  //     if (!agentBreakdown[agentKey]) {
  //       agentBreakdown[agentKey] = 0;
  //     }
  //     agentBreakdown[agentKey] += agent.issues;
  //   });
  // });

  const agentBreakdown = results.length > 0 ? results[0].agent_breakdown : {};

  // Transform file results
  const files: FileResult[] = results.map(file => ({
    file: file.file,
    path: file.file,
    language: file.language,
    lines: file.lines,
    issues_count: file.total_issues,
    issues: file.detailed_issues.map(issue => ({
      title: issue.title,
      description: issue.description,
      severity: issue.severity,
      agent: issue.agent,
      line: issue.line,
      suggestion: issue.fix,
      file: issue.file
    }))
  }));

  // Calculate metrics (simplified scoring based on issues)
  const securityIssues = agentBreakdown.security || 0;
  const performanceIssues = agentBreakdown.performance || 0;
  const complexityIssues = agentBreakdown.complexity || 0;
  const documentationIssues = agentBreakdown.documentation || 0;

  return {
    job_id: backendData.job_id,
    summary: {
      total_files: totalFiles,
      total_issues: totalIssues,
      severity_breakdown: {
        critical: totalCriticalIssues,  // FIXED: Add critical separately
        high: totalHighIssues,
        medium: totalMediumIssues,
        low: totalLowIssues,
      },
      agent_breakdown: agentBreakdown,
      overall_score: Math.max(0, 100 - (totalIssues * 2)), // Simple scoring
    },
    metrics: {
      security_score: Math.max(0, 100 - (securityIssues * 5)),
      performance_score: Math.max(0, 100 - (performanceIssues * 4)),
      code_quality_score: Math.max(0, 100 - (complexityIssues * 3)),
      documentation_score: Math.max(0, 100 - (documentationIssues * 2)),
    },
    files,
    analysis_time: results.reduce((sum, file) => sum + file.processing_time, 0),
    timestamp: backendData.completion_time,
  };
}

  /**
   * Start chat session
   */
  async startChatSession(uploadDir?: string): Promise<ChatSession> {
    const response = await fetch(`${this.baseURL}/api/chat/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        upload_dir: uploadDir || '',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to start chat session');
    }

    return response.json();
  }

  /**
   * Send chat message
   */
  async sendChatMessage(sessionId: string, message: string): Promise<ChatResponse> {
    const response = await fetch(`${this.baseURL}/api/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        message: message,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to send message');
    }

    return response.json();
  }

  /**
   * Create WebSocket connection for real-time progress
   */
  createProgressWebSocket(jobId: string, onMessage: (data: any) => void, onError?: (error: Event) => void): WebSocket {
    const ws = new WebSocket(`ws://localhost:8000/api/progress/${jobId}`);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (onError) {
        onError(error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return ws;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types and client
export { ApiClient };