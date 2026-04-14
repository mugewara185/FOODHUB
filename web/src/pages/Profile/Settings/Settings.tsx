import React, { useEffect } from 'react';
import { SectionWrapper, PageHeader } from '@features/ui/components';
import { useLogger, logComponent } from '@/core/dev/logger';
import SettingsContainer from '@features/profile/components/Settings/Settings';

const Settings: React.FC = () => {
  const { info } = useLogger();

  useEffect(() => {
    logComponent.mount('Settings');
    info('PAGE', 'Settings page accessed', { timestamp: new Date().toISOString() }, 'Settings');

    return () => {
      logComponent.unmount('Settings');
    };
  }, []);

  return (
    <SectionWrapper>
      <PageHeader title="Settings" />
      <SettingsContainer />
    </SectionWrapper>
  );
};

export default Settings;
