import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-[0.375rem] border border-[#E2E8F0] bg-white px-4 text-base text-[#1A202C] transition-colors outline-none placeholder:text-[#A0AEC0] focus-visible:border-primary focus-visible:shadow-[0_0_0_1px_var(--primary)] disabled:cursor-not-allowed disabled:bg-[#F7FAFC] disabled:opacity-40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
