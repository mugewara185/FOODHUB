import React, { useEffect } from 'react';
import { SectionWrapper, PageHeader } from '@features/ui/components';
import { useLogger, logComponent } from '@/core/dev/logger';
import NotificationsContainer from '@features/profile/components/Notifications';

const Notifications: React.FC = () => {
  const { info } = useLogger();

  useEffect(() => {
    logComponent.mount('Notifications');
    info('PAGE', 'Notifications page accessed', { timestamp: new Date().toISOString() }, 'Notifications');

    return () => {
      logComponent.unmount('Notifications');
    };
  }, []);

  return (
    <SectionWrapper>
      <PageHeader title="Notifications" />
      <NotificationsContainer />
    </SectionWrapper>
  );
};

export default Notifications;
