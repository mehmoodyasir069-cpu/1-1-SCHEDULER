import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  feeSeedData,
  sessionSeedData,
  studentSeedData,
  totalCourseFee,
} from "../src/lib/crm-data";

function computeInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const letters = parts
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
  return letters.slice(0, 2) || name.slice(0, 2).toUpperCase();
}

async function getStudentMap(ctx: any): Promise<Map<string, any>> {
  const students: any[] = await ctx.db
    .query("students")
    .withIndex("by_order")
    .collect();
  return new Map(students.map((student: any) => [student.name, student]));
}

export const ensureSeedData = mutation({
  args: {},
  handler: async (ctx) => {
    const studentMap = await getStudentMap(ctx);

    for (const seed of studentSeedData) {
      if (!studentMap.has(seed.name)) {
        const studentId = await ctx.db.insert("students", {
          order: seed.order,
          name: seed.name,
          initials: seed.initials || computeInitials(seed.name),
          active: seed.active,
          introDone: seed.introDone,
          sessionGoal: seed.sessionGoal,
          note: seed.note,
          createdAt: Date.now(),
        });
        studentMap.set(seed.name, {
          _id: studentId,
          order: seed.order,
          name: seed.name,
          initials: seed.initials || computeInitials(seed.name),
          active: seed.active,
          introDone: seed.introDone,
          sessionGoal: seed.sessionGoal,
          note: seed.note,
          createdAt: Date.now(),
        });
      }
    }

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_startAt")
      .collect();
    const sessionKeys = new Set(
      sessions.map(
        (session) =>
          `${session.studentName}|${session.startAt}|${session.durationMinutes}`,
      ),
    );

    for (const seed of sessionSeedData) {
      const student = studentMap.get(seed.studentName);
      if (!student) continue;
      const startAt = new Date(seed.startAt).getTime();
      const key = `${seed.studentName}|${startAt}|${seed.durationMinutes}`;
      if (!sessionKeys.has(key)) {
        await ctx.db.insert("sessions", {
          studentId: student._id,
          studentName: seed.studentName,
          startAt,
          endAt: startAt + seed.durationMinutes * 60 * 1000,
          durationMinutes: seed.durationMinutes,
          status: "scheduled",
          note: seed.note,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    const fees = await ctx.db.query("fees").withIndex("by_order").collect();
    const feeKeys = new Set(fees.map((fee) => fee.studentName));

    for (const seed of feeSeedData) {
      const student = studentMap.get(seed.studentName);
      if (!student) continue;
      if (!feeKeys.has(seed.studentName)) {
        await ctx.db.insert("fees", {
          studentId: student._id,
          studentOrder: student.order,
          studentName: seed.studentName,
          totalFee: totalCourseFee,
          amountPaid: seed.amountPaid,
          amountDue: seed.amountDue,
          lastPaymentOn: seed.lastPaymentOn,
          nextDueOn: seed.nextDueOn,
          note: seed.note,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }
  },
});

export const listStudents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("students").withIndex("by_order").collect();
  },
});

export const listSessions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("sessions").withIndex("by_startAt").collect();
  },
});

export const listFees = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("fees").withIndex("by_order").collect();
  },
});

export const addStudent = mutation({
  args: {
    name: v.string(),
    sessionGoal: v.number(),
    amountPaid: v.number(),
    amountDue: v.number(),
    lastPaymentOn: v.union(v.string(), v.null()),
    nextDueOn: v.union(v.string(), v.null()),
    note: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const students = await ctx.db.query("students").withIndex("by_order").collect();
    const nextOrder = students.reduce(
      (max, student) => Math.max(max, student.order),
      0,
    );
    const initials = computeInitials(args.name);
    const now = Date.now();
    const studentId = await ctx.db.insert("students", {
      order: nextOrder + 1,
      name: args.name.trim(),
      initials,
      active: true,
      introDone: true,
      sessionGoal: args.sessionGoal,
      note:
        args.note ?? "New student added from the CRM forms.",
      createdAt: now,
    });

    await ctx.db.insert("fees", {
      studentId,
      studentOrder: nextOrder + 1,
      studentName: args.name.trim(),
      totalFee: totalCourseFee,
      amountPaid: args.amountPaid,
      amountDue: args.amountDue,
      lastPaymentOn: args.lastPaymentOn,
      nextDueOn: args.nextDueOn,
      note: args.note,
      createdAt: now,
      updatedAt: now,
    });

    return studentId;
  },
});

