// convex/auth.ts - BACKUP SIMPLE SIGNUP
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const simpleSignup = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) throw new Error("Email already registered");
    
    // Create simple referral code
    const referralCode = "REF" + Date.now().toString(36).toUpperCase();
    
    // Create user
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      passwordHash: args.password,
      balance: 2000,
      referralCode: referralCode,
      referralEarnings: 0,
      referredBy: undefined,
      role: "user",
      referralRewarded: false,
      hasMadeDeposit: false,
      totalPurchased: 0,
      totalEarnings: 0,
      createdAt: Date.now(),
    });

    return { 
      success: true, 
      message: "User registered successfully (simple signup)",
      userId: userId.toString(),
      name: args.name,
      email: args.email,
      phone: args.phone,
      balance: 2000,
      role: "user",
      referralCode: referralCode,
    };
  },
});

// Optional: Also add a simple signin function
export const simpleSignin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { email, password }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // In a real app, you'd hash the password and compare
    if (user.passwordHash !== password) {
      throw new Error("Invalid password");
    }

    return {
      success: true,
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      balance: user.balance,
      role: user.role,
      referralCode: user.referralCode,
    };
  },
});