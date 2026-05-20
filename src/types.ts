export interface Recipient {
  subscriberId: string;
  email: string;
  htmlBody: string;
  textBody: string;
  headers: Record<string, string>;
}

export interface SendPackage {
  articleId: string;
  subject: string;
  fromHint: { name: string; email: string };
  recipients: Recipient[];
}

export interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

export interface RoucouleConfig {
  baseUrl: string;
  apiToken: string;
  smtp: SmtpConfig;
}

export interface SendOptions {
  dryRun?: boolean;
  limit?: number;
  filter?: string;
  batchSize?: number;
  delayMs?: number;
  skipMarkSent?: boolean;
}

export interface SendResult {
  sent: number;
  failed: number;
  failures: Array<{ email: string; error: string }>;
}
