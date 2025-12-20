/**
 * Loan Processing Business Rules Configuration
 */
module.exports = {
  eligibility: {
    minimumAge: 21,
    maximumAge: 65,
    minimumIncome: {
      personal: 300000,
      home: 500000,
      auto: 200000,
      business: 1000000
    },
    
    minimumCreditScore: {
      personal: 650,
      home: 700,
      auto: 600,
      business: 750
    },
    
    employmentTypes: {
      salaried: ['permanent', 'contract'],
      selfEmployed: ['business', 'professional', 'freelancer']
    },
    
    minimumEmploymentHistory: {
      salaried: 24, // months
      selfEmployed: 36 // months
    }
  },
  
  loanToValue: {
    home: {
      maximum: 0.80, // 80%
      premium: 0.90  // 90% for premium customers
    },
    auto: {
      new: 0.90,     // 90% for new vehicles
      used: 0.75     // 75% for used vehicles
    },
    personal: {
      secured: 0.85,
      unsecured: 1.0 // No collateral
    }
  },
  
  interestRates: {
    base: {
      home: 8.5,
      auto: 9.0,
      personal: 12.0,
      business: 10.5
    },
    
    adjustments: {
      creditScoreBonus: {
        750: -0.5,  // -0.5% for score >= 750
        800: -1.0   // -1.0% for score >= 800
      },
      
      relationshipBonus: {
        existing: -0.25,  // -0.25% for existing customers
        premium: -0.5     // -0.5% for premium customers
      },
      
      loanAmountPenalty: {
        highAmount: 0.25  // +0.25% for loans > 50L
      }
    }
  },
  
  limits: {
    maximumLoanAmount: {
      personal: 2000000,
      home: 50000000,
      auto: 5000000,
      business: 100000000
    },
    
    maximumTenure: {
      personal: 84,  // months
      home: 360,     // months
      auto: 84,      // months
      business: 120  // months
    },
    
    debtToIncomeRatio: {
      maximum: 0.50, // 50%
      conservative: 0.40 // 40% for conservative lending
    }
  },
  
  underwriting: {
    autoApprovalCriteria: {
      creditScore: 750,
      debtToIncomeRatio: 0.30,
      loanAmount: 1000000,
      existingCustomer: true
    },
    
    riskFactors: {
      creditScore: {
          weight: 0.35,
          thresholds: {
            excellent: 800,
            good: 750,
            fair: 650,
            poor: 600
          }
      },
      
      income: {
        weight: 0.25,
        stabilityFactors: ['employmentType', 'tenure', 'growth']
      },
      
      collateral: {
        weight: 0.20,
        types: ['property', 'vehicle', 'securities', 'fixedDeposit']
      },
      
      relationship: {
        weight: 0.20,
        factors: ['accountAge', 'transactionHistory', 'crossSelling']
      }
    },
    
    decisionMatrix: {
      approve: {
        minScore: 75,
        conditions: ['creditScore >= 700', 'dti <= 0.40']
      },
      
      conditionalApproval: {
        minScore: 60,
        conditions: ['additionalCollateral', 'guarantor', 'reducedAmount']
      },
      
      reject: {
        maxScore: 40,
        conditions: ['creditScore < 600', 'dti > 0.60', 'fraudAlert']
      }
    }
  },
  
  processing: {
    documentRequirements: {
      personal: ['identity', 'address', 'income', 'bankStatements'],
      home: ['identity', 'address', 'income', 'propertyDocuments', 'bankStatements'],
      auto: ['identity', 'address', 'income', 'vehicleDocuments'],
      business: ['identity', 'address', 'businessRegistration', 'financials', 'bankStatements']
    },
    
    verificationSteps: {
      documentAuthenticity: true,
      incomeVerification: true,
      employmentVerification: true,
      creditBureauCheck: true,
      collateralValuation: true,
      legalVerification: true
    },
    
    timeouts: {
      documentVerification: 600000,  // 10 minutes
      creditCheck: 300000,           // 5 minutes
      collateralValuation: 1800000,  // 30 minutes
      legalVerification: 3600000,    // 1 hour
      finalApproval: 300000          // 5 minutes
    },
    
    workflowAssignment: {
      autoAssignment: true,
      loadBalancing: true,
      specialization: {
        home: ['homeLoanOfficer'],
        business: ['businessLoanOfficer'],
        highValue: ['seniorOfficer'] // > 10L
      }
    }
  }
};