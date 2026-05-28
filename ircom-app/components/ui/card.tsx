import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  accentColor,
  ...rest
}: Readonly<{
  children: ReactNode;
  className?: string;
  accentColor?: string;
}> &
  Omit<React.ComponentPropsWithoutRef<"article">, "children" | "className">) {
  return (
    <article
      className={`rounded-[var(--ircom-radius-lg)] border border-[var(--ircom-border)] bg-[var(--ircom-surface)] p-5 text-[var(--ircom-text)] shadow-[var(--ircom-shadow-card)] ${className}`}
      style={
        accentColor
          ? { borderTopWidth: "4px", borderTopColor: accentColor }
          : undefined
      }
      {...rest}
    >
      {children}
    </article>
  );
}
