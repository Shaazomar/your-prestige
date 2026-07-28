import { createSign } from "crypto";

/**
 * Google Calendar integration via a service account (no interactive OAuth
 * consent flow needed for a single business calendar). Configure with:
 *   GOOGLE_SERVICE_ACCOUNT_JSON — the full service-account key JSON, as a string
 *   GOOGLE_CALENDAR_ID          — the calendar to write events to
 * Inactive (no-op) until both are set — see progress.md for setup steps.
 */

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

export const isGoogleCalendarConfigured = !!(
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_CALENDAR_ID
);

function base64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function getAccessToken(): Promise<string> {
  const key: ServiceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
  const now = Math.floor(Date.now() / 1000);

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/calendar",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );

  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  signer.end();
  const signature = base64url(signer.sign(key.private_key));
  const assertion = `${header}.${claims}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

interface BookingLike {
  id: string;
  name: string;
  phone: string;
  requestedDate: Date;
  notes?: string | null;
}

/** Creates (or updates, if googleEventId is passed) a Calendar event for a booking. */
export async function upsertCalendarEvent(
  booking: BookingLike,
  existingEventId?: string | null
): Promise<string | null> {
  if (!isGoogleCalendarConfigured) return null;

  const calendarId = process.env.GOOGLE_CALENDAR_ID!;
  const token = await getAccessToken();
  const start = booking.requestedDate;
  const end = new Date(start.getTime() + 60 * 60 * 1000); // 1hr slot

  const event = {
    summary: `Showroom Visit — ${booking.name}`,
    description: `Phone: ${booking.phone}${booking.notes ? `\n\n${booking.notes}` : ""}`,
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
  };

  const url = existingEventId
    ? `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${existingEventId}`
    : `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

  const res = await fetch(url, {
    method: existingEventId ? "PATCH" : "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
  if (!res.ok) {
    console.error("Google Calendar sync failed:", await res.text());
    return existingEventId ?? null;
  }
  const data = await res.json();
  return data.id;
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  if (!isGoogleCalendarConfigured) return;
  const calendarId = process.env.GOOGLE_CALENDAR_ID!;
  const token = await getAccessToken();
  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
  ).catch((err) => console.error("Google Calendar delete failed:", err));
}
