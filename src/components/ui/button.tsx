import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-[0.375rem] border border-transparent font-semibold whitespace-nowrap transition-colors outline-none select-none focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_45%,transparent)] disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-[var(--brand-hover)]",
        gray: "bg-[#EDF2F7] text-[#1A202C] hover:bg-[#E2E8F0]",
        outline:
          "border-[#E2E8F0] bg-white text-[#1A202C] hover:bg-[#F7FAFC]",
        secondary:
          "bg-[#EDF2F7] text-[#1A202C] hover:bg-[#E2E8F0]",
        ghost: "bg-transparent text-[#1A202C] hover:bg-[#EDF2F7]",
        destructive: "bg-[#E53E3E] text-white hover:bg-[#C53030]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 text-base",
        xs: "h-6 px-2 text-xs",
        sm: "h-8 px-3 text-sm",
        lg: "h-12 px-6 text-lg",
        icon: "size-10",
        "icon-xs": "size-6",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
