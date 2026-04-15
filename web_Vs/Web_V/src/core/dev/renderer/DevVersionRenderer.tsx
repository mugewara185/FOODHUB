import React, { useEffect, useMemo, Suspense } from 'react';
import { useDevContext } from '../contexts/DevContext';
import { DevErrorBoundary } from './DevErrorBoundary';
import { CircularProgress, Box } from '@mui/material';

interface DevVersionRendererProps {
  pageKey: string;
  defaultVersion: string;
  // A record matching Vite's import.meta.glob e.g. Record<'./versions/RestaurantDetail_V.tsx', () => Promise<{ default: React.ComponentType }>>
  imports: Record<string, () => Promise<any>>;
  [key: string]: any; // Catch-all for pass-through props to the rendered component
}

export const DevVersionRenderer: React.FC<DevVersionRendererProps> = ({
  pageKey,
  defaultVersion,
  imports,
  ...props
}) => {
  const { registerVersions, setVersion, selectedVersions } = useDevContext();
  
  // Extract strictly the basenames from the glob imports (e.g. "RestaurantDetail_V" from "./versions/RestaurantDetail_V.tsx")
  const availableVersionsMap = useMemo(() => {
    const map: Record<string, () => Promise<any>> = {};
    Object.keys(imports).forEach((path) => {
      // Basic extraction of the file name without extension
      const filenameMatch = path.match(/([^\/]+)\.(tsx|ts)$/);
      if (filenameMatch) {
         map[filenameMatch[1]] = imports[path];
      }
    });
    return map;
  }, [imports]);

  const availableVersionNames = useMemo(() => Object.keys(availableVersionsMap), [availableVersionsMap]);

  // Sync available versions to context
  useEffect(() => {
    registerVersions(pageKey, availableVersionNames);
  }, [pageKey, availableVersionNames, registerVersions]);

  // Determine active component to load
  const activeVersion = selectedVersions[pageKey] || defaultVersion;
  
  const Component = useMemo(() => {
    const loaderFn = availableVersionsMap[activeVersion];
    if (!loaderFn) {
      // Fallback loader if dev selected a deleted file
      return React.lazy(() => Promise.resolve({
         default: () => <div>Component Version "{activeVersion}" Not Found in /versions/ directory.</div>
      }));
    }
    return React.lazy(loaderFn);
  }, [activeVersion, availableVersionsMap]);

  return (
    <DevErrorBoundary 
      fallbackVersionName={activeVersion}
      onReset={() => setVersion(pageKey, defaultVersion)}
    >
       <Suspense fallback={
         <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, minHeight: '50vh', alignItems: 'center' }}>
            <CircularProgress />
         </Box>
       }>
           <Component {...props} />
       </Suspense>
    </DevErrorBoundary>
  );
};
