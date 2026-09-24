import { format } from 'date-fns'
import { escapeHtml } from './html'

export interface PlantReminder {
  plantName: string
  variety?: string | null
  category?: string | null
  plantingDate: Date
  type: 'indoor_start' | 'direct_sow' | 'transplant' | 'fall_direct_sow'
  source: 'seed' | 'wishlist'
}

export function generatePlantingReminderEmailHtml(params: {
  name: string
  indoorReminders: PlantReminder[]
  directSowReminders: PlantReminder[]
  transplantReminders: PlantReminder[]
  fallDirectSowReminders?: PlantReminder[]
  settingsUrl: string
  calendarUrl: string
}): string {
  const { name, indoorReminders, directSowReminders, transplantReminders, fallDirectSowReminders = [], settingsUrl, calendarUrl } = params

  const formatReminder = (r: PlantReminder) => {
    const varietyStr = r.variety ? ` (${escapeHtml(r.variety)})` : ''
    const sourceStr = r.source === 'wishlist' ? ' 📝 <small style="color:#666">from wishlist</small>' : ''
    return `<li style="margin: 8px 0;">${escapeHtml(r.plantName)}${varietyStr} - <strong>${format(r.plantingDate, 'MMMM d')}</strong>${sourceStr}</li>`
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Planting Reminder</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2d5016 0%, #4a7c23 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🌱 Garden Seed Tracker</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Time to Start Planting!</p>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #2d5016; margin-top: 0;">Hi ${escapeHtml(name)}!</h2>

    <p>Based on your frost dates and planting calendar, it's time to start preparing these plants:</p>

    ${indoorReminders.length > 0 ? `
    <div style="background: #f3e5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9c27b0;">
      <h3 style="color: #7b1fa2; margin-top: 0;">🏠 Start Indoors</h3>
      <p style="color: #666; margin-bottom: 10px;">These seeds need to be started indoors:</p>
      <ul style="padding-left: 20px; color: #333;">
        ${indoorReminders.map(formatReminder).join('')}
      </ul>
    </div>
    ` : ''}

    ${directSowReminders.length > 0 ? `
    <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
      <h3 style="color: #388e3c; margin-top: 0;">🌿 Direct Sow Outside</h3>
      <p style="color: #666; margin-bottom: 10px;">These seeds can be planted directly in your garden:</p>
      <ul style="padding-left: 20px; color: #333;">
        ${directSowReminders.map(formatReminder).join('')}
      </ul>
    </div>
    ` : ''}

    ${transplantReminders.length > 0 ? `
    <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
      <h3 style="color: #f57c00; margin-top: 0;">🌱➡️🌻 Transplant Seedlings</h3>
      <p style="color: #666; margin-bottom: 10px;">These seedlings are ready to be transplanted outdoors:</p>
      <ul style="padding-left: 20px; color: #333;">
        ${transplantReminders.map(formatReminder).join('')}
      </ul>
    </div>
    ` : ''}

    ${fallDirectSowReminders.length > 0 ? `
    <div style="background: #efebe9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #795548;">
      <h3 style="color: #5d4037; margin-top: 0;">🍂 Fall Direct Sow</h3>
      <p style="color: #666; margin-bottom: 10px;">Plant these now for a harvest before your first fall frost:</p>
      <ul style="padding-left: 20px; color: #333;">
        ${fallDirectSowReminders.map(formatReminder).join('')}
      </ul>
    </div>
    ` : ''}

    <div style="text-align: center; margin: 30px 0;">
      <a href="${escapeHtml(calendarUrl)}" style="background: #4a7c23; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        View Full Calendar
      </a>
    </div>

    <h3 style="color: #2d5016;">Quick Tips:</h3>
    <ul style="color: #666;">
      <li>Check soil temperature before planting outdoors</li>
      <li>Harden off indoor seedlings before transplanting</li>
      <li>Keep soil consistently moist for germinating seeds</li>
      <li>Label everything! Future you will thank you</li>
    </ul>

    <p style="color: #888; font-size: 14px; margin-top: 30px;">
      Happy gardening! 🌻
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>
      You're receiving this because you enabled planting reminders in Garden Seed Tracker.<br>
      <a href="${escapeHtml(settingsUrl)}" style="color: #4a7c23;">Manage your notification preferences</a>
    </p>
  </div>
</body>
</html>
`
}
