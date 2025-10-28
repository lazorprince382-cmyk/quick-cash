import { mutation } from "./_generated/server";
import { api } from "./_generated/api";

// Process investment returns daily
export const processInvestmentReturns = mutation({
  handler: async (ctx): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await ctx.scheduler.runAfter(0, api.investments.processDailyReturns, {});
      return { success: true };
    } catch (error) {
      console.error("Investment processing error:", error);
      return { 
        success: false, 
        error: "Investment processing failed" 
      };
    }
  },
});