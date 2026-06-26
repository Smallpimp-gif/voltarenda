import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "@/components/cabinet/login-form";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/cabinet");
  return <LoginForm />;
}
