// convex/signup.ts - COMPLETE UPDATED VERSION
import { mutation } from "./_generated/server";
import { v } from "convex/values";

function generateReferralCode(): string {
  return "REF" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function generateUniqueReferralCode(ctx: any): Promise<string> {
  let referralCode: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    referralCode = generateReferralCode();
    
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
    const passwordHash = password;
    const generatedReferralCode = await generateUniqueReferralCode(ctx);

    let referredBy = undefined;
    let referrerBonusGiven = false;
    
    // Process referral code if provided
    if (referralCode) {
      const referrer = await ctx.db
        .query("users")
        .withIndex("by_referralCode", (q: any) => q.eq("referralCode", referralCode))
        .first();
      
      if (referrer) {
        referredBy = referrer._id;
        
        // Give welcome bonus to referrer for successful signup
        const referrerBonus = 500;
        await ctx.db.patch(referrer._id, {
          balance: referrer.balance + referrerBonus,
          referralEarnings: (referrer.referralEarnings || 0) + referrerBonus,
        });

        // Record referrer bonus transaction
        await ctx.db.insert("transactions", {
          userId: referrer._id,
          type: "referral",
          amount: referrerBonus,
          description: `Referral signup bonus for ${name}`,
          createdAt: now,
        });

        referrerBonusGiven = true;
      }
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      name,
      email,
      phone,
      passwordHash,
      balance: 2000, // Welcome bonus for new user
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

    // Create referral record if user was referred
    if (referredBy && referralCode) {
      await ctx.db.insert("referrals", {
        referrerId: referredBy,
        referredUserId: userId,
        referralCode: referralCode,
        status: "signed_up",
        welcomeBonusGiven: referrerBonusGiven,
        signupDate: now,
      });
    }

    // Return user data (simple types only)
    return {
      success: true,
      message: "User registered successfully",
      userId: userId.toString(),
      name,
      email,
      phone,
      balance: 2000,
      role: "user",
      referralCode: generatedReferralCode,
      referredBy: referredBy ? referredBy.toString() : null,
    };
  },
});