import { notFound } from "next/navigation";

import { DashboardScreen } from "@/components/dashboard-screen";
import { requestCompany } from "@/lib/look";

export default async function DashboardPage() {
  if (!(await requestCompany())) notFound();
  return <DashboardScreen />;
}
