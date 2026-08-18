import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  feeSeedData,
  sessionSeedData,
  studentSeedData,
} from "../src/lib/crm-data";

function computeInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const letters = parts
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
  return letters.slice(0, 2) || name.slice(0, 2).toUpperCase();
}

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function normalizeProfileFields(args: {
  currentState?: string;
  goals?: string;
  investmentBudget?: string;
  futurePlans?: string;
  experienceLevel?: string;
  problemsWeaknesses?: string;
  importantReminders?: string;
}) {
  return {
    currentState: normalizeText(args.currentState),
    goals: normalizeText(args.goals),
    investmentBudget: normalizeText(args.investmentBudget),
    futurePlans: normalizeText(args.futurePlans),
    experienceLevel: normalizeText(args.experienceLevel),
    problemsWeaknesses: normalizeText(args.problemsWeaknesses),
    importantReminders: normalizeText(args.importantReminders),
  };
}

function normalizeLeadSource(value: string | null | undefined) {
  return normalizeText(value);
}

function appendSessionAudit(note: string | null, auditLine: string) {
  const existing = normalizeText(note);
  return existing ? `${existing}\n\n${auditLine}` : auditLine;
}

function validateSessionTimestamp(value: number, errorMessage: string) {
  if (!Number.isFinite(value) || !Number.isFinite(new Date(value).getTime())) {
    throw new Error(errorMessage);
  }
}

function validateSessionWindow(startAt: number, durationMinutes: number) {
  validateSessionTimestamp(startAt, "Choose a valid session date and time.");
  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 15 ||
    durationMinutes > 480
  ) {
    throw new Error(
      "Session duration must be a whole number from 15 to 480 minutes.",
    );
  }

  const endAt = startAt + durationMinutes * 60 * 1000;
  validateSessionTimestamp(
    endAt,
    "The session end time must be a valid date and time.",
  );
  if (endAt <= startAt) {
    throw new Error("The session end time must be after its start time.");
  }

  return endAt;
}

async function getStudentMap(ctx: any): Promise<Map<string, any>> {
  const students: any[] = await ctx.db
    .query("students")
    .withIndex("by_order")
    .collect();
  return new Map(students.map((student: any) => [student.name, student]));
}

