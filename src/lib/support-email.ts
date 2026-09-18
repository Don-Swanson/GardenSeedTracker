import { escapeHtml } from './html'

export function generateSupportEmailHtml(params: {
  category: string
  subject: string
  message: string
  userName: string
  userEmail: string
  userId: string
}): string {
  const category = escapeHtml(params.category)
  const subject = escapeHtml(params.subject)
  const message = escapeHtml(params.message)
  const userName = escapeHtml(params.userName)
  const userEmail = escapeHtml(params.userEmail)
  const userId = escapeHtml(params.userId)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support Request</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
    <h1 style="margin: 0 0 10px 0; font-size: 20px; color: #333;">${category}</h1>
    <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111;">${subject}</p>
  </div>

  <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 15px 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Message</h2>
    <div style="white-space: pre-wrap; color: #333;">${message}</div>
  </div>

  <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; font-size: 14px;">
    <h2 style="margin: 0 0 10px 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">User Details</h2>
    <p style="margin: 5px 0;"><strong>Name:</strong> ${userName}</p>
    <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${userEmail}">${userEmail}</a></p>
    <p style="margin: 5px 0;"><strong>User ID:</strong> ${userId}</p>
  </div>

  <p style="color: #888; font-size: 12px; margin-top: 20px; text-align: center;">
    Reply to this email to respond directly to the user.
  </p>
</body>
</html>
`
}

export function generateConfirmationEmailHtml(params: {
  userName: string
  subject: string
  message: string
  category: string
}): string {
  const userName = escapeHtml(params.userName)
  const subject = escapeHtml(params.subject)
  const message = escapeHtml(params.message.length > 200 ? params.message.substring(0, 200) + '...' : params.message)
  const category = escapeHtml(params.category)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support Request Received</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2d5016 0%, #4a7c23 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🌱 Garden Seed Tracker</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #2d5016; margin-top: 0;">Hi ${userName}!</h2>

    <p>Thank you for contacting us. We've received your support request and will get back to you as soon as possible.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4a7c23;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">${category}</p>
      <h3 style="margin: 0 0 10px 0; color: #333;">${subject}</h3>
      <div style="white-space: pre-wrap; color: #666; font-size: 14px;">${message}</div>
    </div>

    <p style="color: #888; font-size: 14px;">
      We typically respond within 1-2 business days. If your request is urgent, please reply to this email with additional details.
    </p>

    <p style="color: #888; font-size: 14px; margin-top: 30px;">
      Happy gardening! 🌻
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>This is an automated confirmation email from Garden Seed Tracker.</p>
  </div>
</body>
</html>
`
}
