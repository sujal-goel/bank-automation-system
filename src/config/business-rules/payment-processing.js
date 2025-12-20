/**
 * Payment Processing Business Rules Configuration
 */
module.exports = {
  validation: {
    amount: {
      minimum: 1,
      maximum: {
        rtgs: 200000,      // ₹2L minimum for RTGS
        neft: 50000000,    // ₹5Cr maximum for NEFT
        imps: 500000,      // ₹5L maximum for IMPS
        upi: 100000,       // ₹1L maximum for UPI
        swift: 1000000000  // ₹100Cr maximum for SWIFT
      }
    },
    
    timing: {
      rtgs: {
        weekdays: { start: '09:00', end: '16:30' },
        saturday: { start: '09:00', end: '14:00' },
        sunday: false,
        holidays: false
      },
      
      neft: {
        weekdays: { start: '08:00', end: '19:00' },
        saturday: { start: '08:00', end: '13:00' },
        sunday: false,
        holidays: false
      },
      
      imps: {
        available: '24x7',
        maintenance: { start: '23:30', end: '00:30' }
      },
      
      upi: {
        available: '24x7',
        maintenance: { start: '01:00', end: '02:00' }
      },
      
      swift: {
        available: '24x5', // Monday to Friday
        cutoffTimes: {
          usd: '22:00',
          eur: '16:00',
          gbp: '17:00',
          jpy: '09:00'
        }
      }
    },
    
    beneficiary: {
      validation: {
        accountNumber: /^[0-9]{9,18}$/,
        ifscCode: /^[A-Z]{4}0[A-Z0-9]{6}$/,
        swiftCode: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/
      },
      
      verification: {
        nameMatch: true,
        accountValidation: true,
        blacklistCheck: true
      }
    }
  },
  
  routing: {
    domestic: {
      rtgs: {
        condition: 'amount >= 200000',
        priority: 1,
        cutoffTime: '16:30'
      },
      
      neft: {
        condition: 'amount < 200000 && amount >= 1',
        priority: 2,
        batchTimes: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']
      },
      
      imps: {
        condition: 'amount <= 500000 && urgent === true',
        priority: 3,
        realTime: true
      },
      
      upi: {
        condition: 'amount <= 100000 && paymentMethod === "upi"',
        priority: 4,
        realTime: true
      }
    },
    
    international: {
      swift: {
        condition: 'international === true',
        priority: 1,
        
        correspondentBanks: {
          USD: ['CHASUS33', 'CITIUS33', 'BOFAUS3N'],
          EUR: ['DEUTDEFF', 'BNPAFRPP', 'CRESCHZZ'],
          GBP: ['BARCGB22', 'HBUKGB4B', 'LOYDGB21'],
          JPY: ['BOTKJPJT', 'MHCBJPJT', 'SMTCJPJT']
        }
      }
    }
  },
  
  fees: {
    domestic: {
      rtgs: {
        upTo200K: 25,
        upTo500K: 25,
        upTo1000K: 25,
        above1000K: 50
      },
      
      neft: {
        upTo10K: 2.5,
        upTo100K: 5,
        upTo200K: 15,
        above200K: 25
      },
      
      imps: {
        upTo10K: 5,
        upTo100K: 5,
        upTo200K: 15,
        above200K: 25
      },
      
      upi: {
        upTo1K: 0,
        above1K: 0 // Free for now
      }
    },
    
    international: {
      swift: {
        charges: 1000,      // Flat ₹1000
        correspondentFee: 25, // $25 USD
        
        currencyConversion: {
          margin: 0.25,     // 0.25% margin
          minimum: 100      // Minimum ₹100
        }
      }
    }
  },
  
  limits: {
    perTransaction: {
      customer: {
        basic: 100000,     // ₹1L for basic customers
        premium: 1000000,  // ₹10L for premium customers
        corporate: 50000000 // ₹5Cr for corporate
      },
      
      channel: {
        netBanking: 1000000,
        mobileBanking: 500000,
        atmCard: 100000,
        debitCard: 200000
      }
    },
    
    daily: {
      customer: {
        basic: 500000,      // ₹5L daily for basic
        premium: 5000000,   // ₹50L daily for premium
        corporate: 100000000 // ₹10Cr daily for corporate
      },
      
      channel: {
        netBanking: 2000000,
        mobileBanking: 1000000,
        atmCard: 200000,
        debitCard: 500000
      }
    },
    
    monthly: {
      customer: {
        basic: 10000000,     // ₹1Cr monthly for basic
        premium: 50000000,   // ₹5Cr monthly for premium
        corporate: 1000000000 // ₹100Cr monthly for corporate
      }
    }
  },
  
  retry: {
    maxAttempts: 3,
    backoffStrategy: 'exponential',
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    
    retryableErrors: [
      'NETWORK_TIMEOUT',
      'SERVICE_UNAVAILABLE',
      'TEMPORARY_FAILURE',
      'RATE_LIMIT_EXCEEDED'
    ],
    
    nonRetryableErrors: [
      'INVALID_ACCOUNT',
      'INSUFFICIENT_FUNDS',
      'ACCOUNT_BLOCKED',
      'INVALID_BENEFICIARY'
    ]
  },
  
  fraud: {
    riskScoring: {
      factors: {
        amount: { weight: 0.3, threshold: 1000000 },
        frequency: { weight: 0.2, threshold: 10 },
        timing: { weight: 0.15, unusualHours: true },
        location: { weight: 0.15, newLocation: true },
        beneficiary: { weight: 0.2, newBeneficiary: true }
      },
      
      thresholds: {
        low: 30,
        medium: 60,
        high: 80
      },
      
      actions: {
        low: 'allow',
        medium: 'additional_auth',
        high: 'block_and_alert'
      }
    },
    
    velocityChecks: {
      enabled: true,
      
      rules: [
        {
          name: 'high_frequency',
          condition: 'count > 20 in 1 hour',
          action: 'block'
        },
        {
          name: 'high_amount',
          condition: 'sum > 5000000 in 1 day',
          action: 'additional_auth'
        },
        {
          name: 'new_beneficiary_high_amount',
          condition: 'amount > 100000 && beneficiary_age < 24 hours',
          action: 'manual_review'
        }
      ]
    }
  },
  
  compliance: {
    amlScreening: {
      enabled: true,
      threshold: 50000, // Screen payments > ₹50K
      
      checks: [
        'sanctions_list',
        'pep_list',
        'adverse_media',
        'high_risk_countries'
      ]
    },
    
    reporting: {
      ctr: {
        threshold: 1000000,
        enabled: true
      },
      
      str: {
        enabled: true,
        triggers: ['unusual_pattern', 'high_risk_score']
      }
    },
    
    recordKeeping: {
      retention: 2555, // 7 years
      fields: [
        'transaction_id',
        'amount',
        'currency',
        'sender_details',
        'beneficiary_details',
        'purpose',
        'timestamp',
        'channel',
        'status'
      ]
    }
  }
};