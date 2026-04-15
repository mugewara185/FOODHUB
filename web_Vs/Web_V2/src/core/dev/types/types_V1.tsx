export interface DevContextType {
  isDevMode: boolean;
  toggleDevMode: () => void;
  currentVersion: string;
  setCurrentVersion: (version: string) => void;
  versions: Version[];
  componentVersions: Record<string, Version[]>;
  devTools: DevTools;
  performance: PerformanceMetrics;
  logs: DevLog[];
  addLog: (log: Omit<DevLog, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  toggleDevTool: (toolId: string) => void;
}

export interface Version {
  id: string;
  name: string;
  version: string;
  description: string;
  features: string[];
  releaseDate: Date;
  isActive: boolean;
  components: string[];
}

export interface DevTools {
  componentPlayground: boolean;
  apiTester: boolean;
  performanceMonitor: boolean;
  stateInspector: boolean;
  logViewer: boolean;
  themeCustomizer: boolean;
  documentation: boolean;
}

export interface PerformanceMetrics {
  fps: number;
  memory: number;
  loadTime: number;
  apiLatency: number;
  renderTime: number;
  componentRenderCount: Record<string, number>;
}

export interface DevLog {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: Date;
  component?: string;
  data?: any;
}

export interface ComponentVersion {
  componentName: string;
  versions: {
    id: string;
    name: string;
    render: () => React.ReactNode;
    description: string;
  }[];
}