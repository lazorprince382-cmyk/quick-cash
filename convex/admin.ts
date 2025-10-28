import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getPendingDeposits = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("deposits")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
  },
});

export const getPendingWithdrawals = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("withdrawals")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
  },
});

export const getAllUsers = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const approveDeposit = mutation({
  args: { 
    depositId: v.id("deposits"),
    adminId: v.id("users")
  },
  handler: async (ctx, { depositId, adminId }) => {
    const deposit = await ctx.db.get(depositId);
    if (!deposit) {
      throw new Error("Deposit not found");
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
    const user = await ctx.db.get(deposit.userId);
    if (user) {
      await ctx.db.patch(deposit.userId, {
        balance: user.balance + deposit.amount,
        hasMadeDeposit: true,
      });
    }

    return { success: true, message: "Deposit approved successfully" };
  },
});

export const rejectDeposit = mutation({
  args: { 
    depositId: v.id("deposits"),
    adminId: v.id("users")
  },
  handler: async (ctx, { depositId, adminId }) => {
    const deposit = await ctx.db.get(depositId);
    if (!deposit) {
      throw new Error("Deposit not found");
    }

    await ctx.db.patch(depositId, {
      status: "failed",
      approvedBy: adminId,
      approvedAt: Date.now(),
    });

    return { success: true };
  },
});

export const approveWithdrawal = mutation({
  args: { 
    withdrawalId: v.id("withdrawals"),
    adminId: v.id("users")
  },
  handler: async (ctx, { withdrawalId, adminId }) => {
    const withdrawal = await ctx.db.get(withdrawalId);
    if (!withdrawal) {
      throw new Error("Withdrawal not found");
    }

    await ctx.db.patch(withdrawalId, {
      status: "completed",
      processedBy: adminId,
      processedAt: Date.now(),
      completedAt: Date.now(),
    });

    return { success: true, message: "Withdrawal approved successfully" };
  },
});

export const rejectWithdrawal = mutation({
  args: { 
    withdrawalId: v.id("withdrawals"),
    adminId: v.id("users")
  },
  handler: async (ctx, { withdrawalId, adminId }) => {
    const withdrawal = await ctx.db.get(withdrawalId);
    if (!withdrawal) {
      throw new Error("Withdrawal not found");
    }

    // Return funds to user balance if rejected
    const user = await ctx.db.get(withdrawal.userId);
    if (user) {
      await ctx.db.patch(withdrawal.userId, {
        balance: user.balance + withdrawal.amountRequested,
      });
    }

    await ctx.db.patch(withdrawalId, {
      status: "rejected",
      processedBy: adminId,
      processedAt: Date.now(),
    });

    return { success: true };
  },
});
// Add these to your existing admin.ts file

export const updateUserBalance = mutation({
  args: {
    userId: v.id("users"),
    newBalance: v.number(),
    adminId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { userId, newBalance, adminId, reason }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const oldBalance = user.balance;
    
    // Update user balance
    await ctx.db.patch(userId, {
      balance: newBalance,
      lastUpdatedBy: adminId,
      lastUpdatedAt: Date.now(),
    });

    return { 
      success: true, 
      message: "User balance updated successfully",
      oldBalance,
      newBalance 
    };
  },
});

export const updateUserProfile = mutation({
  args: {
    userId: v.id("users"),
    updates: v.object({
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      role: v.optional(v.union(v.literal("user"), v.literal("admin"))),
    }),
    adminId: v.id("users")
  },
  handler: async (ctx, { userId, updates, adminId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(userId, {
      ...updates,
      lastUpdatedBy: adminId,
      lastUpdatedAt: Date.now(),
    });

    return { success: true, message: "User profile updated successfully" };
  },
});

export const addAdminNote = mutation({
  args: {
    userId: v.id("users"),
    note: v.string(),
    adminId: v.id("users")
  },
  handler: async (ctx, { userId, note, adminId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.insert("adminNotes", {
      userId,
      adminId,
      note,
      createdAt: Date.now(),
    });

    return { success: true, message: "Note added successfully" };
  },
});

export const getUserNotes = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("adminNotes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getUserInvestments = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("investments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const updateInvestment = mutation({
  args: {
    investmentId: v.id("investments"),
    updates: v.object({
      status: v.optional(v.union(
        v.literal("active"),
        v.literal("completed"),
        v.literal("cancelled")
      )),
      earnedSoFar: v.optional(v.number()),
      dailyProfit: v.optional(v.number()),
      totalProfit: v.optional(v.number()),
    }),
    adminId: v.id("users")
  },
  handler: async (ctx, { investmentId, updates, adminId }) => {
    const investment = await ctx.db.get(investmentId);
    if (!investment) {
      throw new Error("Investment not found");
    }

    await ctx.db.patch(investmentId, updates);

    return { success: true, message: "Investment updated successfully" };
  },
});