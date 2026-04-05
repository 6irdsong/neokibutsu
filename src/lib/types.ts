export interface Post {
  id: number
  date: string
  subject: string
  teacher: string
  author: string
  rating: string
  test: string | null
  report: string | null
  attendance: string | null
  assignment: string | null
  evaluation: string | null
  comment: string
  ip: string
  created_at: string
  device_id: string
  category: string
  like_count: number
  dislike_count: number
  deleted_at: string | null
}

export interface Report {
  id: number
  post_id: number
  subject: string
  category: string | null
  reason: string
  reporter_device_id: string
  reporter_anonymous_id: string | null
  reporter_sus_count: number | null
  reporter_device_created: string | null
  target_device_id: string | null
  status: string
  admin_response: string | null
  created_at: string
  resolved_at: string | null
}

export interface BannedDevice {
  device_id: string
  created_at: string
}

export interface Notification {
  id: number
  device_id: string
  anonymous_id: string | null
  message: string
  is_read: boolean
  created_at: string
}
