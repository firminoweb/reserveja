const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export function emailLayout(body: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;color:#1a1a2e">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5">
<tr><td align="center" style="padding:32px 16px">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden">

<!-- Header -->
<tr><td style="padding:24px 32px;border-bottom:1px solid #e4e4e7">
  <a href="${APP_URL}" style="text-decoration:none;font-size:20px;font-weight:700;color:#1a1a2e">reserve<span style="color:#4F46E5">já</span><span style="color:#9ca3af;font-weight:500;font-size:16px">.app</span></a>
</td></tr>

<!-- Body -->
<tr><td style="padding:32px 32px 24px">${body}</td></tr>

<!-- Footer -->
<tr><td style="padding:16px 32px 24px;border-top:1px solid #e4e4e7">
  <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5">
    Este email foi enviado por <a href="${APP_URL}" style="color:#4F46E5;text-decoration:none">Reserve Já</a>. Se você não esperava recebê-lo, pode ignorar com segurança.
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

export function emailButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">${label}</a>`
}

export function emailMuted(text: string): string {
  return `<p style="color:#6b7280;font-size:13px;line-height:1.5;margin:16px 0 0">${text}</p>`
}
