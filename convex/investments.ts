import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get user's investments
export const getUserInvestments = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, { userId }) => {
    if (!userId) return [];
    
    const investments = await ctx.db
      .query("investments")
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc")
      .collect();
    
    return investments;
  },
});

// Process daily returns for investments
export const processDailyReturns = mutation({
  handler: async (ctx): Promise<{ 
    success: boolean;
    dailyProfitsProcessed?: number;
    maturedInvestments?: number;
    totalPayout?: number;
    timestamp?: number;
    error?: string;
  }> => {
    const now = Date.now();
    const activeInvestments = await ctx.db
      .query("investments")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    let dailyProfitsProcessed = 0;
    let maturedInvestments = 0;
    let totalPayout = 0;

    for (const investment of activeInvestments) {
      // Calculate daily profit on the fly since it might not be set
      const totalProfit = investment.expectedReturn - investment.amount;
      const dailyProfit = Math.round(totalProfit / investment.durationDays);
      
      const hoursSinceLastPayout = investment.lastPayoutDate 
        ? (now - investment.lastPayoutDate) / (60 * 60 * 1000)
        : 24; // First payout after 24 hours

      // Process daily profit if 24 hours have passed
      if (hoursSinceLastPayout >= 24 && now < investment.maturityDate) {
        const user = await ctx.db.get(investment.userId);
        if (user) {
          // Add daily profit to user's balance
          const newBalance = user.balance + dailyProfit;
          const newTotalEarnings = (user.totalEarnings || 0) + dailyProfit;
          
          await ctx.db.patch(user._id, {
            balance: newBalance,
            totalEarnings: newTotalEarnings,
          });

          // Update investment tracking
          const newEarnedSoFar = (investment.earnedSoFar || 0) + dailyProfit;
          await ctx.db.patch(investment._id, {
            lastPayoutDate: now,
            earnedSoFar: newEarnedSoFar,
            dailyProfit: dailyProfit,
            totalProfit: totalProfit,
          });

          // Record the payout
          await ctx.db.insert("dailyPayouts", {
            investmentId: investment._id,
            userId: investment.userId,
            amount: dailyProfit,
            payoutDate: now,
            type: "daily_profit",
          });

          // Update localStorage if user is current user
          if (typeof window !== "undefined") {
            const storedUser = localStorage.getItem("qc_user");
            if (storedUser) {
              const userData = JSON.parse(storedUser);
              if (userData.id === investment.userId) {
                userData.balance = newBalance;
                userData.totalEarnings = newTotalEarnings;
                localStorage.setItem("qc_user", JSON.stringify(userData));
              }
            }
          }

          dailyProfitsProcessed++;
          totalPayout += dailyProfit;
        }
      }

      // Check if investment has matured (return principal + final profit)
      if (now >= investment.maturityDate && investment.status === "active") {
        const user = await ctx.db.get(investment.userId);
        if (user) {
          // Calculate remaining profit (if any daily profits were missed)
          const totalProfitEarned = investment.earnedSoFar || 0;
          const remainingProfit = totalProfit - totalProfitEarned;
          
          // Return principal + any remaining profit
          const finalPayout = investment.amount + remainingProfit;
          
          const newBalance = user.balance + finalPayout;
          const newTotalEarnings = (user.totalEarnings || 0) + remainingProfit;
          
          await ctx.db.patch(user._id, {
            balance: newBalance,
            totalEarnings: newTotalEarnings,
          });

          // Update investment as completed
          await ctx.db.patch(investment._id, {
            status: "completed",
            actualReturn: finalPayout,
            completionDate: now,
            earnedSoFar: totalProfit, // Mark all profit as earned
          });

          // Record the principal return
          await ctx.db.insert("dailyPayouts", {
            investmentId: investment._id,
            userId: investment.userId,
            amount: finalPayout,
            payoutDate: now,
            type: "principal_return",
          });

          // Update localStorage if user is current user
          if (typeof window !== "undefined") {
            const storedUser = localStorage.getItem("qc_user");
            if (storedUser) {
              const userData = JSON.parse(storedUser);
              if (userData.id === investment.userId) {
                userData.balance = newBalance;
                userData.totalEarnings = newTotalEarnings;
                localStorage.setItem("qc_user", JSON.stringify(userData));
              }
            }
          }

          maturedInvestments++;
          totalPayout += finalPayout;
        }
      }
    }

    return { 
      success: true,
      dailyProfitsProcessed,
      maturedInvestments,
      totalPayout,
      timestamp: now 
    };
  },
});

// Get active investments for a user
export const getActiveInvestments = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, { userId }) => {
    if (!userId) return [];
    
    return await ctx.db
      .query("investments")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("status"), "active")
        )
      )
      .collect();
  },
});

// Get investment payouts for a user
export const getInvestmentPayouts = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, { userId }) => {
    if (!userId) return [];
    
    return await ctx.db
      .query("dailyPayouts")
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc")
      .collect();
  },
});