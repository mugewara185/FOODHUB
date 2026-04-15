import React from 'react';
import { DevVersionRenderer } from '../../core/dev/renderer/DevVersionRenderer';

// Vite handles dynamic glob imports from the versions directory
const versions = import.meta.glob('./versions/*.tsx');

const RestaurantDetailIndex: React.FC = () => {
  return (
    <DevVersionRenderer 
      pageKey="RestaurantDetails" 
      defaultVersion="RestaurantDetail_V" 
      imports={versions}
    />
  );
};

export default RestaurantDetailIndex;