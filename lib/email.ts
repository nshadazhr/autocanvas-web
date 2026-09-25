// Minimal transactional-email sender. Uses Resend's plain HTTP API (no SDK
// dependency needed for one call) when RESEND_API_KEY is set; otherwise
// falls back to logging the email to the server console. That fallback is
// what makes password reset testable in this sandbox and in any local dev
// setup without needing a real email provider account — grab the link from
// the terminal instead of an inbox. Swap in a real key in production and
// this starts sending real emails with zero code changes.

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "AutoCanvas <no-reply@autocanvas.local>";

  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.log(
      `\n📧 [dev email — no RESEND_API_KEY set] To: ${to}\nSubject: ${subject}\n${text}\n`,
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to send email via Resend (${res.status}): ${body}`);
  }
}

export function passwordResetEmail(resetUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: "Reset your AutoCanvas password",
    text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
    html: `
      <p>Someone requested a password reset for your AutoCanvas account.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a> (expires in 1 hour).</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  };
}
