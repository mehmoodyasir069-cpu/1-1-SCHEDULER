import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../convex/_generated/dataModel";
import { api } from "../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  addMonths,
  buildMonthGrid,
  formatCurrency,
  formatDateOnly,
  formatDateTime,
  formatMonthYear,
  isSameMonth,
  localDateKey,
  parseLocalDateTime,
  parseSessionDuration,
  startOfMonth,
  totalCourseFee,
} from "@/lib/crm-data";

type ViewKey =
  | "dashboard"
  | "students"
  | "schedule"
  | "session-log"
  | "fees"
  | "backup";

type StudentDoc = {
  _id: Id<"students">;
  order: number;
  name: string;
  initials: string;
  active: boolean;
  introDone: boolean;
  sessionGoal: number;
  note: string;
  createdAt: number;
  leadSource?: string;
  leadSourceOther?: string;
  currentState?: string;
  goals?: string;
  investmentBudget?: string;
  futurePlans?: string;
  experienceLevel?: string;
  problemsWeaknesses?: string;
  importantReminders?: string;
  updatedAt?: number;
};

type SessionDoc = {
  _id: Id<"sessions">;
  studentId: Id<"students">;
  studentName: string;
  startAt: number;
  endAt: number;
  durationMinutes: number;
  status: "scheduled" | "done" | "postponed" | "canceled";
  note: string | null;
  createdAt: number;
  updatedAt: number;
};

type StudentNoteDoc = {
  _id: Id<"studentNotes">;
  studentId: Id<"students">;
  sessionId?: Id<"sessions">;
  type: "general" | "session";
  title: string | null;
  content: string;
  createdAt: number;
  updatedAt: number;
};

type FeeDoc = {
  _id: Id<"fees">;
  studentId: Id<"students">;
  studentOrder: number;
  studentName: string;
  totalFee: number;
  amountPaid: number;
  amountDue: number;
  lastPaymentOn: string | null;
  nextDueOn: string | null;
  note: string | null;
  createdAt: number;
  updatedAt: number;
};

type SessionDraft = {
  studentId: string;
  date: string;
  time: string;
  durationMinutes: string;
  note: string;
};

type StudentRow = {
  student: StudentDoc;
  fee?: FeeDoc;
  doneSessions: number;
  upcomingSessions: SessionDoc[];
  noteCount: number;
  generalNoteCount: number;
  sessionNoteCount: number;
  progressPercent: number;
  remainingSessions: number;
  statusLabel: string;
  statusTone: "green" | "amber";
};

type StudentProfileDraft = {
  name: string;
  leadSource: string;
  leadSourceOther: string;
  currentState: string;
  goals: string;
  investmentBudget: string;
  futurePlans: string;
  experienceLevel: string;
  problemsWeaknesses: string;
  importantReminders: string;
  note: string;
};

type StudentNoteDraft = {
  noteId: Id<"studentNotes"> | "";
  studentId: Id<"students"> | "";
  sessionId: Id<"sessions"> | "";
  type: "general" | "session";
  title: string;
  content: string;
};

type SessionCompletionDraft = {
  title: string;
  content: string;
};

const navItems: Array<{
  key: ViewKey;
  label: string;
  hint: string;
}> = [
  { key: "dashboard", label: "Dashboard", hint: "Overview" },
  { key: "students", label: "Students", hint: "Profiles" },
  { key: "schedule", label: "Schedule", hint: "Calendar" },
  { key: "session-log", label: "Session Log", hint: "Status" },
  { key: "fees", label: "Fees Tracker", hint: "Payments" },
  { key: "backup", label: "Data Backup", hint: "Safeguard" },
];

const fieldClass =
  "flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-slate-400 focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20";

const selectFieldClass = cn(fieldClass, "bg-slate-950/90 text-slate-100");
const darkControlStyle = { colorScheme: "dark" as const };

const leadSourceOptions = [
  "Facebook Ad",
  "Facebook Group",
  "YouTube",
  "TikTok",
  "Instagram",
  "WhatsApp Referral",
  "Personal Referral",
  "Existing Student Referral",
  "Website",
  "Organic / Direct",
  "Other",
] as const;

const leadSourceFilterOptions = [
  "All Lead Sources",
  ...leadSourceOptions,
  "Referral",
] as const;

function normalizeLeadSource(value?: string | null) {
  return value?.trim() ?? "";
}

function displayLeadSource(student: Pick<StudentDoc, "leadSource" | "leadSourceOther">) {
  const source = normalizeLeadSource(student.leadSource);
  if (!source) return "Not recorded";
  if (source === "Other") {
    const other = normalizeLeadSource(student.leadSourceOther);
    return other ? `Other: ${other}` : "Other";
  }
  return source;
}

function leadSourceTone(source: string) {
  const normalized = normalizeLeadSource(source);
  if (normalized === "Referral") return "emerald";
  if (normalized.startsWith("Other:")) return "purple";
  if (
    normalized === "Facebook Ad" ||
    normalized === "Facebook Group"
  ) {
    return "blue";
  }
  if (normalized === "YouTube") return "red";
  if (normalized === "TikTok") return "slate";
  if (normalized === "Instagram") return "pink";
  if (
    normalized === "WhatsApp Referral" ||
    normalized === "Personal Referral" ||
    normalized === "Existing Student Referral"
  ) {
    return "emerald";
  }
  if (normalized === "Website") return "amber";
  if (normalized === "Organic / Direct") return "slate";
  if (normalized === "Other") return "purple";
  return "slate";
}

function leadSourceBadgeClass(source: string) {
  const tone = leadSourceTone(source);
  return {
    blue: "border-sky-400/20 bg-sky-500/10 text-sky-100",
    red: "border-rose-400/20 bg-rose-500/10 text-rose-100",
    slate: "border-slate-400/20 bg-slate-500/10 text-slate-100",
    pink: "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-100",
    emerald: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
    amber: "border-amber-400/20 bg-amber-500/10 text-amber-100",
    purple: "border-purple-400/20 bg-purple-500/10 text-purple-100",
  }[tone];
}

function leadSourceMatchesFilter(student: StudentDoc, filter: string) {
  const source = normalizeLeadSource(student.leadSource);
  if (filter === "All Lead Sources") return true;
  if (filter === "Referral") {
    return (
      source === "WhatsApp Referral" ||
      source === "Personal Referral" ||
      source === "Existing Student Referral"
    );
  }
  if (filter === "Other") return source === "Other";
  return source === filter;
}

function leadSourceSummaryLabel(student: StudentDoc) {
  const source = normalizeLeadSource(student.leadSource);
  if (!source) return "Not recorded";
  if (source === "Other") {
    const other = normalizeLeadSource(student.leadSourceOther);
    return other ? `Other: ${other}` : "Other";
  }
  if (
    source === "WhatsApp Referral" ||
    source === "Personal Referral" ||
    source === "Existing Student Referral"
  ) {
    return "Referral";
  }
  return source;
}

function createSessionDraft(overrides: Partial<SessionDraft> = {}): SessionDraft {
  return {
    studentId: "",
    date: localDateKey(Date.now()),
    time: "19:00",
    durationMinutes: "60",
    note: "",
    ...overrides,
  };
}

