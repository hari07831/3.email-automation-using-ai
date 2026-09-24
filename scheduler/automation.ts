import "dotenv/config";
import cron from "node-cron";
import { getUpcomingCalendarEvents } from "./calendar";
import { prisma } from "@/lib/prisma";
import { generateAutomationEmail } from "@/lib/ai";
import { sendAutomationEmail } from "@/lib/email";

type AutomationEventType = "Festival" | "Birthday" | "Other";

const FESTIVAL_KEYWORDS = [
  "diwali",
  "deepavali",
  "pongal",
  "christmas",
  "new year",
  "onam",
  "holi",
  "eid",
  "ramadan",
  "dussehra",
  "navratri",
  "ganesh chaturthi",
  "janmashtami",
  "raksha bandhan",
  "ugadi",
  "vishu",
  "baisakhi",
];

function detectEventType(eventName: string): AutomationEventType {
  const name = eventName.toLowerCase();

  if (FESTIVAL_KEYWORDS.some((keyword) => name.includes(keyword))) {
    return "Festival";
  }

  if (
    name.includes("birthday") ||
    name.includes("birth day") ||
    name.includes("b'day")
  ) {
    return "Birthday";
  }

  return "Other";
}

function getEventDate(event: any): string | null {
  if (event.start?.date) {
    return event.start.date;
  }

  if (event.start?.dateTime) {
    const dateTime = new Date(event.start.dateTime);

    const parts = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(dateTime);

    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
  }

  return null;
}

function getDateOnly(eventDate: string): string {
  return eventDate.substring(0, 10);
}

function getEventTime(event: any): string | null {
  if (!event.start?.dateTime) {
    return null;
  }

  const dateTime = new Date(event.start.dateTime);

  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(dateTime);

  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;

  if (!hour || !minute) {
    return null;
  }

  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

function getAutomationKey(
  event: any,
  eventType: AutomationEventType,
  eventDate: string
): string {
  const googleEventId = event.id ?? event.summary ?? "unknown";

  return `${eventType.toLowerCase()}:${googleEventId}:${eventDate}`;
}

function getTodayInIndia(): string {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Could not determine today's date in India.");
  }

  return `${year}-${month}-${day}`;
}

function getCurrentIndiaTime(): string {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;

  if (!hour || !minute) {
    throw new Error("Could not determine the current time in India.");
  }

  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

function timeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return hour * 60 + minute;
}

function isSixAMIndia(): boolean {
  return timeToMinutes(getCurrentIndiaTime())! >= 6 * 60;
}

function isScheduledTimeReached(
  scheduledDate: string,
  scheduledTime: string | null
): boolean {
  if (!scheduledTime) {
    return false;
  }

  const today = getTodayInIndia();
  const currentMinutes = timeToMinutes(getCurrentIndiaTime());
  const scheduledMinutes = timeToMinutes(scheduledTime);

  if (scheduledDate.trim() !== today) {
    return false;
  }

  if (currentMinutes === null || scheduledMinutes === null) {
    console.error(
      `[Execution] Invalid time. Current: ${getCurrentIndiaTime()}, Scheduled: ${scheduledTime}`
    );
    return false;
  }

  return currentMinutes >= scheduledMinutes;
}

async function scheduleBirthdayJobs() {
  try {
    const today = getTodayInIndia();
    const todayMonthDay = today.substring(5);

    console.log(`[Birthday] Checking employee birthdays for ${today}`);

    const employees = await prisma.employee.findMany({
      where: {
        date_of_birth: {
          not: null,
        },
      },
    });

    console.log(
      `[Birthday] Checking ${employees.length} employee record(s).`
    );

    for (const employee of employees) {
      if (!employee.date_of_birth) {
        continue;
      }

      const birthMonthDay = `${String(
        employee.date_of_birth.getUTCMonth() + 1
      ).padStart(2, "0")}-${String(
        employee.date_of_birth.getUTCDate()
      ).padStart(2, "0")}`;

      if (birthMonthDay !== todayMonthDay) {
        continue;
      }

      console.log(`[Birthday] Birthday found for: ${employee.name}`);

      const automationKey = `birthday:${employee.id}:${today}`;

      const existingRun = await prisma.automationRun.findUnique({
        where: {
          automation_key: automationKey,
        },
      });

      if (existingRun) {
        console.log(`[Birthday] Already scheduled: ${employee.name}`);
        continue;
      }

      // FIXED: this line was "catch(e)({" which caused "e is not defined"
      await prisma.automationRun.create({
        data: {
          automation_key: automationKey,
          event_name: `Birthday wishes for ${employee.name}`,
          event_date: today,
          scheduled_time: "06:00",
          employee_id: employee.id,
          status: "Scheduled",
        },
      });

      console.log(`[Birthday] Scheduled successfully: ${employee.name}`);
      console.log(`[Birthday] Scheduled time: ${today} 06:00 AM IST`);
    }
  } catch (error) {
    console.error("[Birthday] Error checking employee birthdays:", error);
  }
}

