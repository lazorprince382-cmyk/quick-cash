// convex/referrals.ts - COMPLETE UPDATED VERSION
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get user's referral stats
export const getReferralStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return null;

    // Use proper type-safe query
    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_referrer", (q) => q.eq("referrerId", userId))
      .collect();

    const totalReferrals = referrals.length;
    const activeReferrals = referrals.filter(ref => ref.status === "signed_up").length;
    const depositedReferrals = referrals.filter(ref => ref.status === "deposited").length;
    const totalCommission = referrals.reduce((sum, ref) => sum + (ref.commissionEarned || 0), 0);

    return {
      referralCode: user.referralCode,
      totalReferrals,
      activeReferrals,
      depositedReferrals,
      totalCommission,
      referralEarnings: user.referralEarnings || 0,
    };
  },
});

// Get referral link for user
export const getReferralLink = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user?.referralCode) return null;

    return `https://quick-cash-jp19.vercel.app/signup?ref=${user.referralCode}`;
  },
});

// Get user's referral history
export const getUserReferrals = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_referrer", (q) => q.eq("referrerId", userId))
      .collect();

    // Get referred users details
    const referralsWithDetails = await Promise.all(
      referrals.map(async (ref) => {
        let referredUser = null;
        if (ref.referredUserId) {
          referredUser = await ctx.db.get(ref.referredUserId);
        }
        return {
          ...ref,
          referredUserName: referredUser?.name || "Unknown",
          referredUserEmail: referredUser?.email || "Unknown",
        };
      })
    );

    return referralsWithDetails;
  },
});

// Check if referral code is valid
export const validateReferralCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_referralCode", (q) => q.eq("referralCode", code))
      .first();
    
    return user ? { 
      valid: true, 
      referrerName: user.name,
      referrerId: user._id 
    } : { valid: false };
  },
});

// Process referral commission when deposit is approved
export const processReferralCommission = mutation({
  args: {
    userId: v.id("users"),
    depositAmount: v.number(),
  },
  handler: async (ctx, { userId, depositAmount }) => {
    const user = await ctx.db.get(userId);
    if (!user || user.hasMadeDeposit) return null;

    if (user.referredBy && !user.referralRewarded) {
      const referrer = await ctx.db.get(user.referredBy);
      if (referrer) {
        const commission = Math.round(depositAmount * 0.05);
        
        // Update referrer's balance and earnings
        await ctx.db.patch(referrer._id, {
          balance: referrer.balance + commission,
          referralEarnings: (referrer.referralEarnings || 0) + commission,
        });

        // Mark user as having made deposit and rewarded
        await ctx.db.patch(userId, {
          hasMadeDeposit: true,
          referralRewarded: true,
        });

        // Find and update the referral record
        const referrals = await ctx.db
          .query("referrals")
          .withIndex("by_referrer", (q) => q.eq("referrerId", referrer._id))
          .collect();

        const referral = referrals.find(ref => ref.referredUserId === userId);
        
        if (referral) {
          await ctx.db.patch(referral._id, {
            status: "deposited",
            commissionEarned: commission,
            depositAmount: depositAmount,
            commissionDate: Date.now(),
          });
        }

        // Record the transaction
        await ctx.db.insert("transactions", {
          userId: referrer._id,
          type: "referral",
          amount: commission,
          description: `5% referral commission from ${user.name}'s deposit`,
          createdAt: Date.now(),
        });

        return { 
          success: true, 
          commission, 
          referrerName: referrer.name,
          message: `UGX ${commission.toLocaleString()} referral commission paid to ${referrer.name}`
        };
      }
    }

    return { success: false, message: "No referral commission to process" };
  },
});

// Create referral record (for manual creation if needed)
export const createReferralRecord = mutation({
  args: {
    referrerId: v.id("users"),
    referredUserId: v.id("users"),
    referralCode: v.string(),
  },
  handler: async (ctx, { referrerId, referredUserId, referralCode }) => {
    const referralId = await ctx.db.insert("referrals", {
      referrerId,
      referredUserId,
      referralCode,
      status: "signed_up",
      welcomeBonusGiven: true,
      signupDate: Date.now(),
    });

    return referralId;
  },
});