export default function App() {
  const [activeView, setActiveView] = useState<ViewKey>("dashboard");
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clockTick, setClockTick] = useState(() => Date.now());
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(new Date()),
  );

  const students = useQuery(api.crm.listStudents) as StudentDoc[] | undefined;
  const sessions = useQuery(api.crm.listSessions) as SessionDoc[] | undefined;
  const studentNotes = useQuery(api.crm.listStudentNotes) as
    | StudentNoteDoc[]
    | undefined;
  const fees = useQuery(api.crm.listFees) as FeeDoc[] | undefined;

  const ensureSeedData = useMutation(api.crm.ensureSeedData);
  const addStudent = useMutation(api.crm.addStudent);
  const saveStudentProfile = useMutation(api.crm.saveStudentProfile);
  const saveFeeAccount = useMutation(api.crm.saveFeeAccount);
  const scheduleSession = useMutation(api.crm.scheduleSession);
  const updateSession = useMutation(api.crm.updateSession);
  const deleteSession = useMutation(api.crm.deleteSession);
  const completeSession = useMutation(api.crm.completeSession);
  const cancelSession = useMutation(api.crm.cancelSession);
  const postponeSession = useMutation(api.crm.postponeSession);
  const addStudentNote = useMutation(api.crm.addStudentNote);
  const updateStudentNote = useMutation(api.crm.updateStudentNote);
  const deleteStudentNote = useMutation(api.crm.deleteStudentNote);

  const seededRef = useRef(false);
  const [selectedStudentId, setSelectedStudentId] = useState<
    Id<"students"> | ""
  >("");
  const [selectedFeeStudentId, setSelectedFeeStudentId] = useState<
    Id<"students"> | ""
  >("");
  const [selectedSessionId, setSelectedSessionId] = useState<
    Id<"sessions"> | ""
  >("");
  const [detailSessionId, setDetailSessionId] = useState<Id<"sessions"> | "">("");
  const [editingSessionId, setEditingSessionId] = useState<Id<"sessions"> | "">("");
  const [studentProfileOpen, setStudentProfileOpen] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileDraft, setProfileDraft] = useState<StudentProfileDraft>({
    name: "",
    leadSource: "",
    leadSourceOther: "",
    currentState: "",
    goals: "",
    investmentBudget: "",
    futurePlans: "",
    experienceLevel: "",
    problemsWeaknesses: "",
    importantReminders: "",
    note: "",
  });
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);
  const [noteEditorSubmitting, setNoteEditorSubmitting] = useState(false);
  const [noteEditorDraft, setNoteEditorDraft] = useState<StudentNoteDraft>({
    noteId: "",
    studentId: "",
    sessionId: "",
    type: "general",
    title: "",
    content: "",
  });
  const [sessionCompletionOpen, setSessionCompletionOpen] = useState(false);
  const [sessionCompletionSubmitting, setSessionCompletionSubmitting] =
    useState(false);
  const [sessionCompletionDraft, setSessionCompletionDraft] =
    useState<SessionCompletionDraft>({
      title: "",
      content: "",
    });
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [feeEditorOpen, setFeeEditorOpen] = useState(false);
  const [editSessionOpen, setEditSessionOpen] = useState(false);
  const [postponeOpen, setPostponeOpen] = useState(false);
  const [postponeSessionId, setPostponeSessionId] = useState<
    Id<"sessions"> | ""
  >("");
  const [cancelSessionOpen, setCancelSessionOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [sessionDetailsOpen, setSessionDetailsOpen] = useState(false);
  const [sessionActionSubmitting, setSessionActionSubmitting] = useState(false);
  const sessionActionInFlightRef = useRef(false);

  const [studentDraft, setStudentDraft] = useState({
    name: "",
    leadSource: "Organic / Direct",
    leadSourceOther: "",
    sessionGoal: "12",
    totalFee: String(totalCourseFee),
    amountPaid: String(totalCourseFee),
    amountDue: "0",
    lastPaymentOn: "",
    nextDueOn: "",
    note: "",
  });

  const [sessionDraft, setSessionDraft] = useState<SessionDraft>(createSessionDraft());

  const [editSessionDraft, setEditSessionDraft] = useState<SessionDraft>(
    createSessionDraft(),
  );

  const [feeDraft, setFeeDraft] = useState({
    totalFee: String(totalCourseFee),
    amountPaid: "0",
    amountDue: "0",
    lastPaymentOn: "",
    nextDueOn: "",
    note: "",
  });

  const [postponeDraft, setPostponeDraft] = useState<SessionDraft>(
    createSessionDraft(),
  );
  const [studentSearch, setStudentSearch] = useState("");
  const [leadSourceFilter, setLeadSourceFilter] = useState("All Lead Sources");

  useEffect(() => {
    const timer = window.setInterval(() => setClockTick(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV || seededRef.current) return;
    if (students && students.length === 0) {
      seededRef.current = true;
      ensureSeedData()
        .then(() => setNotice("Seeded the CRM with the current student set."))
        .catch((error: unknown) => {
          const message =
            error instanceof Error ? error.message : "Could not seed data.";
          setErrorMessage(message);
        });
    }
  }, [students, ensureSeedData]);

  useEffect(() => {
    if (students && students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0]._id);
      setSessionDraft((draft) => ({ ...draft, studentId: String(students[0]._id) }));
    }
  }, [students, selectedStudentId]);

  useEffect(() => {
    if (!sessionDraft.studentId && students && students.length > 0) {
      setSessionDraft((draft) => ({ ...draft, studentId: String(students[0]._id) }));
    }
  }, [students, sessionDraft.studentId]);

  const feesByStudentId = useMemo(() => {
    return new Map((fees ?? []).map((fee) => [fee.studentId, fee]));
  }, [fees]);

  const sessionsByStudentId = useMemo(() => {
    const map = new Map<Id<"students">, SessionDoc[]>();
    for (const session of sessions ?? []) {
      const existing = map.get(session.studentId) ?? [];
      existing.push(session);
      map.set(session.studentId, existing);
    }
    return map;
  }, [sessions]);

  const sessionsById = useMemo(() => {
    return new Map((sessions ?? []).map((session) => [session._id, session]));
  }, [sessions]);

  const notesByStudentId = useMemo(() => {
    const map = new Map<Id<"students">, StudentNoteDoc[]>();
    for (const note of studentNotes ?? []) {
      const existing = map.get(note.studentId) ?? [];
      existing.push(note);
      map.set(note.studentId, existing);
    }

    for (const [studentId, notes] of map.entries()) {
      notes.sort((left, right) => {
        if (right.createdAt !== left.createdAt) {
          return right.createdAt - left.createdAt;
        }
        return right.updatedAt - left.updatedAt;
      });
      map.set(studentId, notes);
    }

    return map;
  }, [studentNotes]);

  const studentById = useMemo(() => {
    return new Map((students ?? []).map((student) => [student._id, student]));
  }, [students]);

  const studentRows: StudentRow[] = useMemo(() => {
    return (students ?? []).map((student) => {
      const studentSessions = sessionsByStudentId.get(student._id) ?? [];
      const studentNotesForRow = notesByStudentId.get(student._id) ?? [];
      const generalNoteCount = studentNotesForRow.filter(
        (note) => note.type === "general",
      ).length;
      const sessionNoteCount = studentNotesForRow.filter(
        (note) => note.type === "session",
      ).length;
      const fee = feesByStudentId.get(student._id);
      const doneSessions = studentSessions.filter(
        (session) => session.status === "done",
      ).length;
      const upcomingSessions = studentSessions
        .filter((session) => session.status === "scheduled" && session.startAt >= clockTick)
        .sort((left, right) => left.startAt - right.startAt);
      const remainingSessions = Math.max(student.sessionGoal - doneSessions, 0);
      const progressPercent =
        student.sessionGoal === 0
          ? 0
          : Math.min((doneSessions / student.sessionGoal) * 100, 100);

      return {
        student,
        fee,
        doneSessions,
        upcomingSessions,
        remainingSessions,
        progressPercent,
        noteCount: studentNotesForRow.length,
        generalNoteCount,
        sessionNoteCount,
        statusLabel: upcomingSessions.length > 0 ? "On track" : "No Slots Yet",
        statusTone: upcomingSessions.length > 0 ? "green" : "amber",
      };
    });
  }, [students, sessionsByStudentId, feesByStudentId, notesByStudentId, clockTick]);

  const filteredStudentRows = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    return studentRows.filter((row) => {
      const matchesSearch =
        !query ||
        row.student.name.toLowerCase().includes(query) ||
        row.student.order.toString().includes(query) ||
        displayLeadSource(row.student).toLowerCase().includes(query) ||
        normalizeLeadSource(row.student.leadSourceOther).toLowerCase().includes(query) ||
        (row.student.note ?? "").toLowerCase().includes(query);
      return matchesSearch && leadSourceMatchesFilter(row.student, leadSourceFilter);
    });
  }, [studentRows, studentSearch, leadSourceFilter]);

  const leadSourceSummary = useMemo(() => {
    const counts = new Map<string, number>();
    for (const student of students ?? []) {
      const label = leadSourceSummaryLabel(student);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([label, count]) => ({
        label,
        count,
        tone: leadSourceTone(label),
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 6);
  }, [students]);

  const scheduledSessions = useMemo(() => {
    return (sessions ?? [])
      .filter((session) => session.status === "scheduled")
      .sort((left, right) => left.startAt - right.startAt);
  }, [sessions]);

  const upcomingScheduledSessions = useMemo(() => {
    return scheduledSessions.filter((session) => session.startAt >= clockTick);
  }, [scheduledSessions, clockTick]);

  const sessionsThisWeekDone = useMemo(() => {
    const today = new Date(clockTick);
    const dayOffset = (today.getDay() + 6) % 7;
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - dayOffset);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return (sessions ?? []).filter((session) => {
      return (
        session.status === "done" &&
        session.startAt >= start.getTime() &&
        session.startAt < end.getTime()
      );
    }).length;
  }, [sessions, clockTick]);

  const conflicts = useMemo(() => {
    let conflictCount = 0;
    for (let i = 0; i < scheduledSessions.length; i += 1) {
      for (let j = i + 1; j < scheduledSessions.length; j += 1) {
        const left = scheduledSessions[i];
        const right = scheduledSessions[j];
        if (left.startAt < right.endAt && right.startAt < left.endAt) {
          conflictCount += 1;
        }
      }
    }
    return conflictCount;
  }, [scheduledSessions]);

  const feesOutstanding = useMemo(() => {
    return (fees ?? []).reduce((sum, fee) => sum + fee.amountDue, 0);
  }, [fees]);

  const dueStudents = useMemo(() => {
    return (fees ?? [])
      .filter((fee) => fee.amountDue > 0)
      .sort((left, right) => {
        const leftDue = left.nextDueOn ?? "9999-12-31";
        const rightDue = right.nextDueOn ?? "9999-12-31";
        return leftDue.localeCompare(rightDue);
      });
  }, [fees]);

  const upcomingDueSoon = useMemo(() => {
    const windowEnd = new Date(clockTick);
    windowEnd.setDate(windowEnd.getDate() + 31);
    return dueStudents.filter((fee) => {
      if (!fee.nextDueOn) return false;
      const dueDate = new Date(`${fee.nextDueOn}T12:00:00`);
      return dueDate.getTime() <= windowEnd.getTime();
    });
  }, [dueStudents, clockTick]);

  const totalStudents = students?.length ?? 0;
  const activeStudents = useMemo(() => {
    return (students ?? []).filter((student) => student.active).length;
  }, [students]);
  const introsDone = useMemo(() => {
    return (students ?? []).filter((student) => student.introDone).length;
  }, [students]);
  const unscheduledStudents = useMemo(() => {
    return studentRows.filter((row) => row.upcomingSessions.length === 0).length;
  }, [studentRows]);

  const monthGrid = useMemo(() => buildMonthGrid(calendarMonth), [calendarMonth]);
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, SessionDoc[]>();
    for (const session of scheduledSessions) {
      const key = localDateKey(session.startAt);
      const list = map.get(key) ?? [];
      list.push(session);
      map.set(key, list);
    }
    return map;
  }, [scheduledSessions]);

  const backupSnapshot = useMemo(() => {
    return {
      exportedAt: new Date(clockTick).toISOString(),
      students: students ?? [],
      sessions: sessions ?? [],
      studentNotes: studentNotes ?? [],
      fees: fees ?? [],
    };
  }, [students, sessions, studentNotes, fees, clockTick]);

  const selectedFee = useMemo(() => {
    return (fees ?? []).find(
      (fee) => String(fee.studentId) === String(selectedFeeStudentId),
    );
  }, [fees, selectedFeeStudentId]);

  const selectedSession = useMemo(() => {
    return (sessions ?? []).find(
      (session) => String(session._id) === String(selectedSessionId),
    );
  }, [sessions, selectedSessionId]);

  const detailSession = useMemo(() => {
    return (sessions ?? []).find(
      (session) => String(session._id) === String(detailSessionId),
    );
  }, [sessions, detailSessionId]);

  const detailSessionNotes = useMemo(() => {
    if (!detailSessionId) return [];
    return (studentNotes ?? []).filter(
      (note) =>
        note.sessionId && String(note.sessionId) === String(detailSessionId),
    );
  }, [studentNotes, detailSessionId]);

  const selectedStudent = useMemo(() => {
    return studentById.get(selectedStudentId as Id<"students">);
  }, [studentById, selectedStudentId]);

  useEffect(() => {
    if (selectedFee) {
      setFeeDraft({
        totalFee: String(selectedFee.totalFee ?? totalCourseFee),
        amountPaid: String(selectedFee.amountPaid),
        amountDue: String(selectedFee.amountDue),
        lastPaymentOn: selectedFee.lastPaymentOn ?? "",
        nextDueOn: selectedFee.nextDueOn ?? "",
        note: selectedFee.note ?? "",
      });
    }
  }, [selectedFee]);

  useEffect(() => {
    if (!selectedStudent) return;
    setProfileDraft({
      name: selectedStudent.name,
      leadSource: normalizeLeadSource(selectedStudent.leadSource) || "Organic / Direct",
      leadSourceOther: selectedStudent.leadSourceOther ?? "",
      currentState: selectedStudent.currentState ?? "",
      goals: selectedStudent.goals ?? "",
      investmentBudget: selectedStudent.investmentBudget ?? "",
      futurePlans: selectedStudent.futurePlans ?? "",
      experienceLevel: selectedStudent.experienceLevel ?? "",
      problemsWeaknesses: selectedStudent.problemsWeaknesses ?? "",
      importantReminders: selectedStudent.importantReminders ?? "",
      note: selectedStudent.note ?? "",
    });
  }, [selectedStudent]);

  useEffect(() => {
    if (!studentProfileOpen) {
      setProfileEditing(false);
    }
  }, [studentProfileOpen]);

  useEffect(() => {
    if (!noteEditorOpen) {
      return;
    }
    if (!noteEditorDraft.studentId && selectedStudentId) {
      setNoteEditorDraft((draft) => ({
        ...draft,
        studentId: selectedStudentId,
      }));
    }
  }, [noteEditorOpen, noteEditorDraft.studentId, selectedStudentId]);

  const openAddStudent = () => {
    setStudentDraft({
      name: "",
      leadSource: "Organic / Direct",
      leadSourceOther: "",
      sessionGoal: "12",
      totalFee: String(totalCourseFee),
      amountPaid: String(totalCourseFee),
      amountDue: "0",
      lastPaymentOn: "",
      nextDueOn: "",
      note: "",
    });
    setAddStudentOpen(true);
  };

  const openAddSession = (studentId?: Id<"students">) => {
    const fallback = studentId ?? students?.[0]?._id;
    if (fallback) {
      setSessionDraft((draft) => ({
        ...draft,
        studentId: String(fallback),
        date: localDateKey(Date.now()),
        time: "19:00",
        durationMinutes: "60",
        note: "",
      }));
    }
    setActiveView("schedule");
  };

  const openFeeEditor = (studentId: Id<"students">) => {
    setSelectedFeeStudentId(studentId);
    setFeeEditorOpen(true);
  };

  const openEditSession = (session: SessionDoc) => {
    if (session.status !== "scheduled") {
      showError("Archived sessions are read-only.");
      return;
    }
    setEditingSessionId(session._id);
    setEditSessionDraft({
      studentId: String(session.studentId),
      date: toDateInputValue(session.startAt),
      time: toTimeInputValue(session.startAt),
      durationMinutes: String(session.durationMinutes),
      note: session.note ?? "",
    });
    setEditSessionOpen(true);
  };

  const closeEditSession = () => {
    setEditSessionOpen(false);
    setEditingSessionId("");
  };

  const openPostponeDialog = (sessionId: Id<"sessions">) => {
    const session = sessionsById.get(sessionId);
    if (!session || session.status !== "scheduled") {
      showError("Only scheduled sessions can be postponed.");
      return;
    }
    const replacementDate = new Date(session.startAt);
    replacementDate.setDate(replacementDate.getDate() + 7);
    setPostponeSessionId(sessionId);
    setPostponeDraft({
      studentId: String(session.studentId),
      date: toDateInputValue(replacementDate.getTime()),
      time: toTimeInputValue(session.startAt),
      durationMinutes: String(session.durationMinutes),
      note: "",
    });
    setPostponeOpen(true);
  };

  const closePostponeDialog = () => {
    setPostponeOpen(false);
    setPostponeSessionId("");
    setPostponeDraft(createSessionDraft());
  };

  const openSessionDetails = (sessionId: Id<"sessions">) => {
    setDetailSessionId(sessionId);
    setSessionDetailsOpen(true);
  };

  const openCancelSessionDialog = (sessionId: Id<"sessions">) => {
    const session = sessionsById.get(sessionId);
    if (!session || session.status !== "scheduled") {
      showError("Only scheduled sessions can be canceled.");
      return;
    }
    setSelectedSessionId(sessionId);
    setCancelReason("");
    setCancelSessionOpen(true);
  };

  const openStudentProfile = (studentId: Id<"students">) => {
    setSelectedStudentId(studentId);
    setStudentProfileOpen(true);
  };

  const closeStudentProfile = () => {
    setStudentProfileOpen(false);
    setProfileEditing(false);
    setNoteEditorOpen(false);
    setNoteEditorSubmitting(false);
  };

  const openAddGeneralNote = (studentId: Id<"students">) => {
    setNoteEditorDraft({
      noteId: "",
      studentId,
      sessionId: "",
      type: "general",
      title: "",
      content: "",
    });
    setNoteEditorOpen(true);
  };

  const openAddSessionNote = (
    studentId: Id<"students">,
    sessionId?: Id<"sessions">,
  ) => {
    const studentSessions = sessionsByStudentId.get(studentId) ?? [];
    const fallbackSessionId =
      sessionId ??
      studentSessions.slice().sort((left, right) => right.startAt - left.startAt)[0]?._id ??
      "";
    setNoteEditorDraft({
      noteId: "",
      studentId,
      sessionId: fallbackSessionId,
      type: "session",
      title: "",
      content: "",
    });
    setNoteEditorOpen(true);
  };

  const openEditStudentNote = (note: StudentNoteDoc) => {
    setNoteEditorDraft({
      noteId: note._id,
      studentId: note.studentId,
      sessionId: note.sessionId ?? "",
      type: note.type,
      title: note.title ?? "",
      content: note.content,
    });
    setNoteEditorOpen(true);
  };

  const closeNoteEditor = () => {
    setNoteEditorOpen(false);
    setNoteEditorSubmitting(false);
  };

  const openSessionCompletionDialog = (sessionId: Id<"sessions">) => {
    const session = sessionsById.get(sessionId);
    if (!session || session.status !== "scheduled") {
      showError("Only scheduled sessions can be completed.");
      return;
    }

    setSelectedSessionId(sessionId);
    setSessionCompletionDraft({
      title: `Session note for ${session.studentName}`,
      content: "",
    });
    setSessionCompletionOpen(true);
  };

  const closeSessionCompletionDialog = () => {
    setSessionCompletionOpen(false);
    setSessionCompletionSubmitting(false);
  };

  const showSuccess = (message: string) => {
    setErrorMessage(null);
    setNotice(message);
    window.setTimeout(() => setNotice(null), 3500);
  };

  const showError = (message: string) => {
    setNotice(null);
    setErrorMessage(message);
    window.setTimeout(() => setErrorMessage(null), 4500);
  };

  const beginSessionAction = () => {
    if (sessionActionInFlightRef.current) return false;
    sessionActionInFlightRef.current = true;
    setSessionActionSubmitting(true);
    return true;
  };

  const finishSessionAction = () => {
    sessionActionInFlightRef.current = false;
    setSessionActionSubmitting(false);
  };

  const handleSaveProfile = async () => {
    if (!selectedStudent) return;
    try {
      const name = profileDraft.name.trim();
      if (!name) {
        throw new Error("Student name is required.");
      }

      await saveStudentProfile({
        studentId: selectedStudent._id,
        name,
        leadSource: profileDraft.leadSource,
        leadSourceOther: profileDraft.leadSource === "Other" ? profileDraft.leadSourceOther : "",
        currentState: profileDraft.currentState.trim(),
        goals: profileDraft.goals.trim(),
        investmentBudget: profileDraft.investmentBudget.trim(),
        futurePlans: profileDraft.futurePlans.trim(),
        experienceLevel: profileDraft.experienceLevel.trim(),
        problemsWeaknesses: profileDraft.problemsWeaknesses.trim(),
        importantReminders: profileDraft.importantReminders.trim(),
        note: profileDraft.note.trim(),
      });
      setProfileEditing(false);
      showSuccess(`Saved profile for ${name}.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save profile.";
      showError(message);
    }
  };

  const handleSaveStudentNote = async () => {
    if (!noteEditorDraft.studentId) {
      showError("Choose a student before saving the note.");
      return;
    }
    if (noteEditorDraft.type === "session" && !noteEditorDraft.sessionId) {
      showError("Choose a session before saving a session note.");
      return;
    }

    try {
      setNoteEditorSubmitting(true);
      const payload = {
        studentId: noteEditorDraft.studentId,
        sessionId: noteEditorDraft.sessionId
          ? noteEditorDraft.sessionId
          : null,
        type: noteEditorDraft.type,
        title: noteEditorDraft.title.trim() || null,
        content: noteEditorDraft.content.trim(),
      };

      if (noteEditorDraft.noteId) {
        await updateStudentNote({
          noteId: noteEditorDraft.noteId,
          ...payload,
        });
        showSuccess("Note updated.");
      } else {
        await addStudentNote(payload);
        showSuccess("Note saved.");
      }

      closeNoteEditor();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save note.";
      showError(message);
      setNoteEditorSubmitting(false);
    }
  };

  const handleDeleteStudentNote = async (noteId: Id<"studentNotes">) => {
    try {
      const confirmed = window.confirm("Delete this note?");
      if (!confirmed) return;
      await deleteStudentNote({ noteId });
      if (String(noteEditorDraft.noteId) === String(noteId)) {
        closeNoteEditor();
      }
      showSuccess("Note deleted.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not delete note.";
      showError(message);
    }
  };

  const handleSaveSessionCompletion = async () => {
    if (!selectedSessionId) return;
    const session = sessionsById.get(selectedSessionId);
    if (!session) {
      showError("Session not found.");
      return;
    }
    if (!beginSessionAction()) return;

    try {
      setSessionCompletionSubmitting(true);
      await completeSession({
        sessionId: session._id,
        noteTitle: sessionCompletionDraft.title.trim() || null,
        noteContent: sessionCompletionDraft.content.trim() || null,
      });

      closeSessionCompletionDialog();
      showSuccess("Session marked done.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not finish session.";
      showError(message);
    } finally {
      setSessionCompletionSubmitting(false);
      finishSessionAction();
    }
  };

  const handleAddStudent = async () => {
    try {
      const name = studentDraft.name.trim();
      if (!name) {
        throw new Error("Add a student name first.");
      }

      await addStudent({
        name,
        sessionGoal: Number(studentDraft.sessionGoal || 12),
        totalFee: Number(studentDraft.totalFee || totalCourseFee),
        amountPaid: Number(studentDraft.amountPaid || 0),
        amountDue: Number(studentDraft.amountDue || 0),
        lastPaymentOn: studentDraft.lastPaymentOn.trim() || null,
        nextDueOn: studentDraft.nextDueOn.trim() || null,
        note: studentDraft.note.trim() || null,
        leadSource: studentDraft.leadSource,
        leadSourceOther: studentDraft.leadSource === "Other" ? studentDraft.leadSourceOther : "",
      });
      setAddStudentOpen(false);
      showSuccess(`Added ${name} to the CRM.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not add student.";
      showError(message);
    }
  };

  const handleSaveFee = async () => {
    if (!selectedFeeStudentId) return;
    try {
      const fee = selectedFee;
      if (!fee) {
        throw new Error("No fee record is selected.");
      }
      await saveFeeAccount({
        studentId: selectedFeeStudentId,
        totalFee: Number(feeDraft.totalFee || totalCourseFee),
        amountPaid: Number(feeDraft.amountPaid || 0),
        amountDue: Number(feeDraft.amountDue || 0),
        lastPaymentOn: feeDraft.lastPaymentOn.trim() || null,
        nextDueOn: feeDraft.nextDueOn.trim() || null,
        note: feeDraft.note.trim() || null,
      });
      setFeeEditorOpen(false);
      showSuccess(`Updated fee record for ${fee.studentName}.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save fee record.";
      showError(message);
    }
  };

  const handleScheduleSession = async () => {
    if (!beginSessionAction()) return;
    try {
      if (!sessionDraft.studentId) {
        throw new Error("Choose a student before scheduling.");
      }
      const startAt = parseLocalDateTime(sessionDraft.date, sessionDraft.time);
      const durationMinutes = parseSessionDuration(sessionDraft.durationMinutes);
      await scheduleSession({
        studentId: sessionDraft.studentId as Id<"students">,
        startAt,
        durationMinutes,
        note: sessionDraft.note.trim() || null,
      });
      showSuccess("Scheduled a session without any clashes.");
      setSessionDraft((draft) => ({
        ...draft,
        date: localDateKey(Date.now()),
        time: "19:00",
        note: "",
      }));
      setActiveView("schedule");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not schedule session.";
      showError(message);
    } finally {
      finishSessionAction();
    }
  };

  const handleUpdateSession = async () => {
    if (!beginSessionAction()) return;
    try {
      if (!editingSessionId) {
        throw new Error("Choose a session to edit first.");
      }
      if (!editSessionDraft.studentId) {
        throw new Error("Choose a student before saving changes.");
      }
      const startAt = parseLocalDateTime(editSessionDraft.date, editSessionDraft.time);
      const durationMinutes = parseSessionDuration(editSessionDraft.durationMinutes);
      await updateSession({
        sessionId: editingSessionId,
        studentId: editSessionDraft.studentId as Id<"students">,
        startAt,
        durationMinutes,
        note: editSessionDraft.note.trim() || null,
      });
      closeEditSession();
      showSuccess("Session updated.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not update session.";
      showError(message);
    } finally {
      finishSessionAction();
    }
  };

  const handleDeleteSession = async (sessionId: Id<"sessions">) => {
    if (!beginSessionAction()) return;
    try {
      const session = (sessions ?? []).find((candidate) => candidate._id === sessionId);
      if (!session || session.status !== "scheduled") {
        throw new Error("Only scheduled sessions can be permanently deleted.");
      }
      const confirmed = window.confirm(
        `Permanently delete ${session.studentName}'s session? This cannot be undone. Cancellation is safer when you need to preserve history.`,
      );
      if (!confirmed) {
        return;
      }

      await deleteSession({ sessionId });

      if (String(editingSessionId) === String(sessionId)) {
        closeEditSession();
      }
      if (String(selectedSessionId) === String(sessionId)) {
        setSessionCompletionOpen(false);
        setCancelSessionOpen(false);
        setSelectedSessionId("");
      }
      if (String(postponeSessionId) === String(sessionId)) {
        closePostponeDialog();
      }
      if (String(noteEditorDraft.sessionId) === String(sessionId)) {
        closeNoteEditor();
      }
      if (String(detailSessionId) === String(sessionId)) {
        setSessionDetailsOpen(false);
        setDetailSessionId("");
      }

      showSuccess("Session removed from the calendar.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not delete session.";
      showError(message);
    } finally {
      finishSessionAction();
    }
  };

  const handleCancelSession = async () => {
    if (!selectedSessionId || !beginSessionAction()) return;
    try {
      await cancelSession({
        sessionId: selectedSessionId,
        reason: cancelReason.trim() || null,
      });
      setCancelSessionOpen(false);
      showSuccess("Session canceled and kept in history.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not cancel session.";
      showError(message);
    } finally {
      finishSessionAction();
    }
  };

  const handlePostponeSession = async () => {
    if (!postponeSessionId || !beginSessionAction()) return;
    try {
      const startAt = parseLocalDateTime(postponeDraft.date, postponeDraft.time);
      const durationMinutes = parseSessionDuration(postponeDraft.durationMinutes);
      await postponeSession({
        sessionId: postponeSessionId,
        startAt,
        durationMinutes,
        note: postponeDraft.note.trim() || null,
      });
      closePostponeDialog();
      showSuccess("Postponed the session and created the replacement slot.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not postpone session.";
      showError(message);
    } finally {
      finishSessionAction();
    }
  };

  const downloadBackup = () => {
    const blob = new Blob([JSON.stringify(backupSnapshot, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `elevate-crm-backup-${new Date(clockTick)
      .toISOString()
      .slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    showSuccess("Backup exported to a JSON file.");
  };

  const copyBackup = async () => {
    await navigator.clipboard.writeText(JSON.stringify(backupSnapshot, null, 2));
    showSuccess("Backup snapshot copied to clipboard.");
  };

  const currentViewTitle = navItems.find((item) => item.key === activeView)?.label ?? "Dashboard";

  return (
    <div className="flex min-h-screen text-foreground">
      <aside className="hidden w-[290px] flex-col border-r border-white/10 bg-slate-950/75 px-5 py-6 backdrop-blur-xl xl:flex">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 shadow-2xl shadow-black/20">
          <p className="text-xs uppercase tracking-[0.35em] text-orange-400/80">
            Elevate Commerce
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
            1-1 Mentorship CRM
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            Secure student tracking with sessions, fees, and backups in one place.
          </p>
        </div>

        <div className="mt-6 space-y-6">
          <SidebarSection
            title="Main"
            items={navItems.slice(0, 2)}
            activeView={activeView}
            onChange={setActiveView}
          />
          <SidebarSection
            title="Sessions"
            items={navItems.slice(2, 4)}
            activeView={activeView}
            onChange={setActiveView}
          />
          <SidebarSection
            title="Records"
            items={navItems.slice(4)}
            activeView={activeView}
            onChange={setActiveView}
          />
        </div>

        <div className="mt-auto rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <p className="font-medium">Data is live.</p>
          <p className="mt-1 text-emerald-100/80">
            Convex persists your changes. Export a backup anytime from the backup view.
          </p>
        </div>
      </aside>

      <main className="flex min-h-screen flex-1 flex-col">
        <header className="border-b border-white/10 bg-slate-950/50 px-5 py-4 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-orange-400/80">
                Elevate Commerce
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">
                {currentViewTitle}
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                {formatDateTime(clockTick)} · Convex-backed · isolated from your other projects
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-100">
                Secure DB connected
              </span>
              <Button variant="outline" onClick={() => setActiveView("backup")}>
                Backup
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setActiveView("schedule");
                  openAddSession();
                }}
              >
                + Add Session
              </Button>
              <Button onClick={openAddStudent}>+ Add Student</Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 xl:hidden">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveView(item.key)}
                className={cn(
                  "rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition",
                  activeView === item.key
                    ? "border-orange-400/40 bg-orange-400/15 text-orange-100"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-5 py-6">
          {notice ? (
            <AlertBar tone="success" message={notice} />
          ) : null}
          {errorMessage ? (
            <AlertBar tone="error" message={errorMessage} />
          ) : null}

          {(!students || !sessions || !fees) ? (
            <LoadingState />
          ) : (
            <>
              {activeView === "dashboard" ? (
                <DashboardView
                  totalStudents={totalStudents}
                  activeStudents={activeStudents}
                  introsDone={introsDone}
                  sessionsThisWeekDone={sessionsThisWeekDone}
                  conflicts={conflicts}
                  feesOutstanding={feesOutstanding}
                  dueStudents={dueStudents}
                  upcomingDueSoon={upcomingDueSoon}
                  studentRows={studentRows}
                  scheduledSessions={upcomingScheduledSessions}
                  leadSourceSummary={leadSourceSummary}
                  unscheduledStudents={unscheduledStudents}
                  onJump={setActiveView}
                  onAddSlot={openAddSession}
                />
              ) : null}

              {activeView === "students" ? (
                <StudentsView
                  studentRows={filteredStudentRows}
                  studentSearch={studentSearch}
                  leadSourceFilter={leadSourceFilter}
                  setStudentSearch={setStudentSearch}
                  setLeadSourceFilter={setLeadSourceFilter}
                  onAddSlot={openAddSession}
                  onAddStudent={openAddStudent}
                  onFocusStudent={(studentId) => {
                    openStudentProfile(studentId);
                  }}
                />
              ) : null}

              {activeView === "schedule" ? (
                <ScheduleView
                  students={students}
                  sessionDraft={sessionDraft}
                  setSessionDraft={setSessionDraft}
                  calendarMonth={calendarMonth}
                  setCalendarMonth={setCalendarMonth}
                  monthGrid={monthGrid}
                  sessionsByDate={sessionsByDate}
                  scheduledSessions={upcomingScheduledSessions}
                  onAddSession={() => void handleScheduleSession()}
                  onViewSession={openSessionDetails}
                  submitting={sessionActionSubmitting}
                />
              ) : null}

              {activeView === "session-log" ? (
                <SessionLogView
                  sessions={sessions}
                  studentRows={studentRows}
                  onViewSession={openSessionDetails}
                />
              ) : null}

              {activeView === "fees" ? (
                <FeesView
                  fees={fees}
                  studentRows={studentRows}
                  onOpenEditor={openFeeEditor}
                  onSaveFee={() => void handleSaveFee()}
                  selectedFeeStudentId={selectedFeeStudentId}
                  setSelectedFeeStudentId={setSelectedFeeStudentId}
                  totalOutstanding={feesOutstanding}
                />
              ) : null}

              {activeView === "backup" ? (
                <BackupView
                  backupSnapshot={backupSnapshot}
                  onDownload={downloadBackup}
                  onCopy={() => void copyBackup()}
                  studentCount={totalStudents}
                  sessionCount={sessions.length}
                  feeCount={fees.length}
                />
              ) : null}
            </>
          )}
        </section>
      </main>

      <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
        <DialogContent className="max-w-2xl border-white/10 bg-slate-950/95 text-foreground">
          <DialogHeader>
            <DialogTitle>Add student</DialogTitle>
            <DialogDescription>
              Add a new learner and seed their fee account in one step.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Student name">
              <Input
                className={fieldClass}
                value={studentDraft.name}
                onChange={(event) =>
                  setStudentDraft((draft) => ({ ...draft, name: event.target.value }))
                }
                placeholder="Enter full name"
              />
            </Field>
            <Field label="Lead source">
              <select
                className={selectFieldClass}
                style={darkControlStyle}
                value={studentDraft.leadSource}
                onChange={(event) =>
                  setStudentDraft((draft) => ({
                    ...draft,
                    leadSource: event.target.value,
                    leadSourceOther:
                      event.target.value === "Other" ? draft.leadSourceOther : "",
                  }))
                }
              >
                {leadSourceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            {studentDraft.leadSource === "Other" ? (
              <Field label="Other lead source">
                <Input
                  className={fieldClass}
                  value={studentDraft.leadSourceOther}
                  onChange={(event) =>
                    setStudentDraft((draft) => ({
                      ...draft,
                      leadSourceOther: event.target.value,
                    }))
                  }
                  placeholder="Describe the source"
                />
              </Field>
            ) : null}
            <Field label="Session goal">
              <Input
                className={fieldClass}
                type="number"
                min={1}
                value={studentDraft.sessionGoal}
                onChange={(event) =>
                  setStudentDraft((draft) => ({
                    ...draft,
                    sessionGoal: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Total fee agreed">
              <Input
                className={fieldClass}
                type="number"
                min={0}
                value={studentDraft.totalFee}
                onChange={(event) =>
                  setStudentDraft((draft) => ({
                    ...draft,
                    totalFee: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Amount paid">
              <Input
                className={fieldClass}
                type="number"
                min={0}
                value={studentDraft.amountPaid}
                onChange={(event) =>
                  setStudentDraft((draft) => ({
                    ...draft,
                    amountPaid: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Amount due">
              <Input
                className={fieldClass}
                type="number"
                min={0}
                value={studentDraft.amountDue}
                onChange={(event) =>
                  setStudentDraft((draft) => ({
                    ...draft,
                    amountDue: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Payment date">
              <Input
                className={fieldClass}
                type="date"
                value={studentDraft.lastPaymentOn}
                onChange={(event) =>
                  setStudentDraft((draft) => ({
                    ...draft,
                    lastPaymentOn: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Next due date">
              <Input
                className={fieldClass}
                type="date"
                value={studentDraft.nextDueOn}
                onChange={(event) =>
                  setStudentDraft((draft) => ({
                    ...draft,
                    nextDueOn: event.target.value,
                  }))
                }
              />
            </Field>
          </div>
          <Field label="Notes">
            <textarea
              className={cn(fieldClass, "min-h-24 pt-2")}
              value={studentDraft.note}
              onChange={(event) =>
                setStudentDraft((draft) => ({ ...draft, note: event.target.value }))
              }
              placeholder="Optional note for this student"
            />
          </Field>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddStudentOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button onClick={() => void handleAddStudent()} type="button">
              Save student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={feeEditorOpen} onOpenChange={setFeeEditorOpen}>
        <DialogContent className="max-w-xl border-white/10 bg-slate-950/95 text-foreground">
          <DialogHeader>
            <DialogTitle>
              Update fee record
            </DialogTitle>
            <DialogDescription>
              Keep the current payment snapshot and reminder dates accurate.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Total fee">
              <Input
                className={fieldClass}
                type="number"
                min={0}
                value={feeDraft.totalFee}
                onChange={(event) =>
                  setFeeDraft((draft) => ({ ...draft, totalFee: event.target.value }))
                }
              />
            </Field>
            <Field label="Amount paid">
              <Input
                className={fieldClass}
                type="number"
                min={0}
                value={feeDraft.amountPaid}
                onChange={(event) =>
                  setFeeDraft((draft) => ({ ...draft, amountPaid: event.target.value }))
                }
              />
            </Field>
            <Field label="Amount due">
              <Input
                className={fieldClass}
                type="number"
                min={0}
                value={feeDraft.amountDue}
                onChange={(event) =>
                  setFeeDraft((draft) => ({ ...draft, amountDue: event.target.value }))
                }
              />
            </Field>
            <Field label="Last payment date">
              <Input
                className={fieldClass}
                type="date"
                value={feeDraft.lastPaymentOn}
                onChange={(event) =>
                  setFeeDraft((draft) => ({
                    ...draft,
                    lastPaymentOn: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Next due date">
              <Input
                className={fieldClass}
                type="date"
                value={feeDraft.nextDueOn}
                onChange={(event) =>
                  setFeeDraft((draft) => ({ ...draft, nextDueOn: event.target.value }))
                }
              />
            </Field>
          </div>
          <Field label="Notes">
            <textarea
              className={cn(fieldClass, "min-h-24 pt-2")}
              value={feeDraft.note}
              onChange={(event) =>
                setFeeDraft((draft) => ({ ...draft, note: event.target.value }))
              }
              placeholder="Optional reminder or payment note"
            />
          </Field>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFeeEditorOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button onClick={() => void handleSaveFee()} type="button">
              Save record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={postponeOpen}
        onOpenChange={(open) => {
          if (!open) closePostponeDialog();
        }}
      >
        <DialogContent className="max-w-xl border-white/10 bg-slate-950/95 text-foreground">
          <DialogHeader>
            <DialogTitle>Postpone session</DialogTitle>
            <DialogDescription>
              Mark the original slot as postponed and create the replacement slot.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="New date">
              <Input
                className={fieldClass}
                type="date"
                value={postponeDraft.date}
                onChange={(event) =>
                  setPostponeDraft((draft) => ({ ...draft, date: event.target.value }))
                }
              />
            </Field>
            <Field label="New time">
              <Input
                className={fieldClass}
                type="time"
                value={postponeDraft.time}
                onChange={(event) =>
                  setPostponeDraft((draft) => ({ ...draft, time: event.target.value }))
                }
              />
            </Field>
            <Field label="Duration">
              <Input
                className={fieldClass}
                type="number"
                min={15}
                step={15}
                value={postponeDraft.durationMinutes}
                onChange={(event) =>
                  setPostponeDraft((draft) => ({
                    ...draft,
                    durationMinutes: event.target.value,
                  }))
                }
              />
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              className={cn(fieldClass, "min-h-24 pt-2")}
              value={postponeDraft.note}
              onChange={(event) =>
                setPostponeDraft((draft) => ({ ...draft, note: event.target.value }))
              }
              placeholder="Why was this session postponed?"
            />
          </Field>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closePostponeDialog}
              type="button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handlePostponeSession()}
              type="button"
              disabled={sessionActionSubmitting}
            >
              Postpone and reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editSessionOpen}
        onOpenChange={(open) => {
          setEditSessionOpen(open);
          if (!open) {
            setEditingSessionId("");
          }
        }}
      >
        <DialogContent className="max-w-2xl border-white/10 bg-slate-950/95 text-foreground">
          <DialogHeader>
            <DialogTitle>Edit session</DialogTitle>
            <DialogDescription>
              Change the student, exact date, time, length, or notes.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Student">
              <select
                className={selectFieldClass}
                style={darkControlStyle}
                value={editSessionDraft.studentId}
                onChange={(event) =>
                  setEditSessionDraft((draft) => ({
                    ...draft,
                    studentId: event.target.value,
                  }))
                }
              >
                <option value="">-- Select student --</option>
                {students?.map((student) => (
                  <option key={String(student._id)} value={String(student._id)}>
                    {student.order.toString().padStart(2, "0")} · {student.name}
                  </option>
                )) ?? null}
              </select>
            </Field>
            <Field label="Exact date">
              <Input
                className={fieldClass}
                type="date"
                value={editSessionDraft.date}
                onChange={(event) =>
                  setEditSessionDraft((draft) => ({ ...draft, date: event.target.value }))
                }
              />
            </Field>
            <div className="grid gap-3 md:grid-cols-2 md:col-span-2">
              <Field label="Time">
                <Input
                  className={fieldClass}
                  type="time"
                  value={editSessionDraft.time}
                  onChange={(event) =>
                    setEditSessionDraft((draft) => ({
                      ...draft,
                      time: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Length">
                <select
                  className={selectFieldClass}
                  style={darkControlStyle}
                  value={editSessionDraft.durationMinutes}
                  onChange={(event) =>
                    setEditSessionDraft((draft) => ({
                      ...draft,
                      durationMinutes: event.target.value,
                    }))
                  }
                >
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                  <option value="90">90 min</option>
                  <option value="120">120 min</option>
                </select>
              </Field>
            </div>
          </div>

          <Field label="Notes">
            <textarea
              className={cn(fieldClass, "min-h-24 pt-2")}
              value={editSessionDraft.note}
              onChange={(event) =>
                setEditSessionDraft((draft) => ({ ...draft, note: event.target.value }))
              }
              placeholder="Optional session note"
            />
          </Field>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => closeEditSession()}
                type="button"
              >
                Cancel
              </Button>
              <Button
                onClick={() => void handleUpdateSession()}
                type="button"
                disabled={sessionActionSubmitting}
              >
                Save changes
              </Button>
          </div>
        </DialogContent>
      </Dialog>

      <StudentProfileDialog
        open={studentProfileOpen}
        onOpenChange={(open) => {
          setStudentProfileOpen(open);
          if (!open) {
            closeStudentProfile();
          }
        }}
        student={selectedStudent}
        fee={selectedStudent ? feesByStudentId.get(selectedStudent._id) : undefined}
        sessions={selectedStudent ? sessionsByStudentId.get(selectedStudent._id) ?? [] : []}
        notes={selectedStudent ? notesByStudentId.get(selectedStudent._id) ?? [] : []}
        currentTime={clockTick}
        profileDraft={profileDraft}
        setProfileDraft={setProfileDraft}
        profileEditing={profileEditing}
        setProfileEditing={setProfileEditing}
        onSaveProfile={() => void handleSaveProfile()}
        onAddSlot={openAddSession}
        onViewSession={openSessionDetails}
        onOpenGeneralNote={openAddGeneralNote}
        onOpenSessionNote={openAddSessionNote}
        onEditNote={openEditStudentNote}
        noteEditorOpen={noteEditorOpen}
        noteEditorDraft={noteEditorDraft}
        setNoteEditorDraft={setNoteEditorDraft}
        noteEditorSubmitting={noteEditorSubmitting}
        onSaveNote={() => void handleSaveStudentNote()}
        onDeleteNote={(noteId) => void handleDeleteStudentNote(noteId)}
        onCloseNoteEditor={closeNoteEditor}
      />

      <SessionDetailsDialog
        open={sessionDetailsOpen}
        onOpenChange={(open) => {
          setSessionDetailsOpen(open);
          if (!open) setDetailSessionId("");
        }}
        session={detailSession}
        notes={detailSessionNotes}
        submitting={sessionActionSubmitting}
        onEdit={(session) => {
          setSessionDetailsOpen(false);
          openEditSession(session);
        }}
        onComplete={(sessionId) => {
          setSessionDetailsOpen(false);
          openSessionCompletionDialog(sessionId);
        }}
        onCancel={(sessionId) => {
          setSessionDetailsOpen(false);
          openCancelSessionDialog(sessionId);
        }}
        onPostpone={(sessionId) => {
          setSessionDetailsOpen(false);
          openPostponeDialog(sessionId);
        }}
        onDelete={(sessionId) => void handleDeleteSession(sessionId)}
        onAddNote={(session) => {
          setSessionDetailsOpen(false);
          setSelectedStudentId(session.studentId);
          setStudentProfileOpen(true);
          openAddSessionNote(session.studentId, session._id);
        }}
        onEditNote={(note) => {
          setSessionDetailsOpen(false);
          setSelectedStudentId(note.studentId);
          setStudentProfileOpen(true);
          openEditStudentNote(note);
        }}
        onDeleteNote={(noteId) => void handleDeleteStudentNote(noteId)}
      />

      <CancelSessionDialog
        open={cancelSessionOpen}
        onOpenChange={setCancelSessionOpen}
        session={selectedSession}
        reason={cancelReason}
        setReason={setCancelReason}
        onConfirm={() => void handleCancelSession()}
        submitting={sessionActionSubmitting}
      />

      <SessionCompletionDialog
        open={sessionCompletionOpen}
        onOpenChange={(open) => {
          setSessionCompletionOpen(open);
          if (!open) {
            closeSessionCompletionDialog();
          }
        }}
        session={selectedSession}
        draft={sessionCompletionDraft}
        setDraft={setSessionCompletionDraft}
        onSave={() => void handleSaveSessionCompletion()}
        submitting={sessionCompletionSubmitting}
      />
    </div>
  );
}

function SidebarSection({
  title,
  items,
  activeView,
  onChange,
}: {
  title: string;
  items: Array<{ key: ViewKey; label: string; hint: string }>;
  activeView: ViewKey;
  onChange: (value: ViewKey) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-xs uppercase tracking-[0.35em] text-slate-500">
        {title}
      </p>
      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={cn(
              "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition",
              activeView === item.key
                ? "bg-white/10 text-white shadow-lg shadow-black/20 ring-1 ring-orange-400/20"
                : "text-slate-300 hover:bg-white/5 hover:text-white",
            )}
          >
            <div>
              <div className="text-sm font-medium">{item.label}</div>
              <div className="text-xs text-slate-500">{item.hint}</div>
            </div>
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                activeView === item.key ? "bg-orange-400" : "bg-slate-600",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function AlertBar({
  tone,
  message,
}: {
  tone: "success" | "error";
  message: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 rounded-2xl border px-4 py-3 text-sm shadow-lg",
        tone === "success"
          ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
          : "border-red-400/20 bg-red-500/10 text-red-100",
      )}
    >
      {message}
    </div>
  );
}

function LoadingState() {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle>Syncing CRM data</CardTitle>
        <CardDescription>
          Waiting for the secure Convex database to finish loading.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-slate-300">
        The first seed will run automatically if this database is empty.
      </CardContent>
    </Card>
  );
}

function DashboardView({
  totalStudents,
  activeStudents,
  introsDone,
  sessionsThisWeekDone,
  conflicts,
  feesOutstanding,
  unscheduledStudents,
  dueStudents,
  upcomingDueSoon,
  studentRows,
  scheduledSessions,
  leadSourceSummary,
  onJump,
  onAddSlot,
}: {
  totalStudents: number;
  activeStudents: number;
  introsDone: number;
  sessionsThisWeekDone: number;
  conflicts: number;
  feesOutstanding: number;
  unscheduledStudents: number;
  dueStudents: FeeDoc[];
  upcomingDueSoon: FeeDoc[];
  studentRows: StudentRow[];
  scheduledSessions: SessionDoc[];
  leadSourceSummary: Array<{ label: string; count: number; tone: string }>;
  onJump: (view: ViewKey) => void;
  onAddSlot: (studentId?: Id<"students">) => void;
}) {
  const metrics = [
    {
      label: "Active Students",
      value: activeStudents,
      detail: "live student records",
      accent: "orange",
    },
    {
      label: "Intros Done",
      value: `${introsDone}/${totalStudents}`,
      detail: "onboarding complete",
      accent: "emerald",
    },
    {
      label: "Sessions This Week",
      value: sessionsThisWeekDone,
      detail: "marked done",
      accent: "blue",
    },
    {
      label: "Clashes",
      value: conflicts,
      detail: "time overlaps",
      accent: "rose",
    },
      {
        label: "Fees Outstanding",
        value: formatCurrency(feesOutstanding),
        detail: `${dueStudents.length} students owe fees`,
        accent: "amber",
      },
      {
        label: "No Slots",
        value: unscheduledStudents,
        detail: "students unscheduled",
        accent: "slate",
      },
      {
        label: "Total Students",
        value: totalStudents,
        detail: "all time",
        accent: "slate",
      },
  ] as const;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-7">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <Card className="border-orange-400/20 bg-gradient-to-r from-orange-400/10 via-white/5 to-white/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="text-sm text-orange-100">
            <span className="font-semibold">{formatCurrency(feesOutstanding)}</span>{" "}
            outstanding from {dueStudents.length} students.
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => onJump("fees")}>
              View fees
            </Button>
            <Button variant="outline" onClick={() => onJump("schedule")}>
              Open calendar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Lead source snapshot</CardTitle>
            <CardDescription>Quick counts from the student records.</CardDescription>
          </div>
          <Button variant="outline" onClick={() => onJump("students")}>
            Filter students
          </Button>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {leadSourceSummary.length > 0 ? (
            leadSourceSummary.map((item) => (
              <span
                key={item.label}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                  leadSourceBadgeClass(item.label),
                )}
              >
                <span>{item.label}</span>
                <span className="rounded-full bg-black/20 px-2 py-0.5 text-[11px]">
                  {item.count}
                </span>
              </span>
            ))
          ) : (
            <p className="text-sm text-slate-300">No lead sources recorded yet.</p>
          )}
        </CardContent>
      </Card>

      {upcomingDueSoon.length > 0 ? (
        <Card className="border-amber-400/20 bg-amber-500/10">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="space-y-1">
              <div className="text-sm font-semibold text-amber-100">
                Upcoming payment reminders
              </div>
              <div className="text-sm text-amber-100/80">
                {upcomingDueSoon
                  .map(
                    (fee) =>
                      `${fee.studentName} due ${formatDateOnly(fee.nextDueOn)} (${formatCurrency(
                        fee.amountDue,
                      )})`,
                  )
                  .join(" · ")}
              </div>
            </div>
            <Button variant="outline" onClick={() => onJump("fees")}>
              Review reminders
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-6 2xl:grid-cols-[1.5fr_1fr]">
        <Card className="border-white/10 bg-white/5">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Student Overview</CardTitle>
              <CardDescription>Numbered cards, payment totals, and next actions.</CardDescription>
            </div>
            <Button variant="outline" onClick={() => onJump("students")}>
              Open students
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {studentRows.map((row) => (
                <StudentCompactCard
                  key={String(row.student._id)}
                  row={row}
                  onAddSlot={onAddSlot}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>Schedule at a glance</CardTitle>
              <CardDescription>Upcoming sessions ordered by date and time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {scheduledSessions.slice(0, 6).map((session) => (
                <div
                  key={String(session._id)}
                  className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">{session.studentName}</div>
                      <div className="text-sm text-slate-300">
                        {formatDateTime(session.startAt)}
                      </div>
                    </div>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-100">
                      Scheduled
                    </span>
                  </div>
                </div>
              ))}
              {scheduledSessions.length === 0 ? (
                <p className="text-sm text-slate-300">No sessions have been scheduled yet.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function StudentsView({
  studentRows,
  studentSearch,
  leadSourceFilter,
  setStudentSearch,
  setLeadSourceFilter,
  onAddSlot,
  onAddStudent,
  onFocusStudent,
}: {
  studentRows: StudentRow[];
  studentSearch: string;
  leadSourceFilter: string;
  setStudentSearch: Dispatch<SetStateAction<string>>;
  setLeadSourceFilter: Dispatch<SetStateAction<string>>;
  onAddSlot: (studentId?: Id<"students">) => void;
  onAddStudent: () => void;
  onFocusStudent: (studentId: Id<"students">) => void;
}) {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Students</CardTitle>
          <CardDescription>
            Every student is numbered in the order they were added.
          </CardDescription>
        </div>
        <Button onClick={onAddStudent} variant="outline">
          + Add Student
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-5 grid gap-3 md:grid-cols-[1.4fr_0.8fr]">
          <Input
            className={fieldClass}
            value={studentSearch}
            onChange={(event) => setStudentSearch(event.target.value)}
            placeholder="Search name, student number, or lead source"
          />
          <select
            className={selectFieldClass}
            style={darkControlStyle}
            value={leadSourceFilter}
            onChange={(event) => setLeadSourceFilter(event.target.value)}
          >
            {leadSourceFilterOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {studentRows.length > 0 ? (
            studentRows.map((row) => (
              <StudentFullCard
                key={String(row.student._id)}
                row={row}
                onAddSlot={onAddSlot}
                onFocusStudent={onFocusStudent}
              />
            ))
          ) : (
            <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-6 text-sm text-slate-300">
              No students match this filter yet.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ScheduleView({
  students,
  sessionDraft,
  setSessionDraft,
  calendarMonth,
  setCalendarMonth,
  monthGrid,
  sessionsByDate,
  scheduledSessions,
  onAddSession,
  onViewSession,
  submitting,
}: {
  students: StudentDoc[];
  sessionDraft: {
    studentId: string;
    date: string;
    time: string;
    durationMinutes: string;
    note: string;
  };
  setSessionDraft: Dispatch<
    SetStateAction<{
      studentId: string;
      date: string;
      time: string;
      durationMinutes: string;
      note: string;
    }>
  >;
  calendarMonth: Date;
  setCalendarMonth: Dispatch<SetStateAction<Date>>;
  monthGrid: Date[];
  sessionsByDate: Map<string, SessionDoc[]>;
  scheduledSessions: SessionDoc[];
  onAddSession: () => void;
  onViewSession: (sessionId: Id<"sessions">) => void;
  submitting: boolean;
}) {
  const deviceTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Device local time";

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <div>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>
              Schedule exact dates and open any session to manage it.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
            <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
              <div className="grid gap-3">
                <div className="text-xs text-slate-400">
                  Times use this device timezone: {deviceTimezone}
                </div>
                <Field label="Student">
                  <select
                    className={selectFieldClass}
                    style={darkControlStyle}
                    value={sessionDraft.studentId}
                    onChange={(event) =>
                      setSessionDraft((draft) => ({
                        ...draft,
                        studentId: event.target.value,
                      }))
                    }
                  >
                    <option value="">-- Select student --</option>
                    {students.map((student) => (
                      <option key={String(student._id)} value={String(student._id)}>
                        {student.order.toString().padStart(2, "0")} · {student.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Exact date">
                  <Input
                    className={fieldClass}
                    type="date"
                    value={sessionDraft.date}
                    onChange={(event) =>
                      setSessionDraft((draft) => ({ ...draft, date: event.target.value }))
                    }
                  />
                </Field>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Time">
                    <Input
                      className={fieldClass}
                      type="time"
                      value={sessionDraft.time}
                      onChange={(event) =>
                        setSessionDraft((draft) => ({
                          ...draft,
                          time: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Length">
                    <select
                      className={selectFieldClass}
                      style={darkControlStyle}
                      value={sessionDraft.durationMinutes}
                      onChange={(event) =>
                        setSessionDraft((draft) => ({
                          ...draft,
                          durationMinutes: event.target.value,
                        }))
                      }
                    >
                      <option value="45">45 min</option>
                      <option value="60">60 min</option>
                      <option value="90">90 min</option>
                      <option value="120">120 min</option>
                    </select>
                  </Field>
                </div>
                <Field label="Notes">
                  <textarea
                    className={cn(fieldClass, "min-h-24 pt-2")}
                    value={sessionDraft.note}
                    onChange={(event) =>
                      setSessionDraft((draft) => ({ ...draft, note: event.target.value }))
                    }
                    placeholder="Optional session note"
                  />
                </Field>
                <Button onClick={onAddSession} disabled={submitting}>
                  {submitting ? "Scheduling..." : "Add Session"}
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCalendarMonth(addMonths(calendarMonth, -1))}
                >
                  Previous
                </Button>
                <h3 className="text-lg font-semibold">{formatMonthYear(calendarMonth)}</h3>
                <Button variant="outline" onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}>
                  Next
                </Button>
              </div>

              <div className="overflow-x-auto pb-2">
                <div className="grid min-w-[760px] grid-cols-7 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <div
                    key={day}
                    className="bg-slate-950/60 px-2 py-3 text-center text-xs font-semibold uppercase tracking-[0.3em] text-slate-400"
                  >
                    {day}
                  </div>
                ))}
                {monthGrid.map((day) => {
                  const key = localDateKey(day.getTime());
                  const daySessions = sessionsByDate.get(key) ?? [];
                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "min-h-32 bg-slate-950/35 p-2 text-sm",
                        isSameMonth(day, calendarMonth) ? "text-slate-100" : "text-slate-500",
                        day.getDate() === new Date().getDate() &&
                          day.getMonth() === new Date().getMonth() &&
                          day.getFullYear() === new Date().getFullYear()
                          ? "ring-2 ring-orange-400/50"
                          : "",
                      )}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold tracking-wide">
                          {day.getDate()}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {daySessions.slice(0, 2).map((session) => (
                          <button
                            key={String(session._id)}
                            type="button"
                            onClick={() => onViewSession(session._id)}
                            className="w-full rounded-lg border border-orange-400/20 bg-orange-400/10 px-2 py-1 text-left text-xs text-orange-100 transition hover:border-orange-300/50 hover:bg-orange-400/20"
                            title="View session details"
                          >
                            <div className="font-medium">
                              {formatDateTime(session.startAt)
                                .split(", ")
                                .slice(1)
                                .join(" ")}
                            </div>
                            <div className="text-[11px] text-orange-50/80">
                              {session.studentName}
                            </div>
                          </button>
                        ))}
                        {daySessions.length > 2 ? (
                          <div className="text-xs text-slate-400">
                            +{daySessions.length - 2} more
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle>Upcoming sessions</CardTitle>
          <CardDescription>
            Future scheduled sessions only. Open one to edit, postpone, cancel,
            or complete it.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {scheduledSessions.map((session) => (
            <div
              key={String(session._id)}
              className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3"
            >
              <div className="text-sm font-semibold text-white">{session.studentName}</div>
              <div className="mt-1 text-sm text-slate-300">{formatDateTime(session.startAt)}</div>
              <div className="mt-1 text-xs text-slate-500">
                {session.durationMinutes} minutes
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewSession(session._id)}
                >
                  View details
                </Button>
              </div>
            </div>
          ))}
          {scheduledSessions.length === 0 ? (
            <p className="text-sm text-slate-300">No upcoming sessions booked yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function SessionLogView({
  sessions,
  studentRows,
  onViewSession,
}: {
  sessions: SessionDoc[];
  studentRows: StudentRow[];
  onViewSession: (sessionId: Id<"sessions">) => void;
}) {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle>Session log</CardTitle>
        <CardDescription>
          Complete history for scheduled, done, canceled, and postponed sessions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {sessions
          .slice()
          .sort((left, right) => right.startAt - left.startAt)
          .map((session) => {
            const row = studentRows.find(
              (studentRow) => studentRow.student._id === session.studentId,
            );
            return (
              <div
                key={String(session._id)}
                className="rounded-2xl border border-white/10 bg-slate-950/35 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300">
                        #{row?.student.order.toString().padStart(2, "0") ?? "--"}
                      </span>
                      <h3 className="text-lg font-semibold text-white">
                        {session.studentName}
                      </h3>
                      <StatusTag status={session.status} />
                    </div>
                    <p className="mt-2 text-sm text-slate-300">
                      {formatDateTime(session.startAt)} · {session.durationMinutes} minutes
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {session.note ?? "No extra note added yet."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewSession(session._id)}
                    >
                      View details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        {sessions.length === 0 ? (
          <p className="text-sm text-slate-300">No session history yet.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function FeesView({
  fees,
  studentRows,
  onOpenEditor,
  onSaveFee,
  selectedFeeStudentId,
  setSelectedFeeStudentId,
  totalOutstanding,
}: {
  fees: FeeDoc[];
  studentRows: StudentRow[];
  onOpenEditor: (studentId: Id<"students">) => void;
  onSaveFee: () => void;
  selectedFeeStudentId: Id<"students"> | "";
  setSelectedFeeStudentId: Dispatch<
    SetStateAction<Id<"students"> | "">
  >;
  totalOutstanding: number;
}) {
  const dueStudentsCount = fees.filter((fee) => fee.amountDue > 0).length;
  const totalEarned = fees.reduce((sum, fee) => sum + fee.amountPaid, 0);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard
          label="Outstanding"
          value={formatCurrency(totalOutstanding)}
          detail="current fees due"
          accent="amber"
        />
        <MetricCard
          label="Due students"
          value={dueStudentsCount}
          detail="need reminders"
          accent="orange"
        />
        <MetricCard
          label="Fully paid"
          value={fees.filter((fee) => fee.amountDue === 0).length}
          detail="settled accounts"
          accent="emerald"
        />
        <MetricCard
          label="Total fee"
          value={formatCurrency(totalCourseFee)}
          detail="per student"
          accent="slate"
        />
        <MetricCard
          label="Total earned"
          value={formatCurrency(totalEarned)}
          detail="all payments received"
          accent="emerald"
        />
      </section>

      <Card className="border-white/10 bg-white/5">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Fee tracker</CardTitle>
            <CardDescription>
              Track installment dates, amounts paid, and next due reminders.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              const first = studentRows.find((row) => row.fee);
              if (first) onOpenEditor(first.student._id);
            }}
          >
            Edit record
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3">
            <select
              className={selectFieldClass}
              style={darkControlStyle}
              value={selectedFeeStudentId}
              onChange={(event) =>
                setSelectedFeeStudentId(event.target.value as Id<"students">)
              }
            >
              <option value="">-- Select student record --</option>
              {studentRows.map((row) => (
                <option key={String(row.student._id)} value={String(row.student._id)}>
                  {row.student.order.toString().padStart(2, "0")} - {row.student.name}
                </option>
              ))}
            </select>
          </div>

          {selectedFeeStudentId ? (
            <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
              {(() => {
                const row = studentRows.find(
                  (studentRow) => studentRow.student._id === selectedFeeStudentId,
                );
                if (!row) return null;
                return (
                  <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold text-white">
                          {row.student.name}
                        </h3>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                          #{row.student.order.toString().padStart(2, "0")}
                        </span>
                        <StatusTag
                          status={row.fee?.amountDue ? "scheduled" : "done"}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-300">
                        <span>Paid: {formatCurrency(row.fee?.amountPaid ?? 0)}</span>
                        <span>
                          Total fee: {formatCurrency(row.fee?.totalFee ?? totalCourseFee)}
                        </span>
                        <span>Due: {formatCurrency(row.fee?.amountDue ?? totalCourseFee)}</span>
                        <span>
                          Last payment: {formatDateOnly(row.fee?.lastPaymentOn ?? null)}
                        </span>
                        <span>
                          Next due: {formatDateOnly(row.fee?.nextDueOn ?? null)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-400">
                        {row.fee?.note ?? row.student.note}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" onClick={() => onOpenEditor(row.student._id)}>
                        Edit account
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-3xl border border-white/10">
            <div className="grid grid-cols-12 bg-slate-950/60 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              <div className="col-span-4">Student</div>
              <div className="col-span-2">Paid</div>
              <div className="col-span-2">Due</div>
              <div className="col-span-2">Last payment</div>
              <div className="col-span-2">Next due</div>
            </div>
            <div className="divide-y divide-white/10">
              {fees.map((fee) => (
                <div
                  key={String(fee._id)}
                  className={cn(
                    "grid grid-cols-12 items-center px-4 py-4 text-sm",
                    fee.amountDue > 0 ? "bg-amber-500/5" : "bg-transparent",
                  )}
                >
                  <div className="col-span-4">
                    <div className="font-medium text-white">{fee.studentName}</div>
                    <div className="text-xs text-slate-400">
                      #{fee.studentOrder.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs text-slate-500">
                      Total: {formatCurrency(fee.totalFee)}
                    </div>
                  </div>
                  <div className="col-span-2 text-emerald-300">
                    {formatCurrency(fee.amountPaid)}
                  </div>
                  <div className="col-span-2 text-amber-300">
                    {formatCurrency(fee.amountDue)}
                  </div>
                  <div className="col-span-2 text-slate-300">
                    {formatDateOnly(fee.lastPaymentOn)}
                  </div>
                  <div className="col-span-2 text-slate-300">
                    {formatDateOnly(fee.nextDueOn)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle>Quick notes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-300">
          Waleed Iftikhar has a logged payment of 200 on 29 May 2026 with the next
          installment due on 29 Jun 2026. Arslan is set to 200 paid and 200 due with
          the next installment due in July; the payment date can be filled in later.
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            const first = studentRows.find((row) => row.fee);
            if (first) onOpenEditor(first.student._id);
          }}
        >
          Edit selected record
        </Button>
        <Button variant="outline" onClick={onSaveFee}>
          Save current edit
        </Button>
      </div>
    </div>
  );
}

function BackupView({
  backupSnapshot,
  onDownload,
  onCopy,
  studentCount,
  sessionCount,
  feeCount,
}: {
  backupSnapshot: {
    exportedAt: string;
    students: StudentDoc[];
    sessions: SessionDoc[];
    studentNotes: StudentNoteDoc[];
    fees: FeeDoc[];
  };
  onDownload: () => void;
  onCopy: () => void;
  studentCount: number;
  sessionCount: number;
  feeCount: number;
}) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Students" value={studentCount} detail="backed up" accent="orange" />
        <MetricCard label="Sessions" value={sessionCount} detail="backed up" accent="emerald" />
        <MetricCard label="Fee records" value={feeCount} detail="backed up" accent="blue" />
      </section>

      <Card className="border-white/10 bg-white/5">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Data backup</CardTitle>
            <CardDescription>
              Export the live Convex data as JSON for local safekeeping or handoff.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCopy}>
              Copy JSON
            </Button>
            <Button onClick={onDownload}>Download backup</Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="max-h-[34rem] overflow-auto rounded-3xl border border-white/10 bg-slate-950/50 p-4 text-xs leading-6 text-slate-200">
            {JSON.stringify(backupSnapshot, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

function StudentProfileDialog({
  open,
  onOpenChange,
  student,
  fee,
  sessions,
  notes,
  currentTime,
  profileDraft,
  setProfileDraft,
  profileEditing,
  setProfileEditing,
  onSaveProfile,
  onAddSlot,
  onViewSession,
  onOpenGeneralNote,
  onOpenSessionNote,
  onEditNote,
  noteEditorOpen,
  noteEditorDraft,
  setNoteEditorDraft,
  noteEditorSubmitting,
  onSaveNote,
  onDeleteNote,
  onCloseNoteEditor,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  student?: StudentDoc;
  fee?: FeeDoc;
  sessions: SessionDoc[];
  notes: StudentNoteDoc[];
  currentTime: number;
  profileDraft: StudentProfileDraft;
  setProfileDraft: Dispatch<SetStateAction<StudentProfileDraft>>;
  profileEditing: boolean;
  setProfileEditing: Dispatch<SetStateAction<boolean>>;
  onSaveProfile: () => void;
  onAddSlot: (studentId?: Id<"students">) => void;
  onViewSession: (sessionId: Id<"sessions">) => void;
  onOpenGeneralNote: (studentId: Id<"students">) => void;
  onOpenSessionNote: (studentId: Id<"students">, sessionId?: Id<"sessions">) => void;
  onEditNote: (note: StudentNoteDoc) => void;
  noteEditorOpen: boolean;
  noteEditorDraft: StudentNoteDraft;
  setNoteEditorDraft: Dispatch<SetStateAction<StudentNoteDraft>>;
  noteEditorSubmitting: boolean;
  onSaveNote: () => void;
  onDeleteNote: (noteId: Id<"studentNotes">) => void;
  onCloseNoteEditor: () => void;
}) {
  const sessionById = useMemo(() => {
    return new Map(sessions.map((session) => [session._id, session]));
  }, [sessions]);

  const generalNotes = useMemo(
    () => notes.filter((note) => note.type === "general"),
    [notes],
  );
  const sessionNotes = useMemo(
    () => notes.filter((note) => note.type === "session"),
    [notes],
  );
  const orderedSessions = useMemo(() => {
    return sessions.slice().sort((left, right) => right.startAt - left.startAt);
  }, [sessions]);
  const upcomingSession = useMemo(() => {
    return sessions
      .filter(
        (session) =>
          session.status === "scheduled" && session.startAt >= currentTime,
      )
      .sort((left, right) => left.startAt - right.startAt)[0];
  }, [sessions, currentTime]);

  if (!student) {
    return null;
  }

  const doneSessions = sessions.filter((session) => session.status === "done").length;
  const remainingSessions = Math.max(student.sessionGoal - doneSessions, 0);
  const paymentBadge =
    fee?.amountDue && fee.amountDue > 0
      ? `${formatCurrency(fee.amountDue)} due`
      : "Fully paid";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-7xl overflow-hidden border-white/10 bg-slate-950/95 p-0 text-foreground">
        <div className="max-h-[92vh] overflow-y-auto p-6">
          <DialogHeader className="mb-5 pr-10">
            <DialogTitle className="text-2xl">
              {student.order.toString().padStart(2, "0")} · {student.name}
            </DialogTitle>
            <DialogDescription>
              Full profile, session history, and all student notes in one place.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_1.35fr]">
            <div className="space-y-6">
              <Card className="border-white/10 bg-white/5">
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-2xl font-black text-orange-300">
                        {student.initials}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-2xl">{student.name}</CardTitle>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300">
                            #{student.order.toString().padStart(2, "0")}
                          </span>
                          <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-100">
                            {paymentBadge}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
                          <span className="rounded-full bg-white/5 px-2.5 py-1">
                            {doneSessions} done
                          </span>
                          <span className="rounded-full bg-white/5 px-2.5 py-1">
                            {remainingSessions} left
                          </span>
                          <span className="rounded-full bg-white/5 px-2.5 py-1">
                            {notes.length} notes
                          </span>
                          <span className="rounded-full bg-white/5 px-2.5 py-1">
                            {sessions.length} sessions
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="text-xs uppercase tracking-[0.25em] text-slate-500">
                            Lead source
                          </span>
                          <span
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-xs font-semibold",
                              leadSourceBadgeClass(student.leadSource ?? ""),
                            )}
                          >
                            {displayLeadSource(student)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button variant="outline" onClick={() => setProfileEditing(true)}>
                        Edit Profile
                      </Button>
                      <Button variant="outline" onClick={() => onAddSlot(student._id)}>
                        Add Slot
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                      <div className="text-xs uppercase tracking-[0.25em] text-slate-500">
                        Next booked session
                      </div>
                      <div className="mt-2 text-sm font-semibold text-white">
                        {upcomingSession
                          ? formatDateTime(upcomingSession.startAt)
                          : "No upcoming session"}
                      </div>
                      <div className="mt-1 text-sm text-slate-300">
                        {upcomingSession
                          ? `${upcomingSession.durationMinutes} minutes`
                          : "Use Add Slot to book one"}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                      <div className="text-xs uppercase tracking-[0.25em] text-slate-500">
                        Profile summary
                      </div>
                      <div className="mt-2 space-y-2 text-sm text-slate-300">
                        <div>
                          <span className="text-slate-400">Lead source: </span>
                          <span className="text-white">
                            {displayLeadSource(student)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Other lead source: </span>
                          <span className="text-white">
                            {student.leadSource === "Other"
                              ? student.leadSourceOther || "Not recorded"
                              : "Not applicable"}
                          </span>
                        </div>
                        <div className="pt-1">
                          {student.note || "No summary note added yet."}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Student full name">
                      <Input
                        className={fieldClass}
                        value={profileDraft.name}
                        onChange={(event) =>
                          setProfileDraft((draft) => ({ ...draft, name: event.target.value }))
                        }
                        disabled={!profileEditing}
                      />
                    </Field>
                    <Field label="Lead source">
                      <select
                        className={selectFieldClass}
                        style={darkControlStyle}
                        value={profileDraft.leadSource}
                        onChange={(event) =>
                          setProfileDraft((draft) => ({
                            ...draft,
                            leadSource: event.target.value,
                            leadSourceOther:
                              event.target.value === "Other" ? draft.leadSourceOther : "",
                          }))
                        }
                        disabled={!profileEditing}
                      >
                        {leadSourceOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </Field>
                    {profileDraft.leadSource === "Other" ? (
                      <Field label="Other lead source">
                        <Input
                          className={fieldClass}
                          value={profileDraft.leadSourceOther}
                          onChange={(event) =>
                            setProfileDraft((draft) => ({
                              ...draft,
                              leadSourceOther: event.target.value,
                            }))
                          }
                          disabled={!profileEditing}
                          placeholder="Describe the source"
                        />
                      </Field>
                    ) : null}
                    <Field label="Investment budget">
                      <Input
                        className={fieldClass}
                        value={profileDraft.investmentBudget}
                        onChange={(event) =>
                          setProfileDraft((draft) => ({
                            ...draft,
                            investmentBudget: event.target.value,
                          }))
                        }
                        disabled={!profileEditing}
                      />
                    </Field>
                    <Field label="Current state / current situation">
                      <textarea
                        className={cn(fieldClass, "min-h-24 pt-2")}
                        value={profileDraft.currentState}
                        onChange={(event) =>
                          setProfileDraft((draft) => ({
                            ...draft,
                            currentState: event.target.value,
                          }))
                        }
                        disabled={!profileEditing}
                      />
                    </Field>
                    <Field label="Goals">
                      <textarea
                        className={cn(fieldClass, "min-h-24 pt-2")}
                        value={profileDraft.goals}
                        onChange={(event) =>
                          setProfileDraft((draft) => ({
                            ...draft,
                            goals: event.target.value,
                          }))
                        }
                        disabled={!profileEditing}
                      />
                    </Field>
                    <Field label="Future plans">
                      <textarea
                        className={cn(fieldClass, "min-h-24 pt-2")}
                        value={profileDraft.futurePlans}
                        onChange={(event) =>
                          setProfileDraft((draft) => ({
                            ...draft,
                            futurePlans: event.target.value,
                          }))
                        }
                        disabled={!profileEditing}
                      />
                    </Field>
                    <Field label="eBay / business experience">
                      <Input
                        className={fieldClass}
                        value={profileDraft.experienceLevel}
                        onChange={(event) =>
                          setProfileDraft((draft) => ({
                            ...draft,
                            experienceLevel: event.target.value,
                          }))
                        }
                        disabled={!profileEditing}
                      />
                    </Field>
                    <Field label="Main problems / weaknesses">
                      <textarea
                        className={cn(fieldClass, "min-h-24 pt-2")}
                        value={profileDraft.problemsWeaknesses}
                        onChange={(event) =>
                          setProfileDraft((draft) => ({
                            ...draft,
                            problemsWeaknesses: event.target.value,
                          }))
                        }
                        disabled={!profileEditing}
                      />
                    </Field>
                    <Field label="Important reminders">
                      <textarea
                        className={cn(fieldClass, "min-h-24 pt-2")}
                        value={profileDraft.importantReminders}
                        onChange={(event) =>
                          setProfileDraft((draft) => ({
                            ...draft,
                            importantReminders: event.target.value,
                          }))
                        }
                        disabled={!profileEditing}
                      />
                    </Field>
                    <Field label="General notes">
                      <textarea
                        className={cn(fieldClass, "min-h-24 pt-2")}
                        value={profileDraft.note}
                        onChange={(event) =>
                          setProfileDraft((draft) => ({
                            ...draft,
                            note: event.target.value,
                          }))
                        }
                        disabled={!profileEditing}
                      />
                    </Field>
                  </div>

                  {profileEditing ? (
                    <div className="flex justify-between gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setProfileEditing(false);
                          setProfileDraft({
                            name: student.name,
                            leadSource: normalizeLeadSource(student.leadSource) || "Organic / Direct",
                            leadSourceOther: student.leadSourceOther ?? "",
                            currentState: student.currentState ?? "",
                            goals: student.goals ?? "",
                            investmentBudget: student.investmentBudget ?? "",
                            futurePlans: student.futurePlans ?? "",
                            experienceLevel: student.experienceLevel ?? "",
                            problemsWeaknesses: student.problemsWeaknesses ?? "",
                            importantReminders: student.importantReminders ?? "",
                            note: student.note ?? "",
                          });
                        }}
                      >
                        Cancel Edit
                      </Button>
                      <Button onClick={onSaveProfile}>Save Profile</Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <div>
                    <CardTitle>Past and upcoming sessions</CardTitle>
                    <CardDescription>
                      Everything booked for this student, newest first.
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => onAddSlot(student._id)}>
                    Add Slot
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {orderedSessions.length === 0 ? (
                    <p className="text-sm text-slate-300">No sessions booked yet.</p>
                  ) : (
                    orderedSessions.map((session) => {
                      const sessionNoteCount = notes.filter(
                        (note) =>
                          note.type === "session" &&
                          note.sessionId &&
                          String(note.sessionId) === String(session._id),
                      ).length;
                      return (
                        <div
                          key={String(session._id)}
                          className="rounded-2xl border border-white/10 bg-slate-950/35 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <StatusTag status={session.status} />
                                <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300">
                                  {formatDateTime(session.startAt)}
                                </span>
                                <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300">
                                  {session.durationMinutes} min
                                </span>
                                {sessionNoteCount > 0 ? (
                                  <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-200">
                                    {sessionNoteCount} note{sessionNoteCount === 1 ? "" : "s"}
                                  </span>
                                ) : null}
                              </div>
                              <div className="mt-2 text-sm text-slate-300">
                                {session.note ?? "No session note yet."}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onViewSession(session._id)}
                              >
                                View details
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onOpenSessionNote(student._id, session._id)}
                              >
                                Add note
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-white/10 bg-white/5">
                <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <div>
                    <CardTitle>General notes</CardTitle>
                    <CardDescription>
                      Long-term notes for the student profile, newest first.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => onOpenGeneralNote(student._id)}
                    >
                      Add General Note
                    </Button>
                    <Button
                      onClick={() => onOpenSessionNote(student._id)}
                      disabled={sessions.length === 0}
                    >
                      Add Session Note
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {noteEditorOpen ? (
                    <div className="rounded-3xl border border-orange-400/20 bg-orange-500/5 p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {noteEditorDraft.noteId ? "Edit note" : "Add note"}
                          </div>
                          <div className="text-sm text-slate-300">
                            {noteEditorDraft.type === "session"
                              ? "This note is linked to a booked session."
                              : "This note stays on the student profile."}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={onCloseNoteEditor}>
                          Cancel
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Note title">
                          <Input
                            className={fieldClass}
                            value={noteEditorDraft.title}
                            onChange={(event) =>
                              setNoteEditorDraft((draft) => ({
                                ...draft,
                                title: event.target.value,
                              }))
                            }
                            placeholder="Optional note title"
                          />
                        </Field>
                        {noteEditorDraft.type === "session" ? (
                          <Field label="Linked session">
                            <select
                              className={selectFieldClass}
                              style={darkControlStyle}
                              value={noteEditorDraft.sessionId}
                              onChange={(event) =>
                                setNoteEditorDraft((draft) => ({
                                  ...draft,
                                  sessionId: event.target.value
                                    ? (event.target.value as Id<"sessions">)
                                    : "",
                                }))
                              }
                            >
                              <option value="">-- Select session --</option>
                              {sessions.map((session) => (
                                <option key={String(session._id)} value={String(session._id)}>
                                  {formatDateTime(session.startAt)} · {session.status}
                                </option>
                              ))}
                            </select>
                          </Field>
                        ) : null}
                      </div>

                      <Field label="Note content">
                        <textarea
                          className={cn(fieldClass, "min-h-32 pt-2")}
                          value={noteEditorDraft.content}
                          onChange={(event) =>
                            setNoteEditorDraft((draft) => ({
                              ...draft,
                              content: event.target.value,
                            }))
                          }
                          placeholder="Write the full note here."
                        />
                      </Field>

                      <div className="mt-4 flex flex-wrap justify-between gap-2">
                        <div className="text-xs text-slate-400">
                          {noteEditorDraft.type === "session"
                            ? "Session notes can be linked to a booked lesson."
                            : "General notes are for long-term context and reminders."}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={onCloseNoteEditor}>
                            Cancel
                          </Button>
                          <Button onClick={onSaveNote} disabled={noteEditorSubmitting}>
                            {noteEditorDraft.noteId ? "Save changes" : "Save note"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {generalNotes.length === 0 ? (
                    <p className="text-sm text-slate-300">No general notes added yet.</p>
                  ) : (
                    generalNotes.map((note) => (
                      <StudentNoteCard
                        key={String(note._id)}
                        note={note}
                        session={note.sessionId ? sessionById.get(note.sessionId) : undefined}
                        onEdit={() => onEditNote(note)}
                        onDelete={() => onDeleteNote(note._id)}
                      />
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Session notes timeline</CardTitle>
                  <CardDescription>
                    Session-linked notes, newest first.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sessionNotes.length === 0 ? (
                    <p className="text-sm text-slate-300">No session notes yet.</p>
                  ) : (
                    sessionNotes.map((note) => (
                      <StudentNoteCard
                        key={String(note._id)}
                        note={note}
                        session={note.sessionId ? sessionById.get(note.sessionId) : undefined}
                        onEdit={() => onEditNote(note)}
                        onDelete={() => onDeleteNote(note._id)}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StudentNoteCard({
  note,
  session,
  onEdit,
  onDelete,
}: {
  note: StudentNoteDoc;
  session?: SessionDoc;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const updated = note.updatedAt !== note.createdAt;

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
              {note.type === "session" ? "Session note" : "General note"}
            </span>
            {note.title ? (
              <span className="truncate text-sm font-semibold text-white">
                {note.title}
              </span>
            ) : null}
          </div>
          {session ? (
            <div className="mt-2 text-sm text-slate-300">
              Linked session: {formatDateTime(session.startAt)}
            </div>
          ) : null}
          <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-200">
            {note.content}
          </div>
          <div className="mt-3 space-y-1 text-xs text-slate-400">
            <div>Created {formatDateTime(note.createdAt)}</div>
            {updated ? <div>Updated {formatDateTime(note.updatedAt)}</div> : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            Edit Note
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            Delete Note
          </Button>
        </div>
      </div>
    </div>
  );
}

function SessionDetailsDialog({
  open,
  onOpenChange,
  session,
  notes,
  submitting,
  onEdit,
  onComplete,
  onCancel,
  onPostpone,
  onDelete,
  onAddNote,
  onEditNote,
  onDeleteNote,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  session?: SessionDoc;
  notes: StudentNoteDoc[];
  submitting: boolean;
  onEdit: (session: SessionDoc) => void;
  onComplete: (sessionId: Id<"sessions">) => void;
  onCancel: (sessionId: Id<"sessions">) => void;
  onPostpone: (sessionId: Id<"sessions">) => void;
  onDelete: (sessionId: Id<"sessions">) => void;
  onAddNote: (session: SessionDoc) => void;
  onEditNote: (note: StudentNoteDoc) => void;
  onDeleteNote: (noteId: Id<"studentNotes">) => void;
}) {
  if (!session) return null;
  const isScheduled = session.status === "scheduled";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto border-white/10 bg-slate-950/95 text-foreground">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-3 pr-8">
            <DialogTitle>Session details</DialogTitle>
            <StatusTag status={session.status} />
          </div>
          <DialogDescription>
            Full session record and linked notes for {session.studentName}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
            <div className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Date and time
            </div>
            <div className="mt-2 font-semibold text-white">
              {formatDateTime(session.startAt)}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Duration
            </div>
            <div className="mt-2 font-semibold text-white">
              {session.durationMinutes} minutes
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-[0.25em] text-slate-500">
            Session note
          </div>
          <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">
            {session.note || "No session note added."}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">Linked notes</div>
              <div className="text-xs text-slate-400">
                {notes.length} note{notes.length === 1 ? "" : "s"} linked to this session.
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => onAddNote(session)}>
              Add note
            </Button>
          </div>
          {notes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
              No linked notes yet.
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={String(note._id)}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-white">
                      {note.title || "Session note"}
                    </div>
                    <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">
                      {note.content}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Updated {formatDateTime(note.updatedAt)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEditNote(note)}>
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDeleteNote(note._id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="gap-2 sm:flex-col sm:items-stretch">
          {isScheduled ? (
            <>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => onEdit(session)}
                  disabled={submitting}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onPostpone(session._id)}
                  disabled={submitting}
                >
                  Postpone
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onCancel(session._id)}
                  disabled={submitting}
                >
                  Cancel session
                </Button>
                <Button
                  onClick={() => onComplete(session._id)}
                  disabled={submitting}
                >
                  Mark done
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                <span className="text-xs text-slate-500">
                  Permanent deletion is irreversible. Canceling preserves history.
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(session._id)}
                  disabled={submitting}
                >
                  Permanently delete
                </Button>
              </div>
            </>
          ) : (
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CancelSessionDialog({
  open,
  onOpenChange,
  session,
  reason,
  setReason,
  onConfirm,
  submitting,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  session?: SessionDoc;
  reason: string;
  setReason: Dispatch<SetStateAction<string>>;
  onConfirm: () => void;
  submitting: boolean;
}) {
  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl border-white/10 bg-slate-950/95 text-foreground">
        <DialogHeader>
          <DialogTitle>Cancel session?</DialogTitle>
          <DialogDescription>
            The session will stay in history as canceled and can still be viewed.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          <div className="font-semibold text-white">{session.studentName}</div>
          <div className="mt-1">{formatDateTime(session.startAt)}</div>
        </div>
        <Field label="Cancellation reason (optional)">
          <textarea
            className={cn(fieldClass, "min-h-24 pt-2")}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Add context for the cancellation history."
          />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep session
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={submitting}>
            {submitting ? "Canceling..." : "Cancel session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SessionCompletionDialog({
  open,
  onOpenChange,
  session,
  draft,
  setDraft,
  onSave,
  submitting,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  session?: SessionDoc;
  draft: SessionCompletionDraft;
  setDraft: Dispatch<SetStateAction<SessionCompletionDraft>>;
  onSave: () => void;
  submitting: boolean;
}) {
  if (!session) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-white/10 bg-slate-950/95 text-foreground">
        <DialogHeader>
          <DialogTitle>Mark session done</DialogTitle>
          <DialogDescription>
            Add a short note now so the outcome is saved with the session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm text-slate-300">
            <div className="font-semibold text-white">{session.studentName}</div>
            <div className="mt-1">{formatDateTime(session.startAt)}</div>
            <div className="mt-1">{session.durationMinutes} minutes</div>
          </div>

          <Field label="Session note title">
            <Input
              className={fieldClass}
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Optional short title"
            />
          </Field>

          <Field label="What happened in this session?">
            <textarea
              className={cn(fieldClass, "min-h-32 pt-2")}
              value={draft.content}
              onChange={(event) =>
                setDraft((current) => ({ ...current, content: event.target.value }))
              }
              placeholder="Discussed topics, progress, homework, blockers, and next steps."
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={submitting}>
            Mark done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MetricCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: number | string;
  detail: string;
  accent: "orange" | "emerald" | "blue" | "rose" | "amber" | "slate";
}) {
  const accentClass = {
    orange: "text-orange-300",
    emerald: "text-emerald-300",
    blue: "text-sky-300",
    rose: "text-rose-300",
    amber: "text-amber-300",
    slate: "text-slate-300",
  }[accent];

  return (
    <Card className="relative overflow-hidden border-white/10 bg-white/5">
      <div className="absolute right-0 top-0 h-16 w-16 rounded-bl-full bg-white/5" />
      <CardHeader className="pb-3">
        <CardDescription className="uppercase tracking-[0.25em] text-slate-400">
          {label}
        </CardDescription>
        <CardTitle className={cn("text-3xl font-black tracking-tight", accentClass)}>
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-sm text-slate-400">{detail}</CardContent>
    </Card>
  );
}

function StudentCompactCard({
  row,
  onAddSlot,
}: {
  row: StudentRow;
  onAddSlot: (studentId?: Id<"students">) => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/35 p-4 shadow-xl shadow-black/20">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-lg font-black text-orange-300">
          {row.student.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300">
              #{row.student.order.toString().padStart(2, "0")}
            </span>
            <StatusTag status={row.statusTone === "green" ? "done" : "scheduled"} />
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-semibold",
                leadSourceBadgeClass(row.student.leadSource ?? ""),
              )}
            >
              {displayLeadSource(row.student)}
            </span>
            {row.noteCount > 0 ? (
              <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-200">
                {row.noteCount} note{row.noteCount === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 truncate text-base font-semibold text-white">
            {row.student.name}
          </h3>
          <div className="mt-2 text-sm text-slate-300">
            {row.upcomingSessions[0]
              ? formatDateTime(row.upcomingSessions[0].startAt)
              : "No sessions booked"}
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <StatChip label="Done" value={row.doneSessions} />
        <StatChip label="Left" value={row.remainingSessions} />
        <StatChip
          label="Paid"
          value={formatCurrency(row.fee?.amountPaid ?? 0)}
        />
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-400 via-amber-300 to-emerald-300"
          style={{ width: `${row.progressPercent}%` }}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => onAddSlot(row.student._id)}>
          Add Slot
        </Button>
        <Button variant="outline" size="sm">
          WA Group
        </Button>
      </div>
    </div>
  );
}

function StudentFullCard({
  row,
  onAddSlot,
  onFocusStudent,
}: {
  row: StudentRow;
  onAddSlot: (studentId?: Id<"students">) => void;
  onFocusStudent: (studentId: Id<"students">) => void;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border p-4 shadow-xl shadow-black/20",
        row.statusTone === "green"
          ? "border-emerald-400/30 bg-gradient-to-b from-emerald-500/10 to-slate-950/35"
          : "border-amber-400/30 bg-gradient-to-b from-amber-500/10 to-slate-950/35",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-lg font-black text-orange-300">
          {row.student.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300">
              #{row.student.order.toString().padStart(2, "0")}
            </span>
            <StatusTag status={row.statusTone === "green" ? "done" : "scheduled"} />
            <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
              Active
            </span>
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-semibold",
                leadSourceBadgeClass(row.student.leadSource ?? ""),
              )}
            >
              {displayLeadSource(row.student)}
            </span>
            {row.noteCount > 0 ? (
              <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-200">
                {row.noteCount} note{row.noteCount === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 truncate text-lg font-semibold text-white">
            {row.student.name}
          </h3>
          <div className="mt-2 text-sm text-slate-300">
            {row.upcomingSessions[0]
              ? formatDateTime(row.upcomingSessions[0].startAt)
              : "No sessions booked"}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <StatChip label="Done" value={row.doneSessions} />
        <StatChip label="Left" value={row.remainingSessions} />
        <StatChip label="Paid" value={formatCurrency(row.fee?.amountPaid ?? 0)} />
      </div>

      {row.fee?.amountDue ? (
        <div className="mt-3 text-sm text-amber-300">
          {formatCurrency(row.fee.amountDue)} due {formatDateOnly(row.fee.nextDueOn)}
        </div>
      ) : (
        <div className="mt-3 text-sm text-emerald-300">Fully paid</div>
      )}

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-400 via-amber-300 to-emerald-300"
          style={{ width: `${row.progressPercent}%` }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => onAddSlot(row.student._id)}>
          Add Slot
        </Button>
        <Button variant="outline" size="sm" onClick={() => onFocusStudent(row.student._id)}>
          View
        </Button>
      </div>
    </div>
  );
}

function StatusTag({
  status,
}: {
  status: "done" | "scheduled" | "canceled" | "postponed";
}) {
  const styles: Record<
    "done" | "scheduled" | "canceled" | "postponed",
    string
  > = {
    done: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
    scheduled: "border-orange-400/20 bg-orange-500/10 text-orange-100",
    canceled: "border-rose-400/20 bg-rose-500/10 text-rose-100",
    postponed: "border-amber-400/20 bg-amber-500/10 text-amber-100",
  };

  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-medium capitalize",
        styles[status],
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function StatChip({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-xs uppercase tracking-[0.25em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function toDateInputValue(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toTimeInputValue(timestamp: number) {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}
