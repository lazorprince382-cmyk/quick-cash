// convex/signup.ts - FIXED VERSION
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

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

  return "REF" + Date.now().toString(36).toUpperCase();
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
    const generatedReferralCode = await generateUniqueReferralCode(ctx);

    let referredBy: Id<"users"> | undefined = undefined;
    
    if (referralCode && referralCode.trim() !== "") {
      const referrer = await ctx.db
        .query("users")
        .withIndex("by_referralCode", (q: any) => q.eq("referralCode", referralCode.trim()))
        .first();
      
      if (referrer) {
        referredBy = referrer._id;
        
        const referrerBonus = 500;
        await ctx.db.patch(referrer._id, {
          balance: (referrer.balance || 0) + referrerBonus,
          referralEarnings: (referrer.referralEarnings || 0) + referrerBonus,
        });

        await ctx.db.insert("transactions", {
          userId: referrer._id,
          type: "referral",
          amount: referrerBonus,
          description: `Referral signup bonus for ${name}`,
          createdAt: now,
        });
      }
    }

    const userId = await ctx.db.insert("users", {
      name,
      email,
      phone,
      passwordHash: password,
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

    if (referredBy && referralCode) {
      await ctx.db.insert("referrals", {
        referrerId: referredBy,
        referredUserId: userId,
        referralCode: referralCode,
        status: "signed_up",
        welcomeBonusGiven: true,
        signupDate: now,
      });
    }

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
    };
  },
});