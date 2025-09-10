import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  File, 
  Folder, 
  X, 
  CheckCircle, 
  AlertCircle,
  FileCode,
  Archive
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

export const FileUpload: React.FC = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<UploadedFileUI[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDir, setUploadDir] = useState<string>('');
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

      // Upload files to backend
      const result = await apiClient.uploadFiles(fileList);
      
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
      
      // Mark all files as error
      setFiles(prev => prev.map(file => ({
        ...file,
        status: 'error',
        progress: 0
      })));
      
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
      const jobId = crypto.randomUUID();
      // Start analysis and navigate to dashboard with job ID
      const result = await apiClient.startAnalysis(filePaths,jobId);
      
      toast({
        title: "Analysis Started!",
        description: "Redirecting to dashboard to monitor progress...",
      });

      // Navigate to dashboard with job ID
      navigate(`/dashboard?job_id=${result.job_id}&upload_dir=${encodeURIComponent(uploadDir)}`);
      
    } catch (error) {
      console.error('Analysis failed to start:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to start analysis",
        variant: "destructive"
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

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Upload Area */}
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
            <Button variant="hero" size="lg" className="group-hover:animate-glow">
              <Folder className="w-5 h-5 mr-2" />
              Choose Files
            </Button>
            <Button variant="outline" size="lg">
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
          />
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Uploaded Files ({files.length})</h4>
              {hasCompletedFiles && (
                <Button 
                  onClick={handleAnalyze}
                  variant="hero"
                  size="sm"
                  disabled={isUploading}
                >
                  Analyze Code
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
                            <CheckCircle className="w-4 h-4 text-success" />
                          )}
                          {file.status === 'error' && (
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          )}
                          <button
                            onClick={() => removeFile(file.id)}
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
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Start Tips */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <h4 className="font-semibold mb-2 flex items-center">
            <CheckCircle className="w-5 h-5 text-primary mr-2" />
            Quick Start Tips
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Upload individual files or entire project folders</li>
            <li>• ZIP files are automatically extracted and analyzed</li>
            <li>• Get instant security, performance, and quality insights</li>
            <li>• Ask questions about your code with AI-powered chat</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};