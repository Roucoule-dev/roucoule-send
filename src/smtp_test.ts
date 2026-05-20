import { createNodemailerSender } from "./smtp.ts";

Deno.test(
  "createNodemailerSender returns a sender for valid config",
  async () => {
    const sender = createNodemailerSender({
      host: "localhost",
      port: 465,
      username: "u",
      password: "p",
    });
    await sender.close();
  },
);
