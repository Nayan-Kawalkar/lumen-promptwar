import { Suspense } from "react";
import { ThinkApp } from "@/components/ThinkApp";

export const metadata = { title: "Think it through — Lumen" };

export default function ThinkPage() {
  return (
    <Suspense>
      <ThinkApp />
    </Suspense>
  );
}
