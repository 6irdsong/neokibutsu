import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

const DEVICE_SECRET = process.env.DEVICE_ID_SECRET || 'default-device-secret'
const DEVICE_SECRET_PREV = process.env.DEVICE_ID_SECRET_PREV || 'default-device-secret'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface DeviceIdInfo {
  uuid: string
  timestamp: string // ISO-like 'YYYYMMDDTHHMMSS', 'legacy', or ''
  susCount: number
  raw: string
}

function formatTimestamp(date: Date): string {
  const y = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${y}${mo}${d}T${h}${mi}${s}`
}

function sign(payload: string, secret = DEVICE_SECRET): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex').slice(0, 16)
}

function buildDeviceId(uuid: string, timestamp: string, susCount: number): string {
  const parts = [uuid, timestamp]
  if (susCount > 0) parts.push(`sus${susCount}`)
  const payload = parts.join('.')
  return `${payload}.${sign(payload)}`
}

function parseDeviceId(raw: string): DeviceIdInfo | null {
  const parts = raw.split('.')
  // New format: uuid.timestamp.hmac or uuid.timestamp.susN.hmac
  if (parts.length < 3) return null

  const uuid = parts[0]
  if (!UUID_REGEX.test(uuid)) return null

  const timestamp = parts[1]
  const hasSus = parts.length === 4
  let susCount = 0

  if (hasSus) {
    const susMatch = parts[2].match(/^sus(\d+)$/)
    if (!susMatch) return null
    susCount = parseInt(susMatch[1], 10)
  }

  const hmac = parts[parts.length - 1]
  const payloadParts = [uuid, timestamp]
  if (susCount > 0) payloadParts.push(`sus${susCount}`)
  const expectedHmac = sign(payloadParts.join('.'))

  // Try current secret, then fallback to previous secret
  if (hmac !== expectedHmac) {
    const prevHmac = sign(payloadParts.join('.'), DEVICE_SECRET_PREV)
    if (hmac !== prevHmac) return null
  }

  return { uuid, timestamp, susCount, raw }
}

function setCookie(cookieStore: Awaited<ReturnType<typeof cookies>>, value: string) {
  cookieStore.set('device_id', value, {
    maxAge: COOKIE_MAX_AGE,
    secure: true,
    sameSite: 'lax',
    path: '/',
  })
}

async function ensure(): Promise<DeviceIdInfo> {
  const cookieStore = await cookies()
  const raw = cookieStore.get('device_id')?.value || ''

  if (!raw) {
    const uuid = uuidv4()
    const ts = formatTimestamp(new Date())
    const value = buildDeviceId(uuid, ts, 0)
    setCookie(cookieStore, value)
    return { uuid, timestamp: ts, susCount: 0, raw: value }
  }

  if (UUID_REGEX.test(raw)) {
    const value = buildDeviceId(raw, 'legacy', 0)
    setCookie(cookieStore, value)
    return { uuid: raw, timestamp: 'legacy', susCount: 0, raw: value }
  }

  const info = parseDeviceId(raw)
  if (info) {
    // Re-sign with current secret if cookie was signed with previous secret
    const currentSig = sign([info.uuid, info.timestamp, ...(info.susCount > 0 ? [`sus${info.susCount}`] : [])].join('.'))
    if (!raw.endsWith(currentSig)) {
      const value = buildDeviceId(info.uuid, info.timestamp, info.susCount)
      setCookie(cookieStore, value)
    }
    return info
  }

  const parts = raw.split('.')
  let prevSus = 0
  for (const p of parts) {
    const m = p.match(/^sus(\d+)$/)
    if (m) { prevSus = parseInt(m[1], 10); break }
  }

  const uuid = uuidv4()
  const ts = formatTimestamp(new Date())
  const susCount = prevSus + 1
  const value = buildDeviceId(uuid, ts, susCount)
  setCookie(cookieStore, value)
  return { uuid, timestamp: ts, susCount, raw: value }
}

// Returns the UUID portion of device_id (for DB queries)
export async function getDeviceId(): Promise<string> {
  const info = await ensure()
  return info.uuid
}

// Returns full device info including timestamp and sus count
export async function getDeviceIdInfo(): Promise<DeviceIdInfo> {
  return ensure()
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return '127.0.0.1'
}