async function ensureSessionSlotIsAvailable(
  ctx: any,
  startAt: number,
  endAt: number,
  excludeSessionId?: string,
) {
  const existingSessions = await ctx.db
    .query("sessions")
    .withIndex("by_startAt")
    .collect();

  const overlapping = existingSessions.find((session: any) => {
    if (session.status !== "scheduled") return false;
    if (excludeSessionId && String(session._id) === String(excludeSessionId)) {
      return false;
    }
    return startAt < session.endAt && endAt > session.startAt;
  });

  if (overlapping) {
    throw new Error(
      `This slot overlaps with ${overlapping.studentName} on ${new Date(
        overlapping.startAt,
      ).toLocaleString("en-GB")}.`,
    );
  }
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
          leadSource: "",
          leadSourceOther: "",
          currentState: "",
          goals: "",
          investmentBudget: "",
          futurePlans: "",
          experienceLevel: "",
          problemsWeaknesses: "",
          importantReminders: "",
          updatedAt: Date.now(),
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
          leadSource: "",
          leadSourceOther: "",
          currentState: "",
          goals: "",
          investmentBudget: "",
          futurePlans: "",
          experienceLevel: "",
          problemsWeaknesses: "",
          importantReminders: "",
          updatedAt: Date.now(),
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
          totalFee: seed.totalFee,
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

export const listStudentNotes = query({
  args: {},
  handler: async (ctx) => {
    const notes = await ctx.db
      .query("studentNotes")
      .withIndex("by_createdAt")
      .collect();

    return notes.sort((left, right) => {
      if (right.createdAt !== left.createdAt) {
        return right.createdAt - left.createdAt;
      }
      return right.updatedAt - left.updatedAt;
    });
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
    totalFee: v.number(),
    amountPaid: v.number(),
    amountDue: v.number(),
    lastPaymentOn: v.union(v.string(), v.null()),
    nextDueOn: v.union(v.string(), v.null()),
    note: v.union(v.string(), v.null()),
    leadSource: v.optional(v.string()),
    leadSourceOther: v.optional(v.string()),
    currentState: v.optional(v.string()),
    goals: v.optional(v.string()),
    investmentBudget: v.optional(v.string()),
    futurePlans: v.optional(v.string()),
    experienceLevel: v.optional(v.string()),
    problemsWeaknesses: v.optional(v.string()),
    importantReminders: v.optional(v.string()),
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
      leadSource: normalizeLeadSource(args.leadSource),
      leadSourceOther: normalizeLeadSource(args.leadSourceOther),
      currentState: normalizeText(args.currentState),
      goals: normalizeText(args.goals),
      investmentBudget: normalizeText(args.investmentBudget),
      futurePlans: normalizeText(args.futurePlans),
      experienceLevel: normalizeText(args.experienceLevel),
      problemsWeaknesses: normalizeText(args.problemsWeaknesses),
      importantReminders: normalizeText(args.importantReminders),
      updatedAt: now,
    });

    await ctx.db.insert("fees", {
      studentId,
      studentOrder: nextOrder + 1,
      studentName: args.name.trim(),
      totalFee: args.totalFee,
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

export const saveStudentProfile = mutation({
  args: {
    studentId: v.id("students"),
    name: v.string(),
    currentState: v.string(),
    goals: v.string(),
    investmentBudget: v.string(),
    futurePlans: v.string(),
    experienceLevel: v.string(),
    problemsWeaknesses: v.string(),
    importantReminders: v.string(),
    note: v.string(),
    leadSource: v.string(),
    leadSourceOther: v.string(),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found.");
    }

    const name = args.name.trim();
    if (!name) {
      throw new Error("Student name is required.");
    }

    const now = Date.now();
    await ctx.db.patch(args.studentId, {
      name,
      initials: computeInitials(name),
      note: args.note,
      updatedAt: now,
      leadSource: normalizeLeadSource(args.leadSource),
      leadSourceOther: normalizeLeadSource(args.leadSourceOther),
      ...normalizeProfileFields(args),
    });

    if (student.name !== name) {
      const relatedFees = await ctx.db
        .query("fees")
        .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
        .collect();
      for (const fee of relatedFees) {
        await ctx.db.patch(fee._id, {
          studentName: name,
          updatedAt: now,
        });
      }

      const relatedSessions = await ctx.db
        .query("sessions")
        .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
        .collect();
      for (const session of relatedSessions) {
        await ctx.db.patch(session._id, {
          studentName: name,
          updatedAt: now,
        });
      }
    }

    return args.studentId;
  },
});

export const saveFeeAccount = mutation({
  args: {
    studentId: v.id("students"),
    totalFee: v.number(),
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
      totalFee: args.totalFee,
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

    const endAt = validateSessionWindow(args.startAt, args.durationMinutes);
    await ensureSessionSlotIsAvailable(ctx, args.startAt, endAt);

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

export const addStudentNote = mutation({
  args: {
    studentId: v.id("students"),
    sessionId: v.union(v.id("sessions"), v.null()),
    type: v.union(v.literal("general"), v.literal("session")),
    title: v.union(v.string(), v.null()),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found.");
    }

    if (args.type === "session") {
      if (!args.sessionId) {
        throw new Error("Session notes need a linked session.");
      }
      const session = await ctx.db.get(args.sessionId);
      if (!session) {
        throw new Error("Session not found.");
      }
      if (String(session.studentId) !== String(args.studentId)) {
        throw new Error("That session does not belong to this student.");
      }
    }

    const content = args.content.trim();
    if (!content) {
      throw new Error("Add some note content first.");
    }

    const now = Date.now();
    return await ctx.db.insert("studentNotes", {
      studentId: student._id,
      sessionId: args.sessionId ?? undefined,
      type: args.type,
      title: normalizeOptionalText(args.title),
      content,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateStudentNote = mutation({
  args: {
    noteId: v.id("studentNotes"),
    studentId: v.id("students"),
    sessionId: v.union(v.id("sessions"), v.null()),
    type: v.union(v.literal("general"), v.literal("session")),
    title: v.union(v.string(), v.null()),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      throw new Error("Note not found.");
    }

    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found.");
    }

    if (args.type === "session") {
      if (!args.sessionId) {
        throw new Error("Session notes need a linked session.");
      }
      const session = await ctx.db.get(args.sessionId);
      if (!session) {
        throw new Error("Session not found.");
      }
      if (String(session.studentId) !== String(args.studentId)) {
        throw new Error("That session does not belong to this student.");
      }
    }

    const content = args.content.trim();
    if (!content) {
      throw new Error("Add some note content first.");
    }

    await ctx.db.patch(args.noteId, {
      studentId: student._id,
      sessionId: args.sessionId ?? undefined,
      type: args.type,
      title: normalizeOptionalText(args.title),
      content,
      updatedAt: Date.now(),
    });

    return args.noteId;
  },
});

export const deleteStudentNote = mutation({
  args: {
    noteId: v.id("studentNotes"),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      throw new Error("Note not found.");
    }

    await ctx.db.delete(args.noteId);
    return args.noteId;
  },
});

// Temporary compatibility path for the currently deployed frontend.
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
    if (session.status !== "scheduled") {
      throw new Error("Only scheduled sessions can be completed or canceled.");
    }
    if (args.status !== "done" && args.status !== "canceled") {
      throw new Error(
        "Legacy status updates can only complete or cancel a scheduled session.",
      );
    }

    await ctx.db.patch(args.sessionId, {
      status: args.status,
      note: args.note ?? session.note,
      updatedAt: Date.now(),
    });
  },
});

export const completeSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    noteTitle: v.union(v.string(), v.null()),
    noteContent: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found.");
    }
    if (session.status !== "scheduled") {
      throw new Error("Only scheduled sessions can be completed.");
    }

    const now = Date.now();
    await ctx.db.patch(args.sessionId, {
      status: "done",
      note: appendSessionAudit(
        session.note,
        `Completed at ${new Date(now).toISOString()}.`,
      ),
      updatedAt: now,
    });

    const title = normalizeOptionalText(args.noteTitle);
    const content = normalizeOptionalText(args.noteContent);
    if (title || content) {
      await ctx.db.insert("studentNotes", {
        studentId: session.studentId,
        sessionId: session._id,
        type: "session",
        title,
        content: content ?? title ?? "Session completed.",
        createdAt: now,
        updatedAt: now,
      });
    }

    return args.sessionId;
  },
});

