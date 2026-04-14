import React, { useMemo, useEffect } from 'react';
import { DevVersionRenderer } from '../../core/dev/renderer/DevVersionRenderer';
import { useLogger } from '../../core/dev/logger';

/**
 * Profile Page with Dev Version Renderer
 * 
 * This component uses the core/dev framework to allow dynamic switching between
 * multiple profile page implementations (Profile_V, ProfileV1, etc.)
 * 
 * Features:
 * - Hot swap different page versions without reloading
 * - Version state persists in localStorage
 * - Only visible to dev@ user with developer menu
 * - ErrorBoundary wraps each version for safety
 * - Integrated with logger system for tracking profile views
 * 
 * How to use:
 * 1. Login with dev@ account
 * 2. Click the developer icon (⚙️) in the toolbar
 * 3. Select different Profile versions to compare them
 * 4. Changes persist in localStorage
 */

const ProfileIndex: React.FC = () => {
  const { info } = useLogger();

  // Log page load once on mount
  useEffect(() => {
    info('PAGE', 'Profile versions being loaded', { route: '/profile' }, 'ProfileIndex');
  }, []);

  // Use Vite's import.meta.glob to dynamically load all versions from /V folder
  const versionImports = useMemo(
    () =>
      import.meta.glob<{ default: React.ComponentType }>(
        './V/*.tsx',
        { eager: false }
      ),
    []
  );

  return (
    <DevVersionRenderer
      pageKey="Profile"
      defaultVersion="Profile_V"
      imports={versionImports}
    />
  );
};

export default ProfileIndex;