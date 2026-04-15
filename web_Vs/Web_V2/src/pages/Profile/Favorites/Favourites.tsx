import React from 'react';
import { SectionWrapper, PageHeader } from '@features/ui/components';
import { useLogger, logComponent } from '@/core/dev/logger';
import { useEffect } from 'react';
import FavouritesContainer from '@features/profile/components/Favorites/Favourites';

const Favourites: React.FC = () => {
  const { info } = useLogger();

  useEffect(() => {
    logComponent.mount('Favourites');
    info('PAGE', 'Favorites page accessed', { timestamp: new Date().toISOString() }, 'Favourites');

    return () => {
      logComponent.unmount('Favourites');
    };
  }, []);

  return (
    <SectionWrapper>
      <PageHeader title="Favorites" />
      <FavouritesContainer />
    </SectionWrapper>
  );
};

export default Favourites;
