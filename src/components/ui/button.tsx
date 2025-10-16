import Link from "next/link";
import { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import clsx from "clsx";

const baseStyles =
  "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary",
  secondary: "bg-slate-900/80 text-slate-100 hover:bg-slate-900 focus-visible:ring-slate-700",
  gradient:
    "bg-cta-gradient text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 focus-visible:ring-mint",
  ghost: "bg-transparent text-slate-200 hover:bg-slate-900/60 focus-visible:ring-slate-700"
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
