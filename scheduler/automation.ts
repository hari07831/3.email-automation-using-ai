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
  if (eventType !== "Festival") {
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

  await prisma.automationRun.create({
    data: {
      automation_key: automationKey,
      event_name: event.summary ?? "Untitled Event",
      event_date: eventDate,
      employee_id: null,
      status: "Scheduled",
    },
  });

  console.log(
    `[Automation] Scheduled festival successfully: ${event.summary}`
  );

  console.log(
    `[Automation] Scheduled time: ${eventDate} 06:00 AM IST`
  );
}

function getTodayInIndia(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function scheduleBirthdayJobs() {
  try {
    const today = getTodayInIndia();

    const todayMonthDay = today.substring(5);

    console.log(
      `[Birthday] Checking employee birthdays for ${today}`
    );

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

      const birthMonthDay =
        `${String(
          employee.date_of_birth.getUTCMonth() + 1
        ).padStart(2, "0")}-${String(
          employee.date_of_birth.getUTCDate()
        ).padStart(2, "0")}`;

      if (birthMonthDay !== todayMonthDay) {
        continue;
      }

      console.log(
        `[Birthday] Birthday found for: ${employee.name}`
      );

      const automationKey =
        `birthday:${employee.id}:${today}`;

      const existingRun =
        await prisma.automationRun.findUnique({
          where: {
            automation_key: automationKey,
          },
        });

      if (existingRun) {
        console.log(
          `[Birthday] Already scheduled: ${employee.name}`
        );
        continue;
      }

      await prisma.automationRun.create({
        data: {
          automation_key: automationKey,
          event_name: `Birthday wishes for ${employee.name}`,
          event_date: today,
          employee_id: employee.id,
          status: "Scheduled",
        },
      });

      console.log(
        `[Birthday] Scheduled successfully: ${employee.name}`
      );

      console.log(
        `[Birthday] Scheduled time: ${today} 06:00 AM IST`
      );
    }
  } catch (error) {
    console.error(
      "[Birthday] Error checking employee birthdays:",
      error
    );
  }
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
          "[Automation] Birthday event ignored because birthdays are handled from employee date_of_birth."
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

function getDatabaseDate(run: any): string {
  return run.event_date;
}

async function executeScheduledAutomations() {
  try {
    const today = getTodayInIndia();

    console.log(
      `[Execution] Checking scheduled jobs for ${today}`
    );

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
console.log("Checking employee birthdays every minute...");
console.log("Checking Google Calendar festivals every minute...");
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

    await scheduleBirthdayJobs();
    await checkCalendar();
    await executeScheduledAutomations();
  },
  {
    timezone: "Asia/Kolkata",
  }
);