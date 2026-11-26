import './telegram-float.css'

const configuredUrl = (import.meta.env.VITE_TELEGRAM_CHANNEL_URL || 't.me/synesisbot').trim()
const channelUrl = configuredUrl && !/^https?:\/\//i.test(configuredUrl)
  ? `https://${configuredUrl}`
  : configuredUrl
const isTelegramLink = /^https:\/\/(t\.me|telegram\.me)\//i.test(channelUrl)

export default function TelegramFloat() {
  if (!isTelegramLink) return null

  return (
    <a
      className="telegram-float"
      href={channelUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Join the Synesis Telegram channel (opens in a new tab)"
      title="Join our Telegram channel"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M21.7 4.35 18.6 19c-.23 1.04-.84 1.3-1.7.81l-4.7-3.46-2.27 2.19c-.25.25-.46.46-.94.46l.34-4.78 8.7-7.86c.38-.34-.08-.53-.59-.19L6.68 12.98 2.05 11.53c-1-.31-1.02-1 .21-1.48L20.37 3.1c.84-.31 1.58.2 1.33 1.25Z" />
      </svg>
    </a>
  )
}
