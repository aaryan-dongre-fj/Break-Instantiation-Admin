"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PasswordInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
};

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder = "Enter your password",
  autoComplete = "current-password",
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="pr-[4.5rem]"
        onChange={(event) => onChange(event.target.value)}
      />
      <Button
        type="button"
        variant="gray"
        size="sm"
        className="absolute top-1/2 right-1 h-7 -translate-y-1/2 px-2"
        onClick={() => setShow((current) => !current)}
      >
        {show ? "Hide" : "Show"}
      </Button>
    </div>
  );
}