export const cancelSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    reason: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found.");
    }
    if (session.status !== "scheduled") {
      throw new Error("Only scheduled sessions can be canceled.");
    }

    const now = Date.now();
    const reason = normalizeOptionalText(args.reason);
    const auditLine = `Canceled at ${new Date(now).toISOString()}${
      reason ? `. Reason: ${reason}` : "."
    }`;
    await ctx.db.patch(args.sessionId, {
      status: "canceled",
      note: appendSessionAudit(session.note, auditLine),
      updatedAt: now,
    });

    return args.sessionId;
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

    if (session.status !== "scheduled") {
      throw new Error("Only scheduled sessions can be postponed.");
    }
    if (args.startAt === session.startAt) {
      throw new Error("Choose a different date or time for the replacement session.");
    }

    const endAt = validateSessionWindow(args.startAt, args.durationMinutes);
    await ensureSessionSlotIsAvailable(ctx, args.startAt, endAt, args.sessionId);

    const now = Date.now();
    const reason = normalizeOptionalText(args.note);
    const auditLine = `Postponed at ${new Date(now).toISOString()} from ${new Date(
      session.startAt,
    ).toISOString()} to ${new Date(args.startAt).toISOString()}${
      reason ? `. Reason: ${reason}` : "."
    }`;
    const auditedNote = appendSessionAudit(session.note, auditLine);
    await ctx.db.patch(args.sessionId, {
      status: "postponed",
      note: auditedNote,
      updatedAt: now,
    });

    return await ctx.db.insert("sessions", {
      studentId: session.studentId,
      studentName: session.studentName,
      startAt: args.startAt,
      endAt,
      durationMinutes: args.durationMinutes,
      status: "scheduled",
      note: auditedNote,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    studentId: v.id("students"),
    startAt: v.number(),
    durationMinutes: v.number(),
    note: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found.");
    }

    if (session.status !== "scheduled") {
      throw new Error("Only scheduled sessions can be edited.");
    }

    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found.");
    }

    if (String(session.studentId) !== String(args.studentId)) {
      const notes = await ctx.db.query("studentNotes").collect();
      const linkedNote = notes.find(
        (note) =>
          note.sessionId && String(note.sessionId) === String(args.sessionId),
      );
      if (linkedNote) {
        throw new Error(
          "This session has linked notes. Delete or move those notes before changing the student.",
        );
      }
    }

    const endAt = validateSessionWindow(args.startAt, args.durationMinutes);
    await ensureSessionSlotIsAvailable(ctx, args.startAt, endAt, args.sessionId);

    await ctx.db.patch(args.sessionId, {
      studentId: student._id,
      studentName: student.name,
      startAt: args.startAt,
      endAt,
      durationMinutes: args.durationMinutes,
      note: args.note,
      updatedAt: Date.now(),
    });

    return args.sessionId;
  },
});

export const deleteSession = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found.");
    }

    if (session.status !== "scheduled") {
      throw new Error("Only scheduled sessions can be removed.");
    }

    const notes = await ctx.db.query("studentNotes").collect();
    const linkedNote = notes.find(
      (note) =>
        note.sessionId && String(note.sessionId) === String(args.sessionId),
    );
    if (linkedNote) {
      throw new Error(
        "This session has linked notes and cannot be permanently deleted. Cancel it to preserve the history, or delete the linked notes first.",
      );
    }

    await ctx.db.delete(args.sessionId);
    return args.sessionId;
  },
});