async function checkCalendar() {
  try {
    const events = await getUpcomingCalendarEvents();

    console.log(`[Calendar] Found ${events.length} upcoming event(s).`);

    for (const event of events) {
      const eventName = event.summary ?? "Untitled Event";
      const rawEventDate = getEventDate(event);

      if (!rawEventDate) {
        console.log(
          `[Automation] Skipping "${eventName}" because no date was found.`
        );
        continue;
      }

      const eventDate = getDateOnly(rawEventDate);
      const eventType = detectEventType(eventName);

      let scheduledTime: string | null = null;

      if (eventType === "Festival") {
        scheduledTime = "06:00";
      } else if (eventType === "Other") {
        scheduledTime = getEventTime(event);
        if (!scheduledTime) scheduledTime = "06:00";
      }

      console.log("------------------------------------");
      console.log(`[Automation] Event: ${eventName}`);
      console.log(`[Automation] Type: ${eventType}`);
      console.log(`[Automation] Event date: ${eventDate}`);
      console.log(`[Automation] Scheduled time: ${scheduledTime ?? "Not set"}`);

      if (eventType === "Birthday") {
        console.log(
          "[Automation] Birthday event ignored because birthdays are handled from employee date_of_birth."
        );
        continue;
      }

      const automationKey = getAutomationKey(event, eventType, eventDate);

      let automationRun = await prisma.automationRun.findUnique({
        where: { automation_key: automationKey },
      });

      if (automationRun?.status === "Completed") {
        console.log(`[Automation] Already completed: ${eventName}`);
        continue;
      }

      if (automationRun?.status === "Processing") {
        console.log(`[Automation] Already processing: ${eventName}`);
        continue;
      }

      if (!automationRun) {
        automationRun = await prisma.automationRun.create({
          data: {
            automation_key: automationKey,
            event_name: eventName,
            event_date: eventDate,
            scheduled_time: scheduledTime,
            employee_id: null,
            status: "Scheduled",
          },
        });
        console.log(`[Automation] New event scheduled: ${eventName}`);
      } else {
        automationRun = await prisma.automationRun.update({
          where: { id: automationRun.id },
          data: {
            event_name: eventName,
            event_date: eventDate,
            scheduled_time: scheduledTime,
            status: "Scheduled",
          },
        });

        await prisma.automationRecipient.deleteMany({
          where: { automation_run_id: automationRun.id },
        });

        console.log(`[Automation] Re-queued existing event: ${eventName}`);
      }

      if (eventType === "Festival") {
        console.log(
          `[Automation] Festival will be sent to ALL employees: ${eventName}`
        );
      } else {
        const attendeeEmails = (event.attendees ?? [])
          .map((attendee: any) => attendee.email?.toLowerCase().trim())
          .filter(Boolean);

        const employees = await prisma.employee.findMany();

        const normalizedEventName = eventName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");

        const matchedEmployees = employees.filter((employee) => {
          const employeeEmail = employee.email.toLowerCase().trim();

          if (attendeeEmails.includes(employeeEmail)) return true;

          const normalizedEmployeeName = employee.name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");

          return (
            normalizedEmployeeName.length >= 5 &&
            normalizedEventName.includes(normalizedEmployeeName)
          );
        });

        if (matchedEmployees.length > 0) {
          await prisma.automationRecipient.createMany({
            data: matchedEmployees.map((employee) => ({
              automation_run_id: automationRun!.id,
              employee_id: employee.id,
            })),
            skipDuplicates: true,
          });

          console.log(
            `[Automation] Recipients saved: ${matchedEmployees
              .map((employee) => employee.name)
              .join(", ")}`
          );
        } else {
          console.log(
            `[Automation] No employee recipient matched for: ${eventName}`
          );
          console.log(
            "[Automation] Add the employee as a Google Calendar guest for this personal/group event."
          );
        }
      }

      console.log(
        `[Automation] Scheduled: ${eventName} for ${eventDate} ${
          scheduledTime ?? ""
        } IST`
      );
    }
  } catch (error) {
    console.error("[Automation] Calendar error:", error);
  }
}

async function isRunReady(run: any): Promise<boolean> {
  const today = getTodayInIndia();
  const runDate = String(run.event_date ?? "")
    .trim()
    .substring(0, 10);

  if (runDate !== today) {
    return false;
  }

  const eventName = String(run.event_name).toLowerCase();

  const isBirthday = run.employee_id !== null || eventName.includes("birthday");

  const isFestival = FESTIVAL_KEYWORDS.some((keyword) =>
    eventName.includes(keyword)
  );

  if (isBirthday || isFestival) {
    return isSixAMIndia();
  }

  return isScheduledTimeReached(runDate, run.scheduled_time ?? null);
}

