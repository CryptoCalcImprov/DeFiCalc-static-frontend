import Link from "next/link";
import { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import clsx from "clsx";

const baseStyles =
  "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary",
  ghost: "bg-transparent text-slate-200 hover:bg-slate-900 focus-visible:ring-slate-700"
} as const;

type ButtonVariant = keyof typeof variants;

type ButtonProps = (
  | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>)
  | ({ href: string } & AnchorHTMLAttributes<HTMLAnchorElement>)
) & {
  variant?: ButtonVariant;
};

export function Button({ className, variant = "primary", href, ...props }: ButtonProps) {
  const combined = clsx(baseStyles, variants[variant], className);

  if (href) {
    return <Link href={href} className={combined} {...props} />;
  }

  return <button className={combined} {...props} />;
}
