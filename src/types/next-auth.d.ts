import type { DefaultSession } from "next-auth";

import type { StaffRole } from "@/lib/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: StaffRole;
      company: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: StaffRole;
    company: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: StaffRole;
    company?: string;
  }
}