export const saveFeeAccount = mutation({
  args: {
    studentId: v.id("students"),
    amountPaid: v.number(),
    amountDue: v.number(),
    lastPaymentOn: v.union(v.string(), v.null()),
    nextDueOn: v.union(v.string(), v.null()),
    note: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found.");
    }

    const existing = await ctx.db
      .query("fees")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .first();

    const payload = {
      studentId: student._id,
      studentOrder: student.order,
      studentName: student.name,
      totalFee: totalCourseFee,
      amountPaid: args.amountPaid,
      amountDue: args.amountDue,
      lastPaymentOn: args.lastPaymentOn,
      nextDueOn: args.nextDueOn,
      note: args.note,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return await ctx.db.insert("fees", {
      ...payload,
      createdAt: Date.now(),
    });
  },
});

export const scheduleSession = mutation({
  args: {
    studentId: v.id("students"),
    startAt: v.number(),
    durationMinutes: v.number(),
    note: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found.");
    }

    const endAt = args.startAt + args.durationMinutes * 60 * 1000;
    const existingSessions = await ctx.db
      .query("sessions")
      .withIndex("by_startAt")
      .collect();

    const overlapping = existingSessions.find((session) => {
      if (session.status !== "scheduled") return false;
      return args.startAt < session.endAt && endAt > session.startAt;
    });

    if (overlapping) {
      throw new Error(
        `This slot overlaps with ${overlapping.studentName} on ${new Date(
          overlapping.startAt,
        ).toLocaleString("en-GB")}.`,
      );
    }

    const now = Date.now();
    return await ctx.db.insert("sessions", {
      studentId: student._id,
      studentName: student.name,
      startAt: args.startAt,
      endAt,
      durationMinutes: args.durationMinutes,
      status: "scheduled",
      note: args.note,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const setSessionStatus = mutation({
  args: {
    sessionId: v.id("sessions"),
    status: v.union(
      v.literal("done"),
      v.literal("canceled"),
      v.literal("postponed"),
      v.literal("scheduled"),
    ),
    note: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found.");
    }

    await ctx.db.patch(args.sessionId, {
      status: args.status,
      note: args.note ?? session.note,
      updatedAt: Date.now(),
    });
  },
});

export const postponeSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    startAt: v.number(),
    durationMinutes: v.number(),
    note: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found.");
    }

    const endAt = args.startAt + args.durationMinutes * 60 * 1000;
    const existingSessions = await ctx.db
      .query("sessions")
      .withIndex("by_startAt")
      .collect();

    const overlapping = existingSessions.find((candidate) => {
      if (candidate.status !== "scheduled") return false;
      if (candidate._id === args.sessionId) return false;
      return args.startAt < candidate.endAt && endAt > candidate.startAt;
    });

    if (overlapping) {
      throw new Error(
        `The new slot overlaps with ${overlapping.studentName} on ${new Date(
          overlapping.startAt,
        ).toLocaleString("en-GB")}.`,
      );
    }

    const now = Date.now();
    await ctx.db.patch(args.sessionId, {
      status: "postponed",
      note: args.note ?? session.note,
      updatedAt: now,
    });

    return await ctx.db.insert("sessions", {
      studentId: session.studentId,
      studentName: session.studentName,
      startAt: args.startAt,
      endAt,
      durationMinutes: args.durationMinutes,
      status: "scheduled",
      note: args.note,
      createdAt: now,
      updatedAt: now,
    });
  },
});
