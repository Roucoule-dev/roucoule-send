import nodemailer from "npm:nodemailer@^6.9.14";
import type { Recipient, SmtpConfig } from "./types.ts";

export interface SendArgs {
  from: { name: string; email: string };
  subject: string;
  recipient: Recipient;
}

export interface SmtpSender {
  send(args: SendArgs): Promise<void>;
  close(): Promise<void>;
}

export function createNodemailerSender(config: SmtpConfig): SmtpSender {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.username, pass: config.password },
  });

  return {
    async send({ from, subject, recipient }) {
      await transporter.sendMail({
        from: `${from.name} <${from.email}>`,
        to: recipient.email,
        subject,
        text: recipient.textBody,
        html: recipient.htmlBody,
        headers: recipient.headers,
      });
    },
    async close() {
      transporter.close();
      return await Promise.resolve();
    },
  };
}
