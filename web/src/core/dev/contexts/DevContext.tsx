import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { logger } from '../logger/Logger';

interface DevContextType {
  // Map of pageKey -> array of available version names
  availableVersions: Record<string, string[]>;
  // Map of pageKey -> currently selected version name
  selectedVersions: Record<string, string>;
  registerVersions: (pageKey: string, versions: string[]) => void;
  unregisterVersions: (pageKey: string) => void;
  setVersion: (pageKey: string, version: string) => void;
}

const DevContext = createContext<DevContextType | undefined>(undefined);

const STORAGE_KEY = 'zom2_dev_versions';

export const DevProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [availableVersions, setAvailableVersions] = useState<Record<string, string[]>>({});

  // Initialize selected overrides from local storage
  const [selectedVersions, setSelectedVersions] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Sync back to local storage whenever a dev switches an active version override
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedVersions));
  }, [selectedVersions]);

  const registerVersions = (pageKey: string, versions: string[]) => {
    setAvailableVersions(prev => {
      // Avoid deep equality/unnecessary re-renders
      if (JSON.stringify(prev[pageKey]) === JSON.stringify(versions)) return prev;
      logger.debug('DEV_CONTEXT', `Registered versions for ${pageKey}`, { versions }, 'DevContext');
      return { ...prev, [pageKey]: versions };
    });
  };

  const unregisterVersions = (pageKey: string) => {
    setAvailableVersions(prev => {
      const next = { ...prev };
      delete next[pageKey];
      logger.debug('DEV_CONTEXT', `Unregistered versions for ${pageKey}`, undefined, 'DevContext');
      return next;
    });
  };

  const setVersion = (pageKey: string, version: string) => {
    setSelectedVersions(prev => {
      const next = { ...prev };
      // If setting back to "default", optionally we could just delete it to rely on the default prop
      // For explicit safety, we preserve it.
      next[pageKey] = version;
      logger.info('DEV_CONTEXT', `Version switched for ${pageKey}`, { pageKey, version, timestamp: new Date().toISOString() }, 'DevContext');
      return next;
    });
  };

  return (
    <DevContext.Provider value={{
      availableVersions,
      selectedVersions,
      registerVersions,
      unregisterVersions,
      setVersion,
    }}>
      {children}
    </DevContext.Provider>
  );
};

export const useDevContext = () => {
  const ctx = useContext(DevContext);
  if (!ctx) throw new Error('useDevContext must be used under DevProvider');
  return ctx;
};
