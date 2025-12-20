/**
 * Account Opening Business Rules Configuration
 */
module.exports = {
  eligibility: {
    minimumAge: 18,
    maximumAge: 100,
    
    requiredDocuments: {
      identity: ['aadhaar', 'pan', 'passport', 'drivingLicense'],
      address: ['aadhaar', 'passport', 'utilityBill', 'bankStatement'],
      income: ['salarySlip', 'itr', 'bankStatement']
    },
    
    minimumDocuments: {
      identity: 1,
      address: 1,
      income: 1
    },
    
    blacklistedCountries: ['AF', 'IR', 'KP', 'SY'], // ISO country codes
    
    minimumIncomeByAccountType: {
      savings: 0,
      current: 100000,
      premium: 500000,
      corporate: 1000000
    }
  },
  
  validation: {
    panPattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    aadhaarPattern: /^[0-9]{12}$/,
    phonePattern: /^[6-9]\d{9}$/,
    emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    
    addressValidation: {
      maxLength: 200,
      requiredFields: ['street', 'city', 'state', 'pincode']
    }
  },
  
  limits: {
    dailyTransactionLimit: {
      savings: 100000,
      current: 500000,
      premium: 1000000,
      corporate: 10000000
    },
    
    monthlyTransactionLimit: {
      savings: 1000000,
      current: 5000000,
      premium: 10000000,
      corporate: 100000000
    }
  },
  
  fees: {
    accountOpeningFee: {
      savings: 0,
      current: 500,
      premium: 1000,
      corporate: 5000
    },
    
    minimumBalance: {
      savings: 1000,
      current: 10000,
      premium: 25000,
      corporate: 100000
    },
    
    maintenanceFee: {
      savings: 0,
      current: 200,
      premium: 500,
      corporate: 2000
    }
  },
  
  processing: {
    autoApprovalThreshold: 500000, // Auto-approve if income > threshold
    manualReviewRequired: {
      highRiskCountries: true,
      politicallyExposedPersons: true,
      adverseMediaMentions: true,
      incomeSourceUnclear: true
    },
    
    timeouts: {
      documentVerification: 300000, // 5 minutes
      identityValidation: 180000,   // 3 minutes
      creditCheck: 120000,          // 2 minutes
      accountCreation: 60000        // 1 minute
    }
  }
};