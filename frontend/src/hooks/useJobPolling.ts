import { useEffect, useState } from "react"

import { api } from "@/lib/api"
import type { JobStatusResponse } from "@/types"

const POLL_INTERVAL_MS = 1000

/**
 * Polls GET /api/jobs/{jobId} every second until the job leaves
 * an active state. Returns the latest status snapshot.
 */
export function useJobPolling(jobId: string | null, enabled = true) {
  const [status, setStatus] = useState<JobStatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!jobId || !enabled) return
    setError(null)
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined

    const tick = async () => {
      try {
        const { data } = await api.get<JobStatusResponse>(`/jobs/${jobId}`)
        if (!active) return
        setStatus(data)
        setError(null)
        if (data.status === "completed" || data.status === "failed" || data.status === "cancelled") {
          return
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to poll job status")
      }
      if (active) timer = setTimeout(tick, POLL_INTERVAL_MS)
    }

    void tick()
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [jobId, enabled])

  return { status: status?.job_id === jobId ? status : null, error }
}
