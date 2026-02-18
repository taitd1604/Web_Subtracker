"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";

import { Button, type ButtonProps } from "@/components/ui/button";

type FormSubmitButtonProps = ButtonProps & {
  pendingText?: string;
};

export function FormSubmitButton({
  children,
  disabled,
  pendingText = "Saving...",
  ...props
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <Button disabled={isDisabled} type="submit" {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}
