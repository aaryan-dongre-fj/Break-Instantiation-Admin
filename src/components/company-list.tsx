import { BsArrowRightShort } from "react-icons/bs";

import type { CompanyLink } from "@/lib/look";

// The landing page has no company in its path, so it lists every live
// company. Each opens /<slug>, that company's sign-in. A plain link, not
// next/link: / and /<slug> are the same rewritten page, and the company's
// branding sits in the root layout, so a client navigation would keep this
// page and only change the URL.
export function CompanyList({ companies }: { companies: CompanyLink[] | null }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex w-[95vw] max-w-xl flex-col gap-4 rounded-[10px] border border-[#E2E8F0] p-5">
        <div className="text-center">
          <p className="text-[28px] font-semibold">Admin Panel</p>
          <p className="mt-1 text-sm text-[#718096]">Choose your company to sign in.</p>
        </div>
        {companies === null ? (
          <p className="text-center text-sm text-red-600">
            We couldn&apos;t load the companies. Try again in a moment.
          </p>
        ) : companies.length === 0 ? (
          <p className="text-center text-sm text-[#718096]">No companies yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {companies.map((company) => (
              <li key={company.slug}>
                <a
                  href={`/${company.slug}`}
                  className="flex items-center justify-between rounded-[10px] border border-[#E2E8F0] px-4 py-3 transition-colors hover:bg-[#F7FAFC]"
                >
                  <span className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="size-3 rounded-full"
                      style={{ backgroundColor: company.primary }}
                    />
                    <span className="font-medium">{company.name}</span>
                  </span>
                  <BsArrowRightShort className="size-6 text-[#718096]" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
