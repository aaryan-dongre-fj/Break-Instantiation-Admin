import { CompanyList } from "@/components/company-list";
import { LoginForm } from "@/components/login-form";
import { loadCompanies, requestCompany } from "@/lib/look";

// /ej is EJ's sign-in. The bare / lists the companies to choose from.
export default async function Page() {
  if (!(await requestCompany())) return <CompanyList companies={await loadCompanies()} />;
  return <LoginForm />;
}
