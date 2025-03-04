// src/services/creditService.js
const { CreditAccount, User, Subscription, PaymentRecord } = require('../db/models');
const logger = require('../utils/logger');

class CreditService {
  // Get credit account for a user
  async getCreditAccount(userId) {
    try {
      const creditAccount = await CreditAccount.findOne({ where: { userId } });
      
      if (!creditAccount) {
        throw new Error(`Credit account not found for user ${userId}`);
      }
      
      return creditAccount;
    } catch (error) {
      logger.error('Error getting credit account:', error);
      throw error;
    }
  }
  
  // Check if user has enough credits
  async hasEnoughCredits(userId, requiredCredits) {
    try {
      const creditAccount = await this.getCreditAccount(userId);
      return creditAccount.creditsRemaining >= requiredCredits;
    } catch (error) {
      logger.error('Error checking credit balance:', error);
      throw error;
    }
  }
  
  // Deduct credits from user account
  async deductCredits(userId, credits, reason) {
    try {
      const creditAccount = await this.getCreditAccount(userId);
      
      if (creditAccount.creditsRemaining < credits) {
        throw new Error('Insufficient credits');
      }
      
      // Update credit account
      creditAccount.creditsRemaining -= credits;
      creditAccount.creditsUsed += credits;
      
      await creditAccount.save();
      
      logger.info('Credits deducted successfully', { 
        userId, 
        creditsDeducted: credits, 
        reason,
        remainingCredits: creditAccount.creditsRemaining 
      });
      
      return {
        success: true,
        remainingCredits: creditAccount.creditsRemaining
      };
    } catch (error) {
      logger.error('Error deducting credits:', error);
      throw error;
    }
  }
  
  // Add credits to user account
  async addCredits(userId, credits, reason, source = 'manual') {
    try {
      const creditAccount = await this.getCreditAccount(userId);
      
      // Update credit account
      creditAccount.creditsRemaining += credits;
      
      await creditAccount.save();
      
      logger.info('Credits added successfully', { 
        userId, 
        creditsAdded: credits, 
        reason,
        source,
        remainingCredits: creditAccount.creditsRemaining 
      });
      
      return {
        success: true,
        remainingCredits: creditAccount.creditsRemaining
      };
    } catch (error) {
      logger.error('Error adding credits:', error);
      throw error;
    }
  }
  
  // Renew monthly credits for a user
  async renewMonthlyCredits(userId) {
    try {
      const creditAccount = await this.getCreditAccount(userId);
      
      // Check if subscription is active
      const subscription = await Subscription.findOne({ 
        where: { 
          userId,
          status: 'active'
        } 
      });
      
      if (!subscription) {
        logger.warn('No active subscription found for monthly renewal', { userId });
        return { success: false, reason: 'no_active_subscription' };
      }
      
      // Update credit account
      creditAccount.creditsRemaining = creditAccount.monthlyAllowance;
      creditAccount.lastRenewalDate = new Date();
      creditAccount.renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days later
      
      await creditAccount.save();
      
      logger.info('Monthly credits renewed successfully', { 
        userId, 
        creditsRenewed: creditAccount.monthlyAllowance,
        nextRenewalDate: creditAccount.renewalDate
      });
      
      return {
        success: true,
        creditsRenewed: creditAccount.monthlyAllowance,
        nextRenewalDate: creditAccount.renewalDate
      };
    } catch (error) {
      logger.error('Error renewing monthly credits:', error);
      throw error;
    }
  }
  
  // Process credit purchase
  async processCreditPurchase(userId, packageId, paymentDetails) {
    try {
      // Define credit packages
      const creditPackages = {
        'small': { credits: 5000, price: 9.99 },
        'medium': { credits: 15000, price: 24.99 },
        'large': { credits: 50000, price: 69.99 },
        'enterprise': { credits: 200000, price: 199.99 }
      };
      
      if (!creditPackages[packageId]) {
        throw new Error(`Invalid credit package: ${packageId}`);
      }
      
      const packageDetails = creditPackages[packageId];
      
      // Create payment record
      const paymentRecord = await PaymentRecord.create({
        userId,
        type: 'one_time',
        amount: packageDetails.price,
        currency: 'USD',
        status: 'completed',
        paymentMethod: paymentDetails.method,
        paymentId: paymentDetails.id,
        paddleTransactionId: paymentDetails.paddleTransactionId,
        metadata: {
          creditPackage: packageId,
          creditsAdded: packageDetails.credits
        }
      });
      
      // Add credits to user account
      await this.addCredits(
        userId, 
        packageDetails.credits, 
        'credit_purchase', 
        'payment'
      );
      
      logger.info('Credit purchase processed successfully', { 
        userId, 
        packageId,
        creditsAdded: packageDetails.credits,
        paymentRecordId: paymentRecord.id
      });
      
      return {
        success: true,
        paymentRecordId: paymentRecord.id,
        creditsAdded: packageDetails.credits
      };
    } catch (error) {
      logger.error('Error processing credit purchase:', error);
      throw error;
    }
  }
  
