"use client";

import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { BsArrowRightShort } from "react-icons/bs";
import { toast } from "sonner";

import { BrandMark } from "@/components/brand-mark";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, apiFetch } from "@/lib/api";
import { isStaffRole } from "@/lib/roles";
import type { StaffProfile } from "@/lib/types";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const user = await apiFetch<Omit<StaffProfile, "role"> & { role: string }>("/staff/login/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!isStaffRole(user.role)) {
        await apiFetch("/staff/logout/", { method: "POST" }).catch(() => undefined);
        toast.error("Login Failed", {
          description: "This account cannot use this site.",
        });
        return;
      }

      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl: "/dashboard",
      });

      if (!result || result.error) {
        toast.error("Login Failed", {
          description: "An unexpected error occurred during login.",
        });
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      const description =
        error instanceof ApiError
          ? error.message
          : "An unexpected error occurred during login.";
      toast.error("Login Failed", { description });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex w-[95vw] max-w-xl flex-col gap-4 rounded-[10px] border border-[#E2E8F0] p-5">
        <BrandMark
          className="text-center text-[28px] font-semibold"
          imageClassName="mx-auto h-[6vh] w-auto"
        />
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email address"
              value={email}
              required
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Enter Password</Label>
            <PasswordInput
              id="password"
              value={password}
              autoComplete="current-password"
              onChange={setPassword}
            />
          </div>
          <Button
            type="submit"
            className="mt-5"
            disabled={loading || !email || !password}
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                Login to your account
                <BsArrowRightShort className="size-6" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
