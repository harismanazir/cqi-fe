import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GitHubUpload } from './GitHubUpload';
import { 
  Upload, 
  File, 
  Folder, 
  X, 
  CheckCircle, 
  AlertCircle,
  FileCode,
  Archive,
  Loader2,
  Github,
  HardDrive
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient, UploadedFile } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface UploadedFileUI {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'completed' | 'error';
  progress: number;
  path?: string;
}

interface FileUploadProps {
  onAnalysisStart?: (jobId: string, metadata?: any) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onAnalysisStart }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<UploadedFileUI[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDir, setUploadDir] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('files');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      processFiles(selectedFiles);
    }
  }, []);

  const processFiles = async (fileList: File[]) => {
    try {
      console.log('[FileUpload] Starting file upload process...');
      
      const newFiles: UploadedFileUI[] = fileList.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        progress: 0
      }));

      setFiles(prev => [...prev, ...newFiles]);
      setIsUploading(true);

      // Simulate upload progress
      newFiles.forEach(file => {
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += Math.random() * 30;
          if (progress >= 100) {
            progress = 100;
            clearInterval(progressInterval);
          }
          
          setFiles(prev => {
            const updated = [...prev];
            const targetFile = updated.find(f => f.id === file.id);
            if (targetFile && progress < 100) {
              targetFile.progress = progress;
            }
            return updated;
          });
        }, 200);
      });

      // Upload files to backend using real API
      console.log('[FileUpload] Calling API uploadFiles...');
      const result = await apiClient.uploadFiles(fileList);
      console.log('[FileUpload] Upload response:', result);
      
      // Update files with backend response
      const completedFiles: UploadedFileUI[] = result.files.map((backendFile, index) => ({
        ...newFiles[index],
        status: 'completed',
        progress: 100,
        path: backendFile.path
      }));

      setFiles(prev => {
        const updated = [...prev];
        completedFiles.forEach((completedFile, index) => {
          const fileIndex = updated.findIndex(f => f.id === newFiles[index].id);
          if (fileIndex !== -1) {
            updated[fileIndex] = completedFile;
          }
        });
        return updated;
      });

      setUploadDir(result.upload_dir);
      setIsUploading(false);

      toast({
        title: "Upload Successful!",
        description: `${result.files.length} files uploaded successfully.`,
      });

    } catch (error) {
      console.error('Upload failed:', error);
      
      // Mark all new files as error
      setFiles(prev => prev.map(file => 
        newFiles.some(nf => nf.id === file.id) 
          ? { ...file, status: 'error', progress: 0 }
          : file
      ));
      
      setIsUploading(false);

      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive"
      });
    }
  };

  const handleAnalyze = async () => {
    try {
      console.log('[FileUpload] Starting analysis...');
      
      const filePaths = files
        .filter(file => file.status === 'completed' && file.path)
        .map(file => file.path!);

      if (filePaths.length === 0) {
        toast({
          title: "No Files Ready",
          description: "Please upload files before starting analysis.",
          variant: "destructive"
        });
        return;
      }

      setIsAnalyzing(true);
      
      // Generate job ID
      const jobId = crypto.randomUUID();
      console.log('[FileUpload] Generated job ID:', jobId);
      console.log('[FileUpload] File paths for analysis:', filePaths);
      
      // Start analysis using real API
      const result = await apiClient.startAnalysis(filePaths, jobId);
      console.log('[FileUpload] Analysis started:', result);
      
      toast({
        title: "Analysis Started!",
        description: "Redirecting to dashboard to monitor progress...",
      });

      // Navigate to dashboard immediately
      const params = new URLSearchParams({
        job_id: jobId,
        upload_dir: uploadDir
      });
      
      navigate(`/dashboard?${params.toString()}`);
      
      // Call parent callback if provided
      if (onAnalysisStart) {
        onAnalysisStart(jobId, {
          upload_dir: uploadDir,
          file_count: filePaths.length,
          source: 'file_upload'
        });
      }
      
    } catch (error) {
      console.error('Analysis failed to start:', error);
      setIsAnalyzing(false);
      
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to start analysis",
        variant: "destructive"
      });
    }
  };

  const handleGitHubAnalysisStart = (jobId: string, repoInfo: any) => {
    console.log('[FileUpload] GitHub analysis started:', jobId, repoInfo);
    
    // Navigate to dashboard for GitHub analysis
    const params = new URLSearchParams({
      job_id: jobId,
      github_repo: encodeURIComponent(repoInfo.full_name || ''),
      branch: repoInfo.branch || 'main'
    });
    
    navigate(`/dashboard?${params.toString()}`);
    
    // Call parent callback if provided
    if (onAnalysisStart) {
      onAnalysisStart(jobId, {
        ...repoInfo,
        source: 'github'
      });
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go'].includes(extension || '')) {
      return FileCode;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '')) {
      return Archive;
    }
    return File;
  };

  const hasCompletedFiles = files.some(file => file.status === 'completed');
  const allFilesCompleted = files.length > 0 && files.every(file => file.status === 'completed');

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="files" className="flex items-center gap-2">
            <HardDrive className="w-4 h-4" />
            Upload Files
          </TabsTrigger>
          <TabsTrigger value="github" className="flex items-center gap-2">
            <Github className="w-4 h-4" />
            GitHub Repository
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="files" className="space-y-6">
          {/* File Upload Area */}
          <Card 
            className={`transition-all duration-300 border-2 border-dashed cursor-pointer group hover:shadow-medium ${
              isDragOver 
                ? 'border-primary bg-primary/5 shadow-glow' 
                : 'border-border hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <CardContent className="p-12 text-center">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 transition-all duration-300 ${
                isDragOver ? 'bg-primary text-white animate-bounce' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'
              }`}>
                <Upload className="w-10 h-10" />
              </div>
              
              <h3 className="text-xl font-semibold mb-2">
                {isDragOver ? 'Drop files here' : 'Upload your code files'}
              </h3>
              
              <p className="text-muted-foreground mb-6">
                Drag and drop files, folders, or click to browse
              </p>
              
              <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground mb-6">
                <span className="px-3 py-1 bg-secondary rounded-full">.js</span>
                <span className="px-3 py-1 bg-secondary rounded-full">.ts</span>
                <span className="px-3 py-1 bg-secondary rounded-full">.py</span>
                <span className="px-3 py-1 bg-secondary rounded-full">.java</span>
                <span className="px-3 py-1 bg-secondary rounded-full">.zip</span>
                <span className="px-3 py-1 bg-secondary rounded-full">+more</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="hero" size="lg" className="group-hover:animate-glow" disabled={isUploading}>
                  <Folder className="w-5 h-5 mr-2" />
                  Choose Files
                </Button>
                <Button variant="outline" size="lg" disabled={isUploading}>
                  <Archive className="w-5 h-5 mr-2" />
                  Upload ZIP
                </Button>
              </div>
              
              <input
                id="file-input"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInput}
                accept=".js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.cs,.php,.rb,.go,.zip,.rar,.7z"
                disabled={isUploading}
              />
            </CardContent>
          </Card>

          {/* File List */}
          {files.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Uploaded Files ({files.length})</h4>
                  {allFilesCompleted && (
                    <Button 
                      onClick={handleAnalyze}
                      variant="hero"
                      size="sm"
                      disabled={isUploading || isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        'Analyze Code'
                      )}
                    </Button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {files.map((file) => {
                    const FileIcon = getFileIcon(file.name);
                    return (
                      <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileIcon className="w-5 h-5 text-primary" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <div className="flex items-center gap-2">
                              {file.status === 'completed' && (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                              {file.status === 'error' && (
                                <AlertCircle className="w-4 h-4 text-red-600" />
                              )}
                              {file.status === 'uploading' && (
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFile(file.id);
                                }}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Progress value={file.progress} className="flex-1 h-2" />
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </span>
                          </div>
                          
                          {file.status === 'error' && (
                            <p className="text-xs text-red-600 mt-1">Upload failed</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {hasCompletedFiles && !allFilesCompleted && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      Some files are still uploading. Please wait for all files to complete before analyzing.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="github" className="space-y-6">
          <GitHubUpload onAnalysisStart={handleGitHubAnalysisStart} />
        </TabsContent>
      </Tabs>

      {/* Quick Start Tips */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <h4 className="font-semibold mb-2 flex items-center">
            <CheckCircle className="w-5 h-5 text-primary mr-2" />
            Quick Start Tips
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Upload individual files or entire project folders</li>
            <li>• Analyze GitHub repositories directly with branch selection</li>
            <li>• ZIP files are automatically extracted and analyzed</li>
            <li>• Get instant security, performance, and quality insights</li>
            <li>• Ask questions about your code with AI-powered chat</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};