  // Update user's subscription plan
  async updateSubscriptionPlan(userId, planId) {
    try {
      // Define subscription plans
      const subscriptionPlans = {
        'basic': { monthlyCredits: 5000, planType: 'basic' },
        'pro': { monthlyCredits: 25000, planType: 'pro' },
        'enterprise': { monthlyCredits: 100000, planType: 'enterprise' }
      };
      
      if (!subscriptionPlans[planId]) {
        throw new Error(`Invalid subscription plan: ${planId}`);
      }
      
      const planDetails = subscriptionPlans[planId];
      
      // Update credit account
      const creditAccount = await this.getCreditAccount(userId);
      creditAccount.planType = planDetails.planType;
      creditAccount.monthlyAllowance = planDetails.monthlyCredits;
      
      await creditAccount.save();
      
      logger.info('Subscription plan updated successfully', { 
        userId, 
        planId,
        monthlyAllowance: planDetails.monthlyCredits
      });
      
      return {
        success: true,
        planType: planDetails.planType,
        monthlyCredits: planDetails.monthlyCredits
      };
    } catch (error) {
      logger.error('Error updating subscription plan:', error);
      throw error;
    }
  }
  
  // Get credit usage history for a user
  async getCreditUsageHistory(userId, startDate, endDate) {
    try {
      // Get current date if endDate not provided
      endDate = endDate || new Date();
      
      // Get date 30 days ago if startDate not provided
      startDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Query credit usage from generation history
      const sequelize = CreditAccount.sequelize;
      const usage = await sequelize.query(`
        SELECT 
          DATE(createdAt) as date, 
          SUM(creditsUsed) as creditsUsed, 
          COUNT(*) as generations
        FROM ContentGenerations
        WHERE 
          userId = :userId AND 
          createdAt BETWEEN :startDate AND :endDate AND
          status = 'completed'
        GROUP BY DATE(createdAt)
        ORDER BY date ASC
      `, {
        replacements: { userId, startDate, endDate },
        type: sequelize.QueryTypes.SELECT
      });
      
      return usage;
    } catch (error) {
      logger.error('Error getting credit usage history:', error);
      throw error;
    }
  }
  
  // Estimate the cost of a generation
  estimateGenerationCost(promptData, contentType) {
    // Base cost calculation on word count
    const requestedWordCount = promptData.wordCount || 1000;
    
    // Different content types have different multipliers
    const typeMultipliers = {
      'blog': 1,
      'product': 0.8,
      'social': 0.5,
      'email': 0.7,
      'custom': 1.2
    };
    
    const multiplier = typeMultipliers[contentType] || 1;
    
    // Different AI models have different costs
    const modelMultipliers = {
      'gpt-4': 1.5,
      'gpt-3.5-turbo': 1,
      'default': 1
    };
    
    const modelMultiplier = modelMultipliers[promptData.model] || modelMultipliers.default;
    
    // SEO optimization adds cost
    const seoMultiplier = promptData.seoOptimize ? 1.2 : 1;
    
    // Calculate estimated cost
    let estimatedCost = Math.ceil(requestedWordCount * multiplier * modelMultiplier * seoMultiplier);
    
    // Ensure minimum cost
    estimatedCost = Math.max(estimatedCost, 100);
    
    return estimatedCost;
  }
}

// Export a singleton instance and the estimate function separately
const creditService = new CreditService();

module.exports = {
  creditService,
  estimateGenerationCost: creditService.estimateGenerationCost.bind(creditService)
};
