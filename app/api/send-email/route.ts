import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

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

    // Find the employee using the exact recipient email.
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

    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      return Response.json(
        {
          success: false,
          message: "Email configuration is missing.",
        },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    // Verify the Gmail SMTP connection before sending.
    await transporter.verify();

    console.log("SMTP connection verified.");
    console.log("Sending email to:", to);
    console.log("Employee ID:", employee.id);
    console.log("Employee name:", employee.name);

    const mailResult = await transporter.sendMail({
      from: `"Employee Event Automation" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });

    console.log("========== EMAIL RESULT ==========");
    console.log("Message ID:", mailResult.messageId);
    console.log("Accepted:", mailResult.accepted);
    console.log("Rejected:", mailResult.rejected);
    console.log("Response:", mailResult.response);
    console.log("==================================");

    // Make sure Gmail accepted the recipient.
    if (!mailResult.accepted || mailResult.accepted.length === 0) {
      console.error("Recipient was not accepted:", to);

      return Response.json(
        {
          success: false,
          message: `Gmail did not accept the recipient: ${to}`,
          accepted: mailResult.accepted,
          rejected: mailResult.rejected,
        },
        { status: 502 }
      );
    }

    // Only create the database log after Gmail accepts the message.
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
      rejected: mailResult.rejected,
      smtpResponse: mailResult.response,
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