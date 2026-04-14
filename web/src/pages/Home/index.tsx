import React, { useMemo } from 'react';
import { DevVersionRenderer } from '../../core/dev/renderer/DevVersionRenderer';

/**
 * Home Page with Dev Version Renderer
 * 
 * This component uses the core/dev framework to allow dynamic switching between
 * multiple home page implementations (Home_V, Home_V2, etc.)
 * 
 * Features:
 * - Hot swap different page versions without reloading
 * - Version state persists in localStorage
 * - Only visible to dev@ user with developer menu
 * - ErrorBoundary wraps each version for safety
 * 
 * How to use:
 * 1. Login with dev@ account
 * 2. Click the developer icon (⚙️) in the toolbar
 * 3. Select different Home versions to compare them
 * 4. Changes persist in localStorage
 */

const HomeIndex: React.FC = () => {
  // Use Vite's import.meta.glob to dynamically load all versions from /versions folder
  const versionImports = useMemo(
    () =>
      import.meta.glob<{ default: React.ComponentType }>(
        './versions/*.tsx',
        { eager: false }
      ),
    []
  );

  return (
    <DevVersionRenderer
      pageKey="Home"
      defaultVersion="Home_V"
      imports={versionImports}
    />
  );
};

export default HomeIndex;