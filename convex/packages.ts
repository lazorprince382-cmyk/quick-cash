import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all active packages
export const getPackages = query({
  handler: async (ctx) => {
    const packages = await ctx.db
      .query("packages")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    return packages;
  },
});

// Purchase a package
export const purchasePackage = mutation({
  args: { 
    packageId: v.id("packages"),
    userId: v.id("users")
  },
  handler: async (ctx, { packageId, userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const pkg = await ctx.db.get(packageId);
    if (!pkg) {
      throw new Error("Package not found");
    }

    // Check balance
    if (user.balance < pkg.amount) {
      throw new Error(`Insufficient balance. Need UGX ${pkg.amount}, but only have UGX ${user.balance}`);
    }

    // 50% DAILY profits for 3 days
    const dailyProfit = Math.round(pkg.amount * 0.5); // 50% daily
    const totalProfit = dailyProfit * pkg.durationDays; // Total over 3 days
    const totalReturn = pkg.amount + totalProfit;
    const maturityDate = Date.now() + (pkg.durationDays * 24 * 60 * 60 * 1000);

    // Create investment
    const investmentId = await ctx.db.insert("investments", {
      userId: user._id,
      packageId: pkg._id,
      packageName: pkg.name,
      amount: pkg.amount,
      expectedReturn: totalReturn,
      durationDays: pkg.durationDays,
      status: "active",
      purchaseDate: Date.now(),
      maturityDate: maturityDate,
      dailyProfit: dailyProfit, // 50% of investment daily
      totalProfit: totalProfit,
      earnedSoFar: 0,
      lastPayoutDate: Date.now(),
    });

    // Update user balance
    await ctx.db.patch(user._id, {
      balance: user.balance - pkg.amount,
      totalPurchased: (user.totalPurchased || 0) + pkg.amount,
    });

    return { 
      success: true, 
      investmentId,
      newBalance: user.balance - pkg.amount,
      dailyProfit: dailyProfit,
      message: `Successfully purchased ${pkg.name}! You will earn UGX ${dailyProfit} daily for ${pkg.durationDays} days.`
    };
  },
});