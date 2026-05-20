/**
 * @roucoule/send — open-source client to send Roucoule newsletters
 * via your own SMTP server.
 *
 * See https://github.com/Roucoule-dev/roucoule-send
 */
export { ApiError, createApiClient } from "./api.ts";
export { createNodemailerSender } from "./smtp.ts";
export { send } from "./send.ts";
export {
  configExists,
  getConfigPath,
  loadConfig,
  saveConfig,
} from "./config.ts";
export type {
  Recipient,
  RoucouleConfig,
  SendOptions,
  SendPackage,
  SendResult,
  SmtpConfig,
} from "./types.ts";
