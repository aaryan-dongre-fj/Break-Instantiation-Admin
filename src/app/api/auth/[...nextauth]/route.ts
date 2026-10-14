import NextAuth from "next-auth";

import { authOptions } from "@/lib/auth";

// One host serves every company, so next-auth's own origin detection holds:
// VERCEL on Vercel, NEXTAUTH_URL locally.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
