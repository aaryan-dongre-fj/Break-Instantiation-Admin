import { headers } from "next/headers";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { apiBaseUrl } from "@/lib/instance";
import { companyApiOrigin, companyHeaders } from "@/lib/look";
import { isStaffRole } from "@/lib/roles";
import type { StaffProfile } from "@/lib/types";

function headerValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

// The dev server was started with NEXTAUTH_URL pinned to one company.
// Each request has to use the browser host, or Break sign-in is checked as EJ.
export async function setRequestAuthUrl() {
  const headerList = await headers();
  const host = headerList.get("host");
  if (!host) return;
  const proto = headerList.get("x-forwarded-proto") === "https" ? "https" : "http";
  process.env.NEXTAUTH_URL = `${proto}://${host}`;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const header = req.headers?.cookie;
        const cookie = Array.isArray(header) ? header.join("; ") : header;
        if (!cookie || !credentials?.email || !credentials.password) return null;

        // The login session lives on the company schema. 127.0.0.1 is public
        // and does not have this cookie, so /staff/me/ would 403.
        const host = headerValue(req.headers?.host);
        const origin = companyApiOrigin(host ?? null) ?? apiBaseUrl();
        const me = await fetch(`${origin}/api/staff/me/`, {
          headers: { ...companyHeaders(host ?? null), cookie, accept: "application/json" },
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
        };
      },
    }),
  ],
  pages: {
    signIn: "/",
    signOut: "/",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: String(token.id ?? ""),
        email: token.email ?? "",
        name: token.name ?? "",
        role: isStaffRole(token.role) ? token.role : "admin",
      };
      return session;
    },
  },
  secret: process.env.SECRET,
};
