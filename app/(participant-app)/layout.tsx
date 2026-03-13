import { requireParticipantSession } from "@/lib/dal/auth-check";
import { getAttendanceStatus } from "@/lib/dal/attendance";
import { getActivityStartTime } from "@/lib/dal/activity-state";
import BottomNavBar from "@/components/participant/BottomNavBar";
import PreCheckInScreen from "@/components/participant/PreCheckInScreen";

/**
 * Shared layout for all participant app pages.
 * Gated: if participant hasn't checked in, shows PreCheckInScreen instead of children.
 */
export default async function ParticipantAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth guard — redirects to /login if session is invalid
  const session = await requireParticipantSession();

  // Check if participant has checked in
  const [attendanceStatus, eventStartTime] = await Promise.all([
    getAttendanceStatus(session.participantId),
    getActivityStartTime(),
  ]);

  // If not checked in, show pre-check-in screen
  if (!attendanceStatus.is_checked_in) {
    return <PreCheckInScreen eventStartTime={eventStartTime} />;
  }

  return (
    <div className="min-h-screen bg-surface pb-[88px]">
      {children}
      <BottomNavBar />
    </div>
  );
}
