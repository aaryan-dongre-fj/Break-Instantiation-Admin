import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "inline-flex h-5 w-fit shrink-0 items-center justify-center rounded-[0.375rem] px-2 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-[#EDF2F7] text-[#1A202C]",
        gray: "bg-[#EDF2F7] text-[#1A202C]",
        secondary: "bg-[#EDF2F7] text-[#1A202C]",
        green: "bg-[#C6F6D5] text-[#22543D]",
        destructive: "bg-[#FED7D7] text-[#822727]",
        red: "bg-[#FED7D7] text-[#822727]",
        outline: "border border-[#E2E8F0] bg-white text-[#1A202C]",
        ghost: "bg-transparent text-[#1A202C]",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
