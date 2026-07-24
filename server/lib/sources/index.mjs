import { syncDingtalkWebhook } from "./dingtalk-source.mjs";
import { syncEmailSource } from "./email-source.mjs";
import { syncRssSource } from "./rss-source.mjs";

export async function syncSource(source) {
  if (source.kind === "polling") {
    return syncRssSource(source);
  }

  if (source.kind === "email_polling") {
    return syncEmailSource(source);
  }

  throw new Error(`source ${source.id} is not syncable yet`);
}

export { syncDingtalkWebhook };
