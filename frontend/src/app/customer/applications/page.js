/**
 * Applications Page
 * Main page for customer applications with form selection
 */

'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ApplicationTypeSelector from '@/components/forms/ApplicationTypeSelector';
import LoanApplicationForm from '@/components/forms/LoanApplicationForm';
import AccountApplicationForm from '@/components/forms/AccountApplicationForm';

export default function ApplicationsPage() {
  const [selectedType, setSelectedType] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setCurrentStep(1);
  };

  const handleBack = () => {
    if (currentStep === 1) {
      setSelectedType(null);
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderForm = () => {
    switch (selectedType) {
      case 'loan':
        return (
          <LoanApplicationForm
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onBack={handleBack}
          />
        );
      case 'account':
        return (
          <AccountApplicationForm
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      title="Applications"
      subtitle="Apply for loans, credit cards, or new accounts"
      role="customer"
    >
      <div className="max-w-4xl mx-auto">
        {!selectedType ? (
          <ApplicationTypeSelector onSelect={handleTypeSelect} />
        ) : (
          renderForm()
        )}
      </div>
    </DashboardLayout>
  );
}