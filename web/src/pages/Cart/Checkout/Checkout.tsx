import React from 'react';
import { SectionWrapper, PageHeader } from '@features/ui/components';
import CheckoutContainer from '@features/cart/components/Checkout/Checkout';

const Checkout: React.FC = () => {
  return (
    <SectionWrapper>
      <CheckoutContainer />
    </SectionWrapper>
  );
};

export default Checkout;
