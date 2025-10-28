// convex/deposit.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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

// Add this query to fetch recent deposits for a specific user
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