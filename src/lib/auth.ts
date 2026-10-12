import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { apiBaseUrl } from "@/lib/instance";
import { isStaffRole } from "@/lib/roles";
import type { StaffProfile } from "@/lib/types";

function apiBase() {
  return apiBaseUrl();
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

        const me = await fetch(`${apiBase()}/api/staff/me/`, {
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
