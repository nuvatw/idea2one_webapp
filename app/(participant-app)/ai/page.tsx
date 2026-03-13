import type { Metadata } from "next";
import AIChat from "@/components/participant/AIChat";

export const metadata: Metadata = {
  title: "AI 助手 — nuva",
};

export default function AIPage() {
  return <AIChat />;
}
