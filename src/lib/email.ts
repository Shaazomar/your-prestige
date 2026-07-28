/**
 * Transactional email via Resend. Configure with:
 *   RESEND_API_KEY
 *   EMAIL_FROM — e.g. "Your Prestige <hello@yourprestige.in>"
 * Inactive (logs to console instead) until both are set.
 */

export const isEmailConfigured = !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

export async function sendEmail(params: { to: string; subject: string; html: string }) {
  if (!isEmailConfigured) {
    console.log(`[email:not-configured] Would send "${params.subject}" to ${params.to}`);
    return { sent: false };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!res.ok) {
    console.error("Resend send failed:", await res.text());
    return { sent: false };
  }
  return { sent: true };
}
