/**
 * API Client for Code Quality Insight Backend
 * Connects React frontend to FastAPI backend
 */

const API_BASE_URL = 'http://localhost:8000';

export interface UploadedFile {
  name: string;
  path: string;
  size: number;
  type: string;
}

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
  files_processed: number;
  total_files: number;
  start_time: string;
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
    code_examples: string[];
  };
  timestamp: string;
}

export interface ChatSession {
  success: boolean;
  session_id: string;
  message: string;
  codebase_info: {
    files: number;
    languages: string[];
    total_lines: number;
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
  async uploadFiles(files: File[]): Promise<{ files: UploadedFile[]; upload_dir: string }> {
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
   * Start analysis job
   */
  async startAnalysis(filePaths: string[], jobId?: string): Promise<{ job_id: string; status: string; message: string }> {
    const finalJobId =
    jobId ||
    (window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : 'job-' + Math.random().toString(36).substring(2, 15));
    
    const response = await fetch(`${this.baseURL}/api/analyze/${finalJobId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job_id: jobId || "",
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
   * Get analysis results
   */
  async getAnalysisResults(jobId: string): Promise<AnalysisResult> {
    const response = await fetch(`${this.baseURL}/api/results/${jobId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get results');
    }

    return response.json();
  }

  /**
   * Start chat session
   */
  async startChatSession(uploadDir?: string): Promise<ChatSession> {
    const payload: any = {};
    
    // Only include upload_dir if provided
    if (uploadDir) {
      payload.upload_dir = uploadDir;
    }

    const response = await fetch(`${this.baseURL}/api/chat/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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