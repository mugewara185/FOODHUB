import React from 'react';
import { PageHeader, SectionWrapper } from '@features/ui/components';
import { ForgotPasswordForm } from '@features/auth/components';

const ForgotPassword: React.FC = () => {
  return (
    <SectionWrapper>
      <PageHeader
        title="Forgot Password"
        subtitle="Enter your email to receive recovery instructions"
        center
      />
      <ForgotPasswordForm />
    </SectionWrapper>
  );
};

export default ForgotPassword;