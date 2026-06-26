import type { Metadata } from "next";

// Личный кабинет — не индексируем.
export const metadata: Metadata = {
  title: "Кабинет",
  robots: { index: false, follow: false },
};

export default function CabinetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="min-h-dvh bg-[var(--bg)] text-[var(--text)]">{children}</main>;
}
