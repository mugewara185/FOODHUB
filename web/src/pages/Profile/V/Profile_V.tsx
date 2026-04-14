import React, { useEffect } from 'react';
import { SectionWrapper } from '@features/ui/components';
import { useLogger, logComponent } from '@/core/dev/logger';
import { ProfileContainer } from '@features/profile/components';

/**
 * Profile Page - Version 1 (Default)
 * 
 * Main profile page component using the ProfileContainer feature.
 * This is the default profile view with all user information and options.
 */

const Profile_V: React.FC = () => {
  const { info } = useLogger();

  useEffect(() => {
    logComponent.mount('Profile_V');
    info('PAGE_VERSION', 'Profile_V version loaded', { version: 'V', timestamp: new Date().toISOString() }, 'Profile_V');

    return () => {
      logComponent.unmount('Profile_V');
    };
  }, []);

  return (
    <SectionWrapper>
      <ProfileContainer />
    </SectionWrapper>
  );
};

export default Profile_V;