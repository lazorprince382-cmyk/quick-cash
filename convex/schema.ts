// convex/schema.ts - COMPLETE CORRECTED VERSION
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    passwordHash: v.string(),
    balance: v.number(),
    referralCode: v.string(),
    referralEarnings: v.number(),
    referredBy: v.optional(v.id("users")),
    role: v.union(v.literal("user"), v.literal("admin")),
    referralRewarded: v.boolean(),
    hasMadeDeposit: v.boolean(),
    totalPurchased: v.optional(v.number()),
    totalEarnings: v.optional(v.number()),
    createdAt: v.number(),
    lastUpdatedBy: v.optional(v.id("users")),
    lastUpdatedAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_referralCode", ["referralCode"])
    .index("by_referredBy", ["referredBy"]),

  packages: defineTable({
    name: v.string(),
    amount: v.number(),
    rate: v.number(),
    durationDays: v.number(),
    isActive: v.boolean(),
    description: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_amount", ["amount"])
    .index("by_active", ["isActive"]),

  investments: defineTable({
    userId: v.id("users"),
    packageId: v.id("packages"),
    packageName: v.string(),
    amount: v.number(),
    expectedReturn: v.number(),
    actualReturn: v.optional(v.number()),
    durationDays: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    purchaseDate: v.number(),
    maturityDate: v.number(),
    completionDate: v.optional(v.number()),
    lastPayoutDate: v.optional(v.number()),
    earnedSoFar: v.optional(v.number()),
    dailyProfit: v.optional(v.number()),
    totalProfit: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_maturity", ["maturityDate"])
    .index("by_user_status", ["userId", "status"])
    .index("by_lastPayout", ["lastPayoutDate"]),

  deposits: defineTable({
    userId: v.id("users"),
    name: v.string(),
    phone: v.string(),
    amount: v.number(),
    method: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    adminApproved: v.boolean(),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),

  withdrawals: defineTable({
    userId: v.id("users"),
    amountRequested: v.number(),
    fee: v.number(),
    netAmount: v.number(),
    method: v.string(),
    accountNumber: v.string(),
    accountName: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("completed"),
      v.literal("rejected"),
      v.literal("cancelled")
    ),
    processedBy: v.optional(v.id("users")),
    processedAt: v.optional(v.number()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),

  dailyPayouts: defineTable({
    investmentId: v.id("investments"),
    userId: v.id("users"),
    amount: v.number(),
    payoutDate: v.number(),
    type: v.union(v.literal("daily_profit"), v.literal("principal_return")),
  })
    .index("by_investment", ["investmentId"])
    .index("by_user", ["userId"])
    .index("by_date", ["payoutDate"]),

  adminNotes: defineTable({
    userId: v.id("users"),
    adminId: v.id("users"),
    note: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_admin", ["adminId"])
    .index("by_created", ["createdAt"]),

  transactions: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("deposit"),
      v.literal("withdrawal"),
      v.literal("investment"),
      v.literal("profit"),
      v.literal("referral"),
      v.literal("admin_adjustment")
    ),
    amount: v.number(),
    description: v.string(),
    relatedId: v.optional(v.union(
      v.id("deposits"),
      v.id("withdrawals"),
      v.id("investments")
    )),
    adminId: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"])
    .index("by_created", ["createdAt"]),

  // ADD THE REFERRALS TABLE - THIS WAS MISSING!
  referrals: defineTable({
    referrerId: v.id("users"),
    referredUserId: v.optional(v.id("users")),
    referralCode: v.string(),
    status: v.union(v.literal("signed_up"), v.literal("deposited"), v.literal("completed")),
    welcomeBonusGiven: v.boolean(),
    commissionEarned: v.optional(v.number()),
    depositAmount: v.optional(v.number()),
    signupDate: v.number(),
    commissionDate: v.optional(v.number()),
  })
    .index("by_referrer", ["referrerId"])
    .index("by_referred", ["referredUserId"])
    .index("by_code", ["referralCode"]),
});