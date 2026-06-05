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
