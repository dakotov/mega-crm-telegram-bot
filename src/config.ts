import * as dotenv from "dotenv";

dotenv.config();

export default {
  BOT_TOKEN: process.env.BOT_TOKEN,
  PUBLIC_URL: process.env.PUBLIC_URL,
  PORT: process.env.PORT,
  TEMPLATES_PATH: process.env.TEMPLATES_PATH,
  DOWNLOADS_PATH: process.env.DOWNLOADS_PATH,
  UPLOADS_PATH: process.env.UPLOADS_PATH,
  TELEGRAM_SET_WEBHOOK:
    process.env.TELEGRAM_SET_WEBHOOK.toLowerCase() == "true",
  DEFAULT_MASTER_CRON: process.env.DEFAULT_MASTER_CRON || "*/10 * * * *",
  AUTOASSIGN_TIMOUT_MINUTES: process.env.DEFAULT_MASTER_CRON
    ? parseInt(process.env.DEFAULT_MASTER_CRON)
    : 20,
  MOMENT_FORMAT_OFFSET: process.env.MOMENT_FORMAT_OFFSET
    ? parseInt(process.env.MOMENT_FORMAT_OFFSET)
    : 5,
};
