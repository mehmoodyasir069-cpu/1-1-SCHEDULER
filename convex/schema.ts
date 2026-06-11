import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  students: defineTable({
    order: v.number(),
    name: v.string(),
    initials: v.string(),
    active: v.boolean(),
    introDone: v.boolean(),
    sessionGoal: v.number(),
    note: v.string(),
    createdAt: v.number(),
    leadSource: v.optional(v.string()),
    leadSourceOther: v.optional(v.string()),
    currentState: v.optional(v.string()),
    goals: v.optional(v.string()),
    investmentBudget: v.optional(v.string()),
    futurePlans: v.optional(v.string()),
    experienceLevel: v.optional(v.string()),
    problemsWeaknesses: v.optional(v.string()),
    importantReminders: v.optional(v.string()),
    updatedAt: v.optional(v.number()),
  }).index("by_order", ["order"]),

  sessions: defineTable({
    studentId: v.id("students"),
    studentName: v.string(),
    startAt: v.number(),
    endAt: v.number(),
    durationMinutes: v.number(),
    status: v.union(
      v.literal("scheduled"),
      v.literal("done"),
      v.literal("postponed"),
      v.literal("canceled"),
    ),
    note: v.union(v.string(), v.null()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_startAt", ["startAt"])
    .index("by_studentId", ["studentId"])
    .index("by_status", ["status"]),

  studentNotes: defineTable({
    studentId: v.id("students"),
    sessionId: v.optional(v.id("sessions")),
    type: v.union(v.literal("general"), v.literal("session")),
    title: v.union(v.string(), v.null()),
    content: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_studentId", ["studentId"])
    .index("by_createdAt", ["createdAt"]),

  fees: defineTable({
    studentId: v.id("students"),
    studentOrder: v.number(),
    studentName: v.string(),
    totalFee: v.number(),
    amountPaid: v.number(),
    amountDue: v.number(),
    lastPaymentOn: v.union(v.string(), v.null()),
    nextDueOn: v.union(v.string(), v.null()),
    note: v.union(v.string(), v.null()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_order", ["studentOrder"])
    .index("by_studentId", ["studentId"]),
});
