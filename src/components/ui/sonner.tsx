"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      duration={2000}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#1a202c",
          "--normal-border": "#e2e8f0",
          "--border-radius": "0.375rem",
          "--success-bg": "#ffffff",
          "--success-text": "#1a202c",
          "--success-border": "#e2e8f0",
          "--error-bg": "#ffffff",
          "--error-text": "#1a202c",
          "--error-border": "#e2e8f0",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "border border-[#E2E8F0] bg-white text-base text-[#1A202C] shadow-lg",
          title: "font-bold",
          description: "text-sm text-[#718096]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
