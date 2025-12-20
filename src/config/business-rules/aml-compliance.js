/**
 * AML (Anti-Money Laundering) Compliance Business Rules Configuration
 */
module.exports = {
  transactionMonitoring: {
    thresholds: {
      cash: {
        single: 1000000,    // ₹10L single cash transaction
        daily: 2500000,     // ₹25L daily cash transactions
        monthly: 10000000   // ₹1Cr monthly cash transactions
      },
      
      wire: {
        domestic: 5000000,  // ₹50L domestic wire
        international: 700000, // $10K equivalent international
        daily: 10000000,    // ₹1Cr daily wires
        monthly: 50000000   // ₹5Cr monthly wires
      },
      
      structured: {
        pattern: 0.9,       // 90% of reporting threshold
        frequency: 3,       // 3 transactions in pattern
        timeWindow: 86400   // 24 hours
      }
    },
    
    suspiciousPatterns: {
      rapidSuccession: {
        count: 5,
        timeWindow: 3600,   // 1 hour
        amountVariation: 0.1 // 10% variation
      },
      
      roundNumbers: {
        enabled: true,
        threshold: 100000,  // Amounts ending in 00000
        frequency: 3        // 3 or more in a day
      },
      
      unusualTiming: {
        afterHours: true,
        weekends: true,
        holidays: true
      },
      
      geographicRisk: {
        highRiskCountries: ['AF', 'IR', 'KP', 'MM', 'SY'],
        crossBorderThreshold: 700000 // $10K equivalent
      }
    }
  },
  
  customerRiskScoring: {
    riskFactors: {
      geography: {
        weight: 0.25,
        highRisk: ['AF', 'BD', 'IR', 'KP', 'LK', 'MM', 'PK', 'SY'],
        mediumRisk: ['CN', 'RU', 'TR', 'UA'],
        lowRisk: ['US', 'GB', 'DE', 'FR', 'JP', 'AU', 'CA']
      },
      
      occupation: {
        weight: 0.20,
        highRisk: ['politician', 'arms_dealer', 'casino_owner', 'money_changer'],
        mediumRisk: ['real_estate', 'jewelry', 'art_dealer', 'lawyer'],
        lowRisk: ['government', 'corporate', 'professional', 'retired']
      },
      
      transactionBehavior: {
        weight: 0.30,
        factors: ['volume', 'frequency', 'timing', 'counterparties']
      },
      
      relationship: {
        weight: 0.25,
        factors: ['accountAge', 'productUsage', 'referralSource']
      }
    },
    
    riskCategories: {
      low: { score: [0, 30], monitoring: 'standard' },
      medium: { score: [31, 60], monitoring: 'enhanced' },
      high: { score: [61, 80], monitoring: 'intensive' },
      prohibited: { score: [81, 100], monitoring: 'blocked' }
    }
  },
  
  sanctionsScreening: {
    lists: {
      ofac: {
        enabled: true,
        updateFrequency: 86400, // Daily
        matchThreshold: 0.85
      },
      
      un: {
        enabled: true,
        updateFrequency: 86400,
        matchThreshold: 0.85
      },
      
      eu: {
        enabled: true,
        updateFrequency: 86400,
        matchThreshold: 0.85
      },
      
      local: {
        enabled: true,
        updateFrequency: 3600, // Hourly
        matchThreshold: 0.90
      }
    },
    
    matchingCriteria: {
      exactMatch: true,
      fuzzyMatch: true,
      phoneticMatch: true,
      aliasMatch: true,
      
      fields: ['name', 'address', 'dateOfBirth', 'passport', 'nationalId']
    }
  },
  
  reporting: {
    str: { // Suspicious Transaction Report
      threshold: 1000000,
      timeLimit: 172800, // 48 hours
      
      triggers: [
        'threshold_breach',
        'pattern_detection',
        'sanctions_match',
        'manual_flag',
        'system_alert'
      ],
      
      requiredFields: [
        'transactionDetails',
        'customerInformation',
        'suspiciousActivity',
        'supportingDocuments'
      ]
    },
    
    ctr: { // Cash Transaction Report
      threshold: 1000000,
      timeLimit: 86400, // 24 hours
      
      exemptions: [
        'government_entities',
        'listed_companies',
        'regulated_entities'
      ]
    },
    
    ccr: { // Cross-border Currency Report
      threshold: 700000, // $10K equivalent
      timeLimit: 172800, // 48 hours
      
      requiredInformation: [
        'source_of_funds',
        'purpose_of_transaction',
        'beneficiary_details',
        'correspondent_bank'
      ]
    }
  },
  
  compliance: {
    kycRefresh: {
      low: 36,      // 36 months for low risk
      medium: 24,   // 24 months for medium risk
      high: 12,     // 12 months for high risk
      prohibited: 0 // Immediate for prohibited
    },
    
    transactionLimits: {
      unverified: 50000,    // ₹50K for unverified customers
      basic: 200000,        // ₹2L for basic KYC
      full: 1000000,        // ₹10L for full KYC
      premium: 10000000     // ₹1Cr for premium customers
    },
    
    alerting: {
      realTime: ['sanctions_match', 'threshold_breach'],
      batch: ['pattern_detection', 'risk_scoring'],
      
      escalation: {
        level1: 'compliance_officer',
        level2: 'senior_compliance_manager',
        level3: 'chief_compliance_officer'
      }
    },
    
    recordKeeping: {
      transactionRecords: 2555, // 7 years in days
      customerRecords: 1825,    // 5 years in days
      complianceReports: 2555,  // 7 years in days
      
      auditTrail: {
        enabled: true,
        immutable: true,
        encryption: true
      }
    }
  }
};