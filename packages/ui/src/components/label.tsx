import * as React from "react";
import { cn } from "../lib/cn";

// Plain <label>, not @radix-ui/react-label — the only real feature
// that wrapper adds over a native label is forwarding clicks to a
// disabled control, which none of this app's forms need.
export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
    {...props}
  />
));
Label.displayName = "Label";
