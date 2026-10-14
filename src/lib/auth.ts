import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { apiCookieHeader, companyFromPath } from "@/lib/company";
import { companyApiBase } from "@/lib/look";
import { isStaffRole } from "@/lib/roles";
import type { StaffProfile } from "@/lib/types";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        company: { label: "Company", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const company = companyFromPath(`/${credentials?.company ?? ""}`);
        const header = req.headers?.cookie;
        const browserCookies = Array.isArray(header) ? header.join("; ") : header;
        const cookie = company ? apiCookieHeader(browserCookies ?? null, company) : "";
        if (!company || !cookie || !credentials?.email || !credentials.password) {
          return null;
        }

        // The login session lives in that company's schema, at /t/<company>/.
        const me = await fetch(`${companyApiBase(company)}/api/staff/me/`, {
          headers: { cookie, accept: "application/json" },
          cache: "no-store",
        });
        if (!me.ok) return null;

        const user = (await me.json()) as StaffProfile;
        if (!isStaffRole(user.role)) return null;
        if (user.email.toLowerCase() !== String(credentials.email).toLowerCase()) {
          return null;
        }

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
          company,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.company = user.company;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: String(token.id ?? ""),
        email: token.email ?? "",
        name: token.name ?? "",
        role: isStaffRole(token.role) ? token.role : "admin",
        company: token.company ?? "",
      };
      return session;
    },
  },
  secret: process.env.SECRET,
};
