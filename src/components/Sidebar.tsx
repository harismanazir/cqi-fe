import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  FileSearch, 
  MessageSquare, 
  Settings, 
  Home,
  Code,
  History,
  HelpCircle,
  User,
  Upload
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Upload, label: 'Upload', path: '/' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: FileSearch, label: 'Code Search', path: '/search' },
    { icon: MessageSquare, label: 'AI Chat', path: '/chat/new' },
    { icon: History, label: 'History', path: '/history' },
  ];

  const recentScans = [
    { name: 'auth-service', score: 87, issues: 12 },
    { name: 'api-gateway', score: 94, issues: 3 },
    { name: 'user-dashboard', score: 76, issues: 28 },
  ];

  const quickStats = [
    { label: 'Total Files', value: '1,247' },
    { label: 'Last Scan', value: '2h ago' },
    { label: 'Success Rate', value: '94%' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-80 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Code className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-sidebar-foreground">Atlan Code</h2>
            <p className="text-xs text-sidebar-foreground/60">Intelligence Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => (
            <Button
              key={item.path}
              variant={isActive(item.path) ? "default" : "ghost"}
              className={`w-full justify-start transition-all duration-200 ${
                isActive(item.path) 
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-soft' 
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
              onClick={() => navigate(item.path)}
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.label}
            </Button>
          ))}
        </nav>

        {/* Quick Stats */}
        <div className="p-4">
          <Card className="bg-sidebar-accent/30 border-sidebar-border">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm text-sidebar-foreground mb-3">Quick Stats</h3>
              <div className="space-y-3">
                {quickStats.map((stat) => (
                  <div key={stat.label} className="flex justify-between items-center">
                    <span className="text-xs text-sidebar-foreground/70">{stat.label}</span>
                    <span className="text-sm font-medium text-sidebar-foreground">{stat.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Scans */}
        <div className="p-4">
          <h3 className="font-semibold text-sm text-sidebar-foreground mb-3">Recent Scans</h3>
          <div className="space-y-2">
            {recentScans.map((scan, index) => (
              <Card 
                key={index} 
                className="bg-sidebar-accent/20 border-sidebar-border hover:bg-sidebar-accent/40 transition-colors cursor-pointer"
                onClick={() => navigate(`/analysis/${scan.name}`)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-sidebar-foreground truncate">
                      {scan.name}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        scan.score >= 90 ? 'text-success border-success/30' :
                        scan.score >= 80 ? 'text-warning border-warning/30' :
                        'text-destructive border-destructive/30'
                      }`}
                    >
                      {scan.score}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-sidebar-foreground/60">{scan.issues} issues</span>
                    <span className="text-sidebar-foreground/60">2h ago</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          <HelpCircle className="w-4 h-4 mr-3" />
          Help & Support
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          <Settings className="w-4 h-4 mr-3" />
          Settings
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          <User className="w-4 h-4 mr-3" />
          Profile
        </Button>
      </div>
    </div>
  );
};