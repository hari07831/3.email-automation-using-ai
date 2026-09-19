import "dotenv/config";
import cron from "node-cron";
import { getUpcomingCalendarEvents } from "./calendar";
import { prisma } from "@/lib/prisma";
import { generateAutomationEmail } from "@/lib/ai";
import { sendAutomationEmail } from "@/lib/email";

type AutomationEventType = "Festival" | "Birthday" | "Other";

function detectEventType(eventName: string): AutomationEventType {
  const name = eventName.toLowerCase();

  const festivalKeywords = [
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

  if (festivalKeywords.some((keyword) => name.includes(keyword))) {
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
    return event.start.dateTime;
  }

  return null;
}

function getDateOnly(eventDate: string): string {
  return eventDate.substring(0, 10);
}

function getAutomationKey(
  event: any,
  eventType: AutomationEventType,
  eventDate: string
): string {
  const googleEventId = event.id ?? event.summary ?? "unknown";

  if (eventType === "Birthday") {
    return `birthday:${googleEventId}:${eventDate}`;
  }

  if (eventType === "Festival") {
    return `festival:${googleEventId}:${eventDate}:all`;
  }

  return `other:${googleEventId}:${eventDate}`;
}

async function scheduleEvent(
  event: any,
  eventType: AutomationEventType,
  eventDate: string
) {
  if (eventType === "Other") {
    return;
  }

  const automationKey = getAutomationKey(
    event,
    eventType,
    eventDate
  );

  const existingRun = await prisma.automationRun.findUnique({
    where: {
      automation_key: automationKey,
    },
  });

  if (existingRun) {
    console.log(
      `[Automation] Already scheduled: ${event.summary}`
    );
    return;
  }

  let employeeId: number | null = null;

  if (eventType === "Birthday") {
    const eventName = event.summary ?? "";

 const birthdayPrefix = /^birthday\s+of\s+/i;
 const birthdayWishesPrefix = /^birthday\s+wishes\s+for\s+/i;
 const birthdayWishesToPrefix = /^birthday\s+wishes\s+to\s+/i;

const employeeName = eventName
  .replace(birthdayPrefix, "")
  .replace(birthdayWishesPrefix, "")
  .replace(birthdayWishesToPrefix, "")
  .trim();

    if (!employeeName) {
      console.log(
        `[Automation] Could not identify employee from: ${eventName}`
      );
      return;
    }

    console.log(
      `[Automation] Looking for employee: ${employeeName}`
    );

    const employees = await prisma.employee.findMany();

    const normalizedEmployeeName = employeeName
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

    const employee = employees.find((item) => {
      const normalizedDatabaseName = item.name
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

      return (
        normalizedDatabaseName === normalizedEmployeeName ||
        normalizedDatabaseName.startsWith(
          normalizedEmployeeName + " "
        )
      );
    });

    if (!employee) {
      console.log(
        `[Automation] Employee not found: ${employeeName}`
      );
      return;
    }

    employeeId = employee.id;

    console.log(
      `[Automation] Employee matched: ${employee.name}`
    );
  }

  await prisma.automationRun.create({
    data: {
      automation_key: automationKey,
      event_name: event.summary ?? "Untitled Event",
      event_date: eventDate,
      employee_id: employeeId,
      status: "Scheduled",
    },
  });

  console.log(
    `[Automation] Scheduled successfully: ${event.summary}`
  );

  console.log(
    `[Automation] Scheduled time: ${eventDate} 06:00 AM IST`
  );
}

async function checkCalendar() {
  try {
    const events = await getUpcomingCalendarEvents();

    console.log(
      `[Calendar] Found ${events.length} upcoming event(s).`
    );

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

      console.log("------------------------------------");
      console.log(`[Automation] Event: ${eventName}`);
      console.log(`[Automation] Type: ${eventType}`);
      console.log(`[Automation] Event date: ${eventDate}`);

      if (eventType === "Festival") {
        console.log(
          "[Automation] Target: ALL employees"
        );

        await scheduleEvent(
          event,
          eventType,
          eventDate
        );
      } else if (eventType === "Birthday") {
        console.log(
          "[Automation] Target: Matching employee"
        );

        await scheduleEvent(
          event,
          eventType,
          eventDate
        );
      } else {
        console.log(
          "[Automation] No automatic email configured."
        );
      }
    }
  } catch (error) {
    console.error(
      "[Automation] Calendar error:",
      error
    );
  }
}

