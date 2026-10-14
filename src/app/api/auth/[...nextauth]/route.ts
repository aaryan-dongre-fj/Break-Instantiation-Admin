import type { NextRequest } from "next/server";
import NextAuth from "next-auth";

import { authOptions, setRequestAuthUrl } from "@/lib/auth";

const handler = NextAuth(authOptions);

type AuthContext = { params: Promise<{ nextauth: string[] }> };

async function auth(request: NextRequest, context: AuthContext) {
  await setRequestAuthUrl();
  return handler(request, context);
}

export { auth as GET, auth as POST };
