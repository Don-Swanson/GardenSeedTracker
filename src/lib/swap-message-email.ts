import { escapeHtml } from './html'

// Deliberately does NOT include the message text or either party's email
// address - the recipient has to open the app to read it. This mirrors the
// swap board's "in-app inbox only" design: nothing here could be forwarded
// to leak contact info that was never in the email in the first place.
export function generateSwapMessageNotificationEmailHtml(params: {
  recipientName: string
  senderUsername: string
  plantName: string
  inboxUrl: string
  settingsUrl: string
}): string {
  const recipientName = escapeHtml(params.recipientName)
  const senderUsername = escapeHtml(params.senderUsername)
  const plantName = escapeHtml(params.plantName)
  const inboxUrl = escapeHtml(params.inboxUrl)
  const settingsUrl = escapeHtml(params.settingsUrl)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Swap Board Message</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2d5016 0%, #4a7c23 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🔄 Garden Seed Tracker</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">New Swap Board Message</p>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #2d5016; margin-top: 0;">Hi ${recipientName}!</h2>

    <p><strong>@${senderUsername}</strong> sent you a message about your <strong>${plantName}</strong> swap listing.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${inboxUrl}" style="background: #4a7c23; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        View Message
      </a>
    </div>

    <p style="color: #888; font-size: 14px;">
      For everyone's privacy, swap board messages only appear in the app - this email never includes their message or either person's email address.
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>
      You're receiving this because someone messaged you on the swap board.<br>
      <a href="${settingsUrl}" style="color: #4a7c23;">Turn off these emails</a>
    </p>
  </div>
</body>
</html>
`
}
