import { redirect } from "next/navigation";
import { verifyParticipantSession } from "@/lib/auth/session";

/**
 * Root route: redirector only, no UI.
 * - If participant session valid → /home
 * - Otherwise → /login
 */
export default async function RootPage() {
  const session = await verifyParticipantSession();
  if (session) {
    redirect("/home");
  }
  redirect("/login");
}
