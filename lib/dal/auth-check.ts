import { redirect } from "next/navigation";
import {
  verifyParticipantSession,
  verifyStaffSession,
  type ParticipantSessionData,
  type StaffSessionData,
} from "@/lib/auth/session";

/**
 * Page-level auth check for participant routes.
 * Redirects to /login if session is invalid.
 */
export async function requireParticipantSession(): Promise<ParticipantSessionData> {
  const session = await verifyParticipantSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/**
 * Page-level auth check for staff routes that only need password auth.
 * Redirects to /staff/login if session is invalid.
 */
export async function requireStaffAuth(): Promise<StaffSessionData> {
  const session = await verifyStaffSession();
  if (!session) {
    redirect("/staff/login");
  }
  return session;
}

/**
 * Page-level auth check for staff routes that need identity selected.
 * Redirects to /staff/select if no identity, or /staff/login if no session.
 */
export async function requireStaffIdentity(): Promise<
  StaffSessionData & { selectedStaffId: string; selectedStaffName: string }
> {
  const session = await verifyStaffSession();
  if (!session) {
    redirect("/staff/login");
  }
  if (!session.selectedStaffId || !session.selectedStaffName) {
    redirect("/staff/select");
  }
  return session as StaffSessionData & {
    selectedStaffId: string;
    selectedStaffName: string;
  };
}
