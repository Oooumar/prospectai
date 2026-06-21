import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendProspectEmail({
  to,
  subject,
  body,
  fromName = "ProspectAI",
}: {
  to: string;
  subject: string;
  body: string;
  fromName?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const from = process.env.RESEND_FROM_EMAIL || "contact@prospectai.company";
    const replyTo = process.env.RESEND_REPLY_TO;

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${from}>`,
      ...(replyTo ? { replyTo } : {}),
      to,
      subject,
      html: bodyToHtml(body),
      text: body,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, messageId: data?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

function bodyToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const paragraphs = escaped
    .split("\n\n")
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#111;background:#fff">
  ${paragraphs}
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0">
  <p style="font-size:12px;color:#9ca3af">Vous recevez cet email car vous avez été sélectionné pour une opportunité commerciale.
  <a href="#" style="color:#6366f1">Se désabonner</a></p>
</body>
</html>`;
}
