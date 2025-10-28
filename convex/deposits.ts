// convex/deposits.ts - UPDATED WITH REFERRAL SYSTEM
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const createDeposit = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    phone: v.string(),
    amount: v.number(),
    method: v.string(),
  },
  handler: async (ctx, args) => {
    // Create deposit record in the database
    const depositId = await ctx.db.insert("deposits", {
      userId: args.userId,
      name: args.name,
      phone: args.phone,
      amount: args.amount,
      method: args.method,
      status: "pending",
      adminApproved: false,
      createdAt: Date.now(),
    });

    return { 
      success: true, 
      message: "Deposit request submitted for admin approval",
      depositId 
    };
  },
});

// Admin approval function with referral processing
export const approveDeposit = mutation({
  args: {
    depositId: v.id("deposits"),
    adminId: v.id("users"),
  },
  handler: async (ctx, { depositId, adminId }) => {
    const deposit = await ctx.db.get(depositId);
    if (!deposit) {
      throw new Error("Deposit not found");
    }

    const user = await ctx.db.get(deposit.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Update deposit status
    await ctx.db.patch(depositId, {
      status: "completed",
      adminApproved: true,
      approvedBy: adminId,
      approvedAt: Date.now(),
      completedAt: Date.now(),
    });

    // Update user balance
    const newBalance = (user.balance || 0) + deposit.amount;
    await ctx.db.patch(deposit.userId, {
      balance: newBalance,
    });

    // Process referral commission if this is user's first deposit
    if (!user.hasMadeDeposit) {
      // Use scheduler to run referral commission (avoids circular dependencies)
      await ctx.scheduler.runAfter(0, api.referrals.processReferralCommission, {
        userId: deposit.userId,
        depositAmount: deposit.amount,
      });
    }

    // Record transaction
    await ctx.db.insert("transactions", {
      userId: deposit.userId,
      type: "deposit",
      amount: deposit.amount,
      description: `Deposit via ${deposit.method}`,
      relatedId: depositId,
      createdAt: Date.now(),
    });

    return { 
      success: true, 
      message: "Deposit approved and user balance updated",
      newBalance,
      userId: deposit.userId
    };
  },
});

// Get all pending deposits (for admin)
export const getPendingDeposits = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("deposits")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();
  },
});

// Get all deposits (for admin)
export const getAllDeposits = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("deposits")
      .order("desc")
      .collect();
  },
});

export const getUserDeposits = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("deposits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});