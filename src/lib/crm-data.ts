export const totalCourseFee = 400;

export type SeedStudent = {
  order: number;
  name: string;
  initials: string;
  active: boolean;
  introDone: boolean;
  sessionGoal: number;
  note: string;
};

export type SeedSession = {
  studentName: string;
  startAt: string;
  durationMinutes: number;
  note: string;
};

export type SeedFeeAccount = {
  studentName: string;
  totalFee: number;
  amountPaid: number;
  amountDue: number;
  lastPaymentOn: string | null;
  nextDueOn: string | null;
  note: string;
};

export const studentSeedData: SeedStudent[] = [
  {
    order: 1,
    name: "Mian Saad Hafeez",
    initials: "MS",
    active: true,
    introDone: true,
    sessionGoal: 12,
    note: "Foundational student record seeded from the local CRM.",
  },
  {
    order: 2,
    name: "Kamran Choudhary",
    initials: "KC",
    active: true,
    introDone: true,
    sessionGoal: 12,
    note: "Primary recurring slot already confirmed.",
  },
  {
    order: 3,
    name: "Adnan Zafat",
    initials: "AZ",
    active: true,
    introDone: true,
    sessionGoal: 12,
    note: "Sunday night coaching slot seeded for the calendar.",
  },
  {
    order: 4,
    name: "Ramanjot",
    initials: "R",
    active: true,
    introDone: true,
    sessionGoal: 12,
    note: "Kept in the same order as the existing dashboard cards.",
  },
  {
    order: 5,
    name: "Abdul Rehman",
    initials: "AR",
    active: true,
    introDone: true,
    sessionGoal: 12,
    note: "Paid in full.",
  },
  {
    order: 6,
    name: "Waleed Iftikhar",
    initials: "WI",
    active: true,
    introDone: true,
    sessionGoal: 12,
    note: "Partial payment recorded with a concrete due date.",
  },
  {
    order: 7,
    name: "Arslan",
    initials: "A",
    active: true,
    introDone: true,
    sessionGoal: 12,
    note: "Partial payment recorded; payment date can be filled in later.",
  },
  {
    order: 8,
    name: "Touqeer",
    initials: "T",
    active: true,
    introDone: true,
    sessionGoal: 12,
    note: "Paid in full.",
  },
];

export const sessionSeedData: SeedSession[] = [
  {
    studentName: "Kamran Choudhary",
    startAt: "2026-06-06T22:00:00+01:00",
    durationMinutes: 60,
    note: "Saturday night mentorship session.",
  },
  {
    studentName: "Adnan Zafat",
    startAt: "2026-06-07T21:00:00+01:00",
    durationMinutes: 60,
    note: "Sunday evening mentorship session.",
  },
];

export const feeSeedData: SeedFeeAccount[] = [
  {
    studentName: "Mian Saad Hafeez",
    totalFee: 400,
    amountPaid: 400,
    amountDue: 0,
    lastPaymentOn: null,
    nextDueOn: null,
    note: "Paid in full.",
  },
  {
    studentName: "Kamran Choudhary",
    totalFee: 400,
    amountPaid: 400,
    amountDue: 0,
    lastPaymentOn: null,
    nextDueOn: null,
    note: "Paid in full.",
  },
  {
    studentName: "Adnan Zafat",
    totalFee: 400,
    amountPaid: 400,
    amountDue: 0,
    lastPaymentOn: null,
    nextDueOn: null,
    note: "Paid in full.",
  },
  {
    studentName: "Ramanjot",
    totalFee: 400,
    amountPaid: 400,
    amountDue: 0,
    lastPaymentOn: null,
    nextDueOn: null,
    note: "Paid in full.",
  },
  {
    studentName: "Abdul Rehman",
    totalFee: 400,
    amountPaid: 400,
    amountDue: 0,
    lastPaymentOn: null,
    nextDueOn: null,
    note: "Paid in full.",
  },
  {
    studentName: "Waleed Iftikhar",
    totalFee: 400,
    amountPaid: 200,
    amountDue: 200,
    lastPaymentOn: "2026-05-29",
    nextDueOn: "2026-06-29",
    note: "Second instalment due next month.",
  },
  {
    studentName: "Arslan",
    totalFee: 400,
    amountPaid: 200,
    amountDue: 200,
    lastPaymentOn: null,
    nextDueOn: "2026-07-01",
    note: "Payment date still needs to be logged.",
  },
  {
    studentName: "Touqeer",
    totalFee: 400,
    amountPaid: 400,
    amountDue: 0,
    lastPaymentOn: null,
    nextDueOn: null,
    note: "Paid in full.",
  },
];

export function parseLocalDateTime(date: string, time: string) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);

  if (!dateMatch || !timeMatch) {
    throw new Error("Choose a valid date and time.");
  }

  const [, yearValue, monthValue, dayValue] = dateMatch;
  const [, hourValue, minuteValue] = timeMatch;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  const parsed = new Date(year, month - 1, day, hour, minute, 0, 0);

  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day ||
    parsed.getHours() !== hour ||
    parsed.getMinutes() !== minute
  ) {
    throw new Error("That local date and time does not exist in this timezone.");
  }

  return parsed.getTime();
}

export function parseSessionDuration(value: string | number) {
  const duration = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(duration) || duration < 15 || duration > 480) {
    throw new Error("Session duration must be a whole number from 15 to 480 minutes.");
  }
  return duration;
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function toSafeDate(value: string | number | Date) {
  if (value instanceof Date) return value;
  return new Date(value);
}

export function formatDateOnly(value: string | number | null) {
  if (value === null) return "Date not logged";
  const date =
    typeof value === "string"
      ? new Date(`${value}T12:00:00`)
      : toSafeDate(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: number | string | null) {
  if (value === null) return "Date not logged";
  const date = typeof value === "number" ? new Date(value) : new Date(value);
  const formatted = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  return formatted.replace(/\b(am|pm)\b/i, (match) => match.toUpperCase());
}

export function formatMonthYear(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(value);
}

export function formatDayNumber(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
  }).format(value);
}

export function formatWeekday(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
  }).format(value);
}

export function localDateKey(value: number) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function buildMonthGrid(month: Date) {
  const firstDay = startOfMonth(month);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - startOffset);

  const cells: Date[] = [];
  for (let index = 0; index < 42; index += 1) {
    const cell = new Date(gridStart);
    cell.setDate(gridStart.getDate() + index);
    cells.push(cell);
  }

  return cells;
}

export function isSameMonth(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth()
  );
}

export function isSameDay(left: number, right: number) {
  return localDateKey(left) === localDateKey(right);
}

export function toIsoDateOnly(value: number) {
  return new Date(value).toISOString().slice(0, 10);
}
