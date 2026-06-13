import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-right"
      expand={true}
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-emerald-600 group-[.toast]:text-white group-[.toast]:hover:bg-emerald-700",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:border-emerald-500/50 group-[.toaster]:bg-emerald-50",
          error: "group-[.toaster]:border-red-500/50 group-[.toaster]:bg-red-50",
          warning: "group-[.toaster]:border-amber-500/50 group-[.toaster]:bg-amber-50",
          info: "group-[.toaster]:border-blue-500/50 group-[.toaster]:bg-blue-50",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
