import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { RegisterForm } from "@/components/cabinet/register-form";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/cabinet");
  return <RegisterForm />;
}
