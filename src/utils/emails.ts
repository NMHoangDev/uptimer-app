import { SENDER_EMAIL, SENDER_EMAIL_PASSWORD } from "../server/config.js";
import path from "path";
import { IEmailLocals } from "../interface/notification.interface.js";
import nodemailer from "nodemailer";
import Email from "email-templates";
import logger from "../server/logger.js";

export async function sendEmail(
  template: string,
  receiver: string,
  locals: IEmailLocals
) {
  try {
    await emailTemplates(template, receiver, locals);
    logger.info("Email sent successfully");
  } catch (error) {
    logger.error("Email notification error:", error);
  }
}
async function emailTemplates(
  template: string,
  receiverEmail: string,
  locals: IEmailLocals
): Promise<void> {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: SENDER_EMAIL,
        pass: SENDER_EMAIL_PASSWORD,
      },
    });
    const email: Email = new Email({
      message: {
        from: `Uptimer App <${SENDER_EMAIL}>>`,
      },
      send: true,
      preview: false,
      transport: transporter,
      views: {
        options: {
          extension: "ejs",
        },
      },
      juice: true,
      juiceResources: {
        preserveImportant: true,
        webResources: {
          relativeTo: path.join(__dirname, "../../build"),
        },
      },
    });
    await email.send({
      template: path.join(__dirname, "..", "/emails", template),
      message: {
        to: receiverEmail,
      },
      locals,
    });
  } catch (error: any) {
    throw new Error(error.message || JSON.stringify(error));
  }
}
