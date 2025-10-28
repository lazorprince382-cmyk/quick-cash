import { query } from "./_generated/server";
import { v } from "convex/values";

export const getUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    // Don't return password hash for security
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
});