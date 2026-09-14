import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const emailLogs = await prisma.emailLog.findMany({
      orderBy: {
        sent_at: "desc",
      },
    });

    const employees = await prisma.employee.findMany();

    const statusData = emailLogs.map((log) => {
      const employee = employees.find(
        (item) => item.id === log.employee_id
      );

      return {
        id: log.id,
        name: employee?.name || "Unknown Employee",
        email: log.recipient_email,
        subject: log.subject,
        status: log.status,
        sentAt: log.sent_at,
      };
    });

    return Response.json({
      success: true,
      emailLogs: statusData,
    });
  } catch (error) {
    console.error("Email status error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch email status.",
      },
      { status: 500 }
    );
  }
}
