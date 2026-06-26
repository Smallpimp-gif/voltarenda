import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { OwnerRegisterForm } from "@/components/cabinet/owner-register-form";

export default async function OwnerRegisterPage() {
  const cu = await getCurrentUser();
  if (cu?.user.role === "owner") redirect("/cabinet/owner");
  return <OwnerRegisterForm />;
}
