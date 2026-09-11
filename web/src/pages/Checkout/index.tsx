import React from 'react';
import { SectionWrapper, PageHeader } from '@features/ui/components';
import CheckoutContainer from '@/pages/Checkout/Checkout';

const Checkout: React.FC = () => {
  return (
    <SectionWrapper>
      {/* <PageHeader title="Checkout" /> */}
      <CheckoutContainer />
    </SectionWrapper>
  );
};

export default Checkout;
