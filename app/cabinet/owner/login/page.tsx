import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { OwnerLoginForm } from "@/components/cabinet/owner-login-form";

export default async function OwnerLoginPage() {
  const cu = await getCurrentUser();
  if (cu?.user.role === "owner") redirect("/cabinet/owner");
  return <OwnerLoginForm />;
}
