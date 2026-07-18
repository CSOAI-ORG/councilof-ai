import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: React.ReactElement;
  className?: string;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, error, required, children, className }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    const childWithProps = React.cloneElement(children, {
      onFocus: (e: React.FocusEvent) => {
        setIsFocused(true);
        children.props.onFocus?.(e);
      },
      onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        setHasValue(e.target.value !== '');
        children.props.onBlur?.(e);
      },
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        setHasValue(e.target.value !== '');
        children.props.onChange?.(e);
      },
      className: cn(
        children.props.className,
        "transition-all duration-200",
        error && "border-destructive focus-visible:ring-destructive",
        isFocused && "border-[hsl(var(--gts-yellow))] ring-2 ring-[hsl(var(--gts-yellow))] ring-opacity-20"
      )
    });

    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        {label && (
          <Label 
            className={cn(
              "transition-colors duration-200",
              isFocused && "text-[hsl(var(--gts-yellow))]",
              error && "text-destructive"
            )}
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        <div className="relative">
          {childWithProps}
          {error && (
            <p className="text-sm text-destructive mt-1 animate-in slide-in-from-top-1 duration-200">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }
);

FormField.displayName = "FormField";

export { FormField };