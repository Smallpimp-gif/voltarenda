// Конфиг адаптера OpenNext → Cloudflare Workers.
// Дефолтный кэш (in-memory) подходит: страницы кабинетов динамические,
// читают KV на каждый запрос, ISR не используется.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
