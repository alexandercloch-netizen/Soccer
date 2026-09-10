/** Domain types. Sport-specific behavior lives in SportTemplate, not here. */
export type Role = "owner" | "coach" | "guardian";
export type EventKind = "practice" | "game" | "rainDate" | "pictureDay" | "party" | "other";
export type EventStatus = "scheduled" | "tentative" | "cancelled";
export type AttendanceStatus = "present" | "absent" | "late" | "notifiedAbsent";

export interface Organization { id: string; name: string; contactEmail?: string; notes?: string }
export interface Season { id: string; orgId: string; name: string; startDate: string; endDate: string }

export interface TeamTheme { primary: string; accent: string; crestEmoji?: string }

export interface Team {
  id: string;
  slug: string;
  seasonId: string;
  sportTemplateId: string;
  name: string;
  league?: string;
  theme: TeamTheme;
  shareCode: string;
  coaches: { name: string; role: Role; email?: string }[];
  homeVenue?: string;
  gameVenue?: { name: string; address?: string; directions?: string };
  scheduleImage?: string;
}

export interface Guardian {
  id: string;
  name: string;
  relationship?: string;
  phone?: string;
  email?: string;
  volunteerRoles?: string[];
}

export interface Player {
  id: string;
  teamId: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  jersey?: number;
  grade?: string;
  school?: string;
  shirtSize?: string;
  dob?: string;
  photoConsent: boolean;
  status: "registered" | "unregistered" | "unclear";
  availabilityNotes?: string;
  medicalNotes?: string;
  coachNotes?: string;
  guardianIds: string[];
  siblings?: string[];
}

export interface TeamEvent {
  id: string;
  teamId: string;
  kind: EventKind;
  title: string;
  date: string | null;
  startTime?: string;
  endTime?: string;
  location?: string;
  opponent?: string;
  homeAway?: "home" | "away";
  arriveTime?: string;
  status: EventStatus;
  notes?: string;
  snackGuardianId?: string;
}

export interface AttendanceRecord { eventId: string; playerId: string; status: AttendanceStatus; note?: string }

export interface Announcement { id: string; teamId: string; subject: string; body: string; sentAt?: string; channel: "email" | "text" | "app" }

export interface TeamData {
  org: Organization;
  season: Season;
  team: Team;
  players: Player[];
  guardians: Guardian[];
  events: TeamEvent[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
}

/** Public-safe projection for the parent view: no contacts, no DOB, no medical. */
export function publicName(p: Pick<Player, "firstName" | "lastName" | "nickname">): string {
  const first = p.nickname || p.firstName;
  return `${first} ${p.lastName.charAt(0)}.`;
}
