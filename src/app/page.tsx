import { notFound } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { requestCompany } from "@/lib/look";

// Only under a company path: /ej, /ej/login.
export default async function Page() {
  if (!(await requestCompany())) notFound();
  return <LoginForm />;
}
