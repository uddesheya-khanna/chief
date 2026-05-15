export type SendEmailResult =
  | { ok: true; id?: string }
  | { ok: false; reason: "missing_api_key" | "api_error" };

export async function sendAlertDigestEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, reason: "missing_api_key" };
  }

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ?? "Chief Intelligence <alerts@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[alerts:email]", {
        status: res.status,
        body: body.slice(0, 500),
      });
      return { ok: false, reason: "api_error" };
    }

    const json = (await res.json()) as { id?: string };
    console.log("[alerts:email]", { to: params.to, outcome: "sent" });
    return { ok: true, id: json.id };
  } catch (err) {
    console.error("[alerts:email]", {
      outcome: "api_error",
      message: err instanceof Error ? err.message : "unknown",
    });
    return { ok: false, reason: "api_error" };
  }
}
