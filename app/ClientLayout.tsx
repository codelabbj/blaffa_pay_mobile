"use client";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useLayoutEffect } from "react";
import type React from "react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [colorMode] = useLocalStorage("color-theme", "light");

  useLayoutEffect(() => {
    const className = "dark";
    const bodyClass = window.document.body.classList;

    colorMode === "dark"
      ? bodyClass.add(className)
      : bodyClass.remove(className);
  }, [colorMode]);

  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">{children}</div>
  );
}
