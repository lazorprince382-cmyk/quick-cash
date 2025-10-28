import { query } from "./_generated/server";

export const checkApi = query({
  handler: async (ctx) => {
    return {
      message: "API check - if you can see this, your Convex is working"
    };
  },
});