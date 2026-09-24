import { prisma } from "@/lib/prisma";
import { sendAutomationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { to, subject, text } = await request.json();

    if (!to || !subject || !text) {
      return Response.json(
        {
          success: false,
          message: "Recipient, subject, and message are required.",
        },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: {
        email: to,
      },
    });

    if (!employee) {
      return Response.json(
        {
          success: false,
          message: "Employee with this email was not found in the database.",
        },
        { status: 404 }
      );
    }

    console.log("[Email API] Sending email through Gmail API.");
    console.log("[Email API] Sending email to:", to);
    console.log("[Email API] Employee ID:", employee.id);
    console.log("[Email API] Employee name:", employee.name);

    const mailResult = await sendAutomationEmail(
      to,
      subject,
      text
    );

    await prisma.emailLog.create({
      data: {
        employee_id: employee.id,
        recipient_email: to,
        subject,
        status: "Sent",
      },
    });

    return Response.json({
      success: true,
      message: "Email accepted by Gmail and recorded in the database.",
      recipient: to,
      employee: employee.name,
      messageId: mailResult.messageId,
      accepted: mailResult.accepted,
    });
  } catch (error) {
    console.error("========== EMAIL ERROR ==========");
    console.error(error);
    console.error("=================================");

    return Response.json(
      {
        success: false,
        message: "Email could not be sent.",
        error:
          error instanceof Error
            ? error.message
            : "Unknown email sending error.",
      },
      { status: 500 }
    );
  }
}
