import Link from "next/link";
import { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import clsx from "clsx";

const baseStyles =
  "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-midnight";

const variants = {
  primary:
    "bg-primary text-primary-foreground shadow-glow hover:bg-primary/90 focus-visible:ring-primary focus-visible:ring-offset-2",
  gradient:
    "bg-gradient-to-r from-primary to-accent text-slate-950 shadow-glow hover:shadow-panel focus-visible:ring-accent",
  outline:
    "border border-slate-700/80 bg-transparent text-slate-100 hover:border-slate-500 hover:bg-deep/60 focus-visible:ring-slate-600",
  ghost: "bg-transparent text-slate-200 hover:bg-deep/60 focus-visible:ring-slate-700"
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
