import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const signin = mutation({
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
      throw new Error("Invalid email or password");
    }

    // Plain text password comparison
    if (user.passwordHash !== password) {
      throw new Error("Invalid email or password");
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      balance: user.balance,
      referralEarnings: user.referralEarnings,
      referralCode: user.referralCode,
      role: user.role,
    };
  },
});