import { mutation } from "./_generated/server";
import { v } from "convex/values";

function generateReferralCode(): string {
  return "REF" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function generateUniqueReferralCode(ctx: any): Promise<string> {
  let referralCode: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10; // Prevent infinite loop

  while (!isUnique && attempts < maxAttempts) {
    referralCode = generateReferralCode();
    
    // Check if this referral code already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_referralCode", (q: any) => q.eq("referralCode", referralCode))
      .first();

    if (!existingUser) {
      isUnique = true;
      return referralCode;
    }
    
    attempts++;
  }

  // Fallback: use timestamp + random string if all attempts fail
  return "REF" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 4).toUpperCase();
}

export const signup = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    password: v.string(),
    referralCode: v.optional(v.string()),
  },
  handler: async (ctx, { name, email, phone, password, referralCode }) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .first();

    if (existingUser) {
      throw new Error("Email already registered");
    }

    const now = Date.now();
    const passwordHash = password; // Storing plain text for now
    const generatedReferralCode = await generateUniqueReferralCode(ctx);

    let referredBy = undefined;
    if (referralCode) {
      const referrer = await ctx.db
        .query("users")
        .withIndex("by_referralCode", (q: any) => q.eq("referralCode", referralCode))
        .first();
      if (referrer) {
        referredBy = referrer._id;
      }
    }

    const userId = await ctx.db.insert("users", {
      name,
      email,
      phone,
      passwordHash,
      balance: 2000,
      referralCode: generatedReferralCode,
      referralEarnings: 0,
      referredBy,
      role: "user",
      referralRewarded: false,
      hasMadeDeposit: false,
      totalPurchased: 0,
      totalEarnings: 0,
      createdAt: now,
    });

    // FIX: Convert userId to string for the return object
    return {
      userId: userId.toString(), // Convert Id to string
      name,
      email,
      phone,
      balance: 2000,
      referralEarnings: 0,
      role: "user",
      referralCode: generatedReferralCode,
    };
  },
});