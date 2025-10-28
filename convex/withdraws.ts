// convex/withdraws.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createWithdrawal = mutation({
  args: {
    userId: v.id("users"),
    amountRequested: v.number(),
    method: v.string(),
    accountNumber: v.string(),
    accountName: v.string(),
  },
  handler: async (ctx, { userId, amountRequested, method, accountNumber, accountName }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (amountRequested < 5000) {
      throw new Error("Minimum withdrawal is UGX 5,000");
    }

    if (amountRequested > user.balance) {
      throw new Error("Insufficient balance");
    }

    // Calculate 15% fee (minimum 500 UGX)
    const fee = Math.max(500, Math.round(amountRequested * 0.15));
    const netAmount = amountRequested - fee;

    // Deduct balance immediately when withdrawal is created
    await ctx.db.patch(userId, {
      balance: user.balance - amountRequested,
    });

    // Create withdrawal record
    const withdrawalId = await ctx.db.insert("withdrawals", {
      userId,
      amountRequested,
      fee,
      netAmount,
      method,
      accountNumber,
      accountName,
      status: "pending",
      createdAt: Date.now(),
    });

    // Create transaction record
    await ctx.db.insert("transactions", {
      userId,
      type: "withdrawal",
      amount: -amountRequested,
      description: `Withdrawal request - UGX ${amountRequested.toLocaleString()} (Fee: UGX ${fee.toLocaleString()})`,
      relatedId: withdrawalId,
      createdAt: Date.now(),
    });

    return {
      success: true,
      message: "Withdrawal request submitted for admin approval",
      withdrawalId,
      fee,
      netAmount,
    };
  },
});

export const getUserWithdrawals = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const withdrawals = await ctx.db
      .query("withdrawals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return withdrawals.map(withdrawal => ({
      ...withdrawal,
      statusText: getStatusText(withdrawal.status),
    }));
  },
});

export const getAllWithdrawals = query({
  handler: async (ctx) => {
    const withdrawals = await ctx.db
      .query("withdrawals")
      .order("desc")
      .collect();

    // Get user details for each withdrawal
    const withdrawalsWithUsers = await Promise.all(
      withdrawals.map(async (withdrawal) => {
        const user = await ctx.db.get(withdrawal.userId);
        return {
          ...withdrawal,
          userName: user?.name || "Unknown User",
          userEmail: user?.email || "Unknown Email",
          statusText: getStatusText(withdrawal.status),
        };
      })
    );

    return withdrawalsWithUsers;
  },
});

function getStatusText(status: string): string {
  switch (status) {
    case "pending": return "Pending Approval";
    case "approved": return "Approved - Processing";
    case "completed": return "Completed";
    case "rejected": return "Rejected";
    case "cancelled": return "Cancelled";
    default: return status;
  }
}