function isAutomationTime(): boolean {
  const testMode =
    process.env.AUTOMATION_TEST_MODE === "true";

  if (testMode) {
    console.log(
      "[Execution] TEST MODE enabled - ignoring 6:00 AM restriction."
    );

    return true;
  }

  const now = new Date();

  const indiaTime = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const hour = Number(
    indiaTime.find((part) => part.type === "hour")?.value
  );

  const minute = Number(
    indiaTime.find((part) => part.type === "minute")?.value
  );

  return hour === 6 && minute === 0;
}

function getTodayInIndia(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getDatabaseDate(run: any): string {
  return run.event_date;
}


async function executeScheduledAutomations() {
  try {
    const today = getTodayInIndia();

    console.log(
      `[Execution] Checking scheduled jobs for ${today}`
    );

    // Get all scheduled jobs first.
    // We compare their dates in application code to avoid
    // MySQL DATE / JavaScript timezone conversion problems.
    const scheduledRuns =
      await prisma.automationRun.findMany({
        where: {
          status: "Scheduled",
        },
        orderBy: {
          id: "asc",
        },
      });

    const todayRuns = scheduledRuns.filter((run) => {
      const databaseDate = getDatabaseDate(run);

      console.log(
        `[Execution] Job ${run.id} date: ${databaseDate}`
      );

      return databaseDate === today;
    });

    console.log(
      `[Execution] Found ${todayRuns.length} job(s) for today.`
    );

    if (todayRuns.length === 0) {
      return;
    }

    if (!isAutomationTime()) {
      console.log(
        "[Execution] It is not 6:00 AM IST yet. Waiting..."
      );
      return;
    }

    for (const run of todayRuns) {
      console.log("------------------------------------");

      console.log(
        `[Execution] READY TO PROCESS: ${run.event_name}`
      );

      console.log(
        `[Execution] Automation ID: ${run.id}`
      );

      console.log(
        `[Execution] Employee ID: ${
          run.employee_id ?? "ALL EMPLOYEES"
        }`
      );

      try {
        await prisma.automationRun.update({
          where: {
            id: run.id,
          },
          data: {
            status: "Processing",
          },
        });

        console.log(
          `[Execution] ${run.event_name} changed to Processing.`
        );

        const employees =
          run.employee_id !== null
            ? await prisma.employee.findMany({
                where: {
                  id: run.employee_id,
                },
              })
            : await prisma.employee.findMany();

        if (employees.length === 0) {
          throw new Error(
            `No employees found for automation: ${run.event_name}`
          );
        }

        for (const employee of employees) {
          console.log(
            `[Execution] Generating email for: ${employee.name}`
          );

          const generatedEmail =
            await generateAutomationEmail({
              eventName: run.event_name,
              eventType:
                run.employee_id !== null
                  ? "Birthday"
                  : "Festival",
              eventDate: today,
              employeeName: employee.name,
            });

          console.log(
            `[Execution] AI email generated for: ${employee.name}`
          );

          console.log(
            `[Execution] Subject: ${generatedEmail.subject}`
          );

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

          console.log(
            `[Execution] Email completed for: ${employee.name}`
          );
        }

        await prisma.automationRun.update({
          where: {
            id: run.id,
          },
          data: {
            status: "Completed",
          },
        });

        console.log(
          `[Execution] Automation completed: ${run.event_name}`
        );
      } catch (error) {
        console.error(
          `[Execution] Failed: ${run.event_name}`,
          error
        );

        await prisma.automationRun.update({
          where: {
            id: run.id,
          },
          data: {
            status: "Failed",
          },
        });

        console.log(
          `[Execution] ${run.event_name} marked as Failed.`
        );
      }
    }
  } catch (error) {
    console.error(
      "[Execution] Error:",
      error
    );
  }
}

console.log("====================================");
console.log("Employee Email Automation Scheduler");
console.log("====================================");
console.log("Scheduler started.");
console.log("Checking Google Calendar every minute...");
console.log("Automatic send time: 06:00 AM IST");

if (process.env.AUTOMATION_TEST_MODE === "true") {
  console.log(
    "TEST MODE: 6:00 AM restriction is disabled."
  );
}

cron.schedule(
  "* * * * *",
  async () => {
    const now = new Date();

    console.log(
      `[Scheduler] ${now.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      })}`
    );

    await checkCalendar();
    await executeScheduledAutomations();
  },
  {
    timezone: "Asia/Kolkata",
  }
);