async function executeScheduledAutomations() {
  try {
    const today = getTodayInIndia();

    console.log(`[Execution] Checking scheduled jobs for ${today}`);

    const scheduledRuns = await prisma.automationRun.findMany({
      where: {
        status: {
          in: ["Scheduled", "Failed"],
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    console.log(`[Execution] Found ${scheduledRuns.length} scheduled job(s).`);

    for (const run of scheduledRuns) {
      console.log("------------------------------------");

      console.log(`[Execution] Job ${run.id}: ${run.event_name}`);
      console.log(`[Execution] Date: ${run.event_date}`);
      console.log(
        `[Execution] Scheduled time: ${run.scheduled_time ?? "Not set"}`
      );

      if (!(await isRunReady(run))) {
        console.log(`[Execution] Not ready yet: ${run.event_name}`);
        continue;
      }

      console.log(`[Execution] READY TO PROCESS: ${run.event_name}`);

      try {
        await prisma.automationRun.update({
          where: {
            id: run.id,
          },
          data: {
            status: "Processing",
          },
        });

        console.log(`[Execution] ${run.event_name} changed to Processing.`);

        const eventNameLower = run.event_name.toLowerCase();

        const eventType =
          run.employee_id !== null || eventNameLower.includes("birthday")
            ? "Birthday"
            : detectEventType(run.event_name);

        let employees;

        if (eventType === "Birthday" && run.employee_id !== null) {
          // Birthday: send only to the employee whose birthday it is.
          employees = await prisma.employee.findMany({
            where: {
              id: run.employee_id,
            },
          });

          console.log(
            `[Execution] Birthday event. Sending only to the birthday employee.`
          );
        } else if (eventType === "Birthday") {
          throw new Error(
            `Birthday event has no employee assigned: ${run.event_name}`
          );
        } else {
          // All non-birthday events: send to every employee.
          employees = await prisma.employee.findMany();

          console.log(
            `[Execution] ${eventType} event. Sending to ALL employees.`
          );
        }

        if (employees.length === 0) {
          throw new Error(
            `No employees found for automation: ${run.event_name}`
          );
        }

        for (const employee of employees) {
          console.log(`[Execution] Generating email for: ${employee.name}`);

          const generatedEmail = await generateAutomationEmail({
            eventName: run.event_name,
            eventType,
            eventDate: run.event_date,
            employeeName: employee.name,
          });

          console.log(`[Execution] AI email generated for: ${employee.name}`);
          console.log(`[Execution] Subject: ${generatedEmail.subject}`);

          await sendAutomationEmail(
            employee.email,
            generatedEmail.subject,
            generatedEmail.body
          );

          await prisma.emailLog.create({
            data: {
              employee_id: employee.id,
              recipient_email: employee.email,
              subject: generatedEmail.subject,
              status: "Sent",
            },
          });

          console.log(`[Execution] Email completed for: ${employee.name}`);
        }

        await prisma.automationRun.update({
          where: {
            id: run.id,
          },
          data: {
            status: "Completed",
          },
        });

        console.log(`[Execution] Automation completed: ${run.event_name}`);
      } catch (error) {
        console.error(`[Execution] Failed: ${run.event_name}`, error);

        await prisma.automationRun.update({
          where: {
            id: run.id,
          },
          data: {
            status: "Failed",
          },
        });

        console.log(`[Execution] ${run.event_name} marked as Failed.`);
      }
    }
  } catch (error) {
    console.error("[Execution] Error:", error);
  }
}

console.log("====================================");
console.log("Employee Email Automation Scheduler");
console.log("====================================");
console.log("Scheduler started.");
console.log("Checking employee birthdays every minute...");
console.log("Checking Google Calendar events every minute...");
console.log("Birthday/Festival send time: 06:00 AM IST");
console.log("Other events: send at their scheduled date/time.");

// Overlap guard: if a run takes longer than 1 minute (AI + email sending),
// skip the next tick instead of running two copies at once
// (which could send duplicate emails).
let isRunning = false;

cron.schedule(
  "* * * * *",
  async () => {
    if (isRunning) {
      console.log("[Scheduler] Previous run still in progress. Skipping.");
      return;
    }

    isRunning = true;

    try {
      const now = new Date();

      console.log(
        `[Scheduler] ${now.toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        })}`
      );

      await scheduleBirthdayJobs();
      await checkCalendar();
      await executeScheduledAutomations();
    } finally {
      isRunning = false;
    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);
