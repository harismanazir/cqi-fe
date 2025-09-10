import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sidebar } from '@/components/Sidebar';
import { 
  Shield, 
  Zap, 
  BarChart3, 
  FileSearch,
  AlertTriangle,
  Clock,
  FileCode
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient, AnalysisResult, AnalysisStatus, Issue } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';

const Dashboard = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState('');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get job ID from URL params
  const jobId = searchParams.get('job_id');
  const uploadDir = searchParams.get('upload_dir');

  // Monitor analysis job if job ID is provided
  useEffect(() => {
    if (!jobId) return;

    let ws: WebSocket | null = null;
    let statusCheckInterval: NodeJS.Timeout | null = null;

    const startMonitoring = async () => {
      try {
        // Check initial job status
        const status = await apiClient.getAnalysisStatus(jobId);
        updateAnalysisState(status);

        // Set up WebSocket for real-time updates
        ws = apiClient.createProgressWebSocket(
          jobId,
          (data) => {
            if (data.type === 'progress') {
              setAnalysisProgress(data.progress);
              setAnalysisMessage(data.message);
              setIsAnalyzing(data.progress < 100);
            }
          },
          (error) => {
            console.error('WebSocket error:', error);
            // Fallback to polling if WebSocket fails
            startStatusPolling();
          }
        );

        // Backup status polling in case WebSocket doesn't work
        if (status.status === 'processing') {
          startStatusPolling();
        }

      } catch (error) {
        console.error('Failed to start monitoring:', error);
        toast({
          title: "Monitoring Error",
          description: "Failed to connect to analysis status. Please refresh the page.",
          variant: "destructive"
        });
      }
    };

    const startStatusPolling = () => {
      statusCheckInterval = setInterval(async () => {
        try {
          const status = await apiClient.getAnalysisStatus(jobId);
          updateAnalysisState(status);

          if (status.status === 'completed' || status.status === 'failed') {
            if (statusCheckInterval) clearInterval(statusCheckInterval);
            if (ws) ws.close();

            if (status.status === 'completed') {
              await loadAnalysisResults();
            }
          }
        } catch (error) {
          console.error('Status polling error:', error);
        }
      }, 2000);
    };

    const updateAnalysisState = (status: AnalysisStatus) => {
      setAnalysisProgress(status.progress);
      setAnalysisMessage(status.message);
      setIsAnalyzing(status.status === 'processing');

      if (status.status === 'failed') {
        toast({
          title: "Analysis Failed",
          description: status.message,
          variant: "destructive"
        });
      }
    };

    const loadAnalysisResults = async () => {
      try {
        const results = await apiClient.getAnalysisResults(jobId);
        setAnalysisResults(results);
        
        toast({
          title: "Analysis Complete!",
          description: `Found ${results.summary.total_issues} issues across ${results.summary.total_files} files.`,
        });
      } catch (error) {
        console.error('Failed to load results:', error);
        toast({
          title: "Results Error",
          description: "Analysis completed but failed to load results.",
          variant: "destructive"
        });
      }
    };

    startMonitoring();

    // Cleanup
    return () => {
      if (ws) ws.close();
      if (statusCheckInterval) clearInterval(statusCheckInterval);
    };
  }, [jobId, toast]);

  // Prepare language distribution data from files
  const languageData = analysisResults ? 
    Object.entries(
      analysisResults.files.reduce((acc, file) => {
        const lang = file.language || 'unknown';
        acc[lang] = (acc[lang] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([lang, count]) => ({
      name: lang.charAt(0).toUpperCase() + lang.slice(1),
      value: count,
      color: getLanguageColor(lang)
    })) : [];

  // Extract top issues from all files
  const topIssues = analysisResults ? 
    analysisResults.files
      .flatMap(file => file.issues.map(issue => ({
        ...issue,
        file: file.file
      })))
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return (severityOrder[b.severity as keyof typeof severityOrder] || 0) - 
               (severityOrder[a.severity as keyof typeof severityOrder] || 0);
      })
      .slice(0, 10) : [];

  function getLanguageColor(language: string): string {
    const colors: { [key: string]: string } = {
      'javascript': '#F7DF1E',
      'python': '#3776AB',
      'typescript': '#3178C6',
      'java': '#ED8B00',
      'cpp': '#00599C',
      'csharp': '#239120',
      'go': '#00ADD8',
      'rust': '#000000',
      'php': '#777BB4',
      'ruby': '#CC342D',
      'unknown': '#6B7280'
    };
    return colors[language.toLowerCase()] || '#6B7280';
  }

  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityTextColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex w-full">
        <Sidebar />
        
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gradient">Code Analysis Results</h1>
            <p className="text-muted-foreground mt-1">Detailed analysis using LangGraph multi-agent workflow</p>
          </div>

          {/* Analysis Progress */}
          {isAnalyzing && (
            <Card className="mb-6 border-primary/20 shadow-glow animate-pulse-slow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5 animate-spin" />
                    Running LangGraph Analysis
                  </h3>
                  <span className="text-sm text-muted-foreground">{Math.round(analysisProgress)}%</span>
                </div>
                <Progress value={analysisProgress} className="mb-2" />
                <p className="text-sm text-muted-foreground">
                  {analysisMessage || "Multi-agent system analyzing your code for security, performance, complexity, and documentation issues..."}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Results Section - Only show if analysis is complete */}
          {analysisResults && (
            <>
              {/* 4 Cards for Issue Counts */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="hover:shadow-medium transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-lg bg-red-50">
                        <Shield className="w-6 h-6 text-red-600" />
                      </div>
                      <Badge variant="outline" className="text-red-600">
                        {analysisResults.summary.agent_breakdown.security || 0}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-sm text-muted-foreground">Security Issues</h3>
                    <div className="text-2xl font-bold text-red-600 mt-1">
                      {analysisResults.summary.agent_breakdown.security || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-medium transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-lg bg-orange-50">
                        <Zap className="w-6 h-6 text-orange-600" />
                      </div>
                      <Badge variant="outline" className="text-orange-600">
                        {analysisResults.summary.agent_breakdown.performance || 0}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-sm text-muted-foreground">Performance Issues</h3>
                    <div className="text-2xl font-bold text-orange-600 mt-1">
                      {analysisResults.summary.agent_breakdown.performance || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-medium transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-lg bg-blue-50">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                      </div>
                      <Badge variant="outline" className="text-blue-600">
                        {analysisResults.summary.agent_breakdown.complexity || 0}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-sm text-muted-foreground">Complexity Issues</h3>
                    <div className="text-2xl font-bold text-blue-600 mt-1">
                      {analysisResults.summary.agent_breakdown.complexity || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-medium transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-lg bg-green-50">
                        <FileSearch className="w-6 h-6 text-green-600" />
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        {analysisResults.summary.agent_breakdown.documentation || 0}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-sm text-muted-foreground">Documentation Issues</h3>
                    <div className="text-2xl font-bold text-green-600 mt-1">
                      {analysisResults.summary.agent_breakdown.documentation || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Language Distribution and Top Issues */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Language Distribution Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileCode className="w-5 h-5" />
                      Files by Language
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={languageData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {languageData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Top 10 Issues List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-warning" />
                      Top 10 Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="max-h-72 overflow-y-auto space-y-3">
                      {topIssues.map((issue, index) => (
                        <div key={index} className="p-3 rounded-lg border bg-muted/30">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`inline-block w-2 h-2 rounded-full ${getSeverityColor(issue.severity)}`}></span>
                              <span className="font-medium text-sm">{issue.title}</span>
                            </div>
                            <Badge variant="outline" className={`text-xs ${getSeverityTextColor(issue.severity)}`}>
                              {issue.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{issue.description}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{issue.file} (Line {issue.line})</span>
                            <span className="capitalize">{issue.agent}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Show message when no analysis results */}
          {!isAnalyzing && !analysisResults && (
            <Card className="p-12 text-center">
              <div className="space-y-4">
                <FileCode className="w-16 h-16 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-semibold">No Analysis Results</h3>
                <p className="text-muted-foreground">
                  Upload some files and start an analysis to see detailed results here.
                </p>
              </div>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;