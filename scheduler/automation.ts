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

function getEventTime(event: any): string | null {
  if (!event.start?.dateTime) {
    return null;
  }

  const dateTime = new Date(event.start.dateTime);

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(dateTime);
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
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getCurrentIndiaTime(): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

function isSixAMIndia(): boolean {
  return getCurrentIndiaTime() === "06:00";
}

function isScheduledTimeReached(
  scheduledDate: string,
  scheduledTime: string | null
): boolean {
  if (!scheduledTime) {
    return false;
  }

  const today = getTodayInIndia();
  const currentTime = getCurrentIndiaTime();

  if (scheduledDate !== today) {
    return false;
  }

  return currentTime >= scheduledTime;
}

/*
 * Birthday automation
 *
 * Birthdays are taken from Employee.date_of_birth.
 * Birthday emails are always scheduled for 6:00 AM IST.
 */
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

      const birthMonthDay =
        `${String(employee.date_of_birth.getUTCMonth() + 1).padStart(2, "0")}-${String(
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
          scheduled_time: "06:00",
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

/*
 * Google Calendar automation
 *
 * Festival:
 *   Automatically sends to ALL employees at 6:00 AM IST.
 *
 * Other/custom event:
 *   Uses the Google Calendar event's date/time.
 *   It does NOT wait for 6:00 AM.
 */
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

      let scheduledTime: string | null = null;

      if (eventType === "Festival") {
        scheduledTime = "06:00";
      } else if (eventType === "Other") {
        scheduledTime = getEventTime(event);

        /*
         * Google Calendar all-day events have no dateTime.
         * For an all-day custom event, use 06:00 AM as a safe default.
         */
        if (!scheduledTime) {
          scheduledTime = "06:00";
        }
      }

      console.log("------------------------------------");
      console.log(`[Automation] Event: ${eventName}`);
      console.log(`[Automation] Type: ${eventType}`);
      console.log(`[Automation] Event date: ${eventDate}`);
      console.log(
        `[Automation] Scheduled time: ${scheduledTime ?? "Not set"}`
      );

      /*
       * Birthday events from Google Calendar are ignored.
       * Birthday automation comes from employee.date_of_birth.
       */
      if (eventType === "Birthday") {
        console.log(
          "[Automation] Birthday event ignored because birthdays are handled from employee date_of_birth."
        );
        continue;
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
          `[Automation] Already scheduled: ${eventName}`
        );
        continue;
      }

      await prisma.automationRun.create({
        data: {
          automation_key: automationKey,
          event_name: eventName,
          event_date: eventDate,
          scheduled_time: scheduledTime,
          employee_id: null,
          status: "Scheduled",
        },
      });

      if (eventType === "Festival") {
        console.log(
          `[Automation] Festival scheduled for ALL employees at 06:00 AM IST: ${eventName}`
        );
      } else {
        console.log(
          `[Automation] Custom event scheduled for ${eventDate} ${scheduledTime} IST: ${eventName}`
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

/*
 * Birthday and Festival:
 *   Only execute at 06:00 AM IST.
 *
 * Other/custom:
 *   Execute at their own scheduled date/time.
 */
async function isRunReady(run: any): Promise<boolean> {
  const today = getTodayInIndia();

  if (run.event_date !== today) {
    return false;
  }

  const eventName = String(run.event_name).toLowerCase();

  const isBirthday =
    run.employee_id !== null ||
    eventName.includes("birthday");

  const isFestival =
    eventName.includes("diwali") ||
    eventName.includes("deepavali") ||
    eventName.includes("pongal") ||
    eventName.includes("christmas") ||
    eventName.includes("new year") ||
    eventName.includes("onam") ||
    eventName.includes("holi") ||
    eventName.includes("eid") ||
    eventName.includes("ramadan") ||
    eventName.includes("dussehra") ||
    eventName.includes("navratri") ||
    eventName.includes("ganesh chaturthi") ||
    eventName.includes("janmashtami") ||
    eventName.includes("raksha bandhan") ||
    eventName.includes("ugadi") ||
    eventName.includes("vishu") ||
    eventName.includes("baisakhi");

  if (isBirthday || isFestival) {
    return isSixAMIndia();
  }

  return isScheduledTimeReached(
    run.event_date,
    run.scheduled_time ?? null
  );
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

    console.log(
      `[Execution] Found ${scheduledRuns.length} scheduled job(s).`
    );

    for (const run of scheduledRuns) {
      console.log("------------------------------------");

      console.log(
        `[Execution] Job ${run.id}: ${run.event_name}`
      );

      console.log(
        `[Execution] Date: ${run.event_date}`
      );

      console.log(
        `[Execution] Scheduled time: ${
          run.scheduled_time ?? "Not set"
        }`
      );

      if (!(await isRunReady(run))) {
        console.log(
          `[Execution] Not ready yet: ${run.event_name}`
        );
        continue;
      }

      console.log(
        `[Execution] READY TO PROCESS: ${run.event_name}`
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

        const eventNameLower =
          run.event_name.toLowerCase();

        const eventType =
          run.employee_id !== null ||
          eventNameLower.includes("birthday")
            ? "Birthday"
            : detectEventType(run.event_name);

        for (const employee of employees) {
          console.log(
            `[Execution] Generating email for: ${employee.name}`
          );

          const generatedEmail =
            await generateAutomationEmail({
              eventName: run.event_name,
              eventType,
              eventDate: run.event_date,
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
console.log("Checking Google Calendar events every minute...");
console.log("Birthday/Festival send time: 06:00 AM IST");
console.log(
  "Other events: send at their scheduled date/time."
);

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