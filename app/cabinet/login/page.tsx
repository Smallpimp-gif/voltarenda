import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { providerEnabled } from "@/lib/auth/oauth";
import { LoginForm } from "@/components/cabinet/login-form";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/cabinet");
  const tgOn = Boolean(process.env.TELEGRAM_BOT_USERNAME && process.env.TELEGRAM_BOT_TOKEN);
  const social = {
    vk: providerEnabled("vk"),
    yandex: providerEnabled("yandex"),
    telegram: tgOn,
    telegramBot: process.env.TELEGRAM_BOT_USERNAME ?? "",
  };
  return <LoginForm social={social} />;
}
