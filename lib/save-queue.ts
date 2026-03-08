/**
 * Cola de reintentos con localStorage para guardados que fallan por conexión.
 * Solo para payloads pequeños (horario, senado, camara). NO para fotos (base64).
 */

const QUEUE_KEY = 'testigos_pending_saves'
const MAX_RETRIES = 10
const RETRY_DELAYS = [3000, 5000, 10000, 15000, 30000, 60000] // ms

export interface PendingSave {
  id: string
  url: string
  payload: Record<string, any>
  retries: number
  createdAt: number
  description: string // e.g. "Conteo 8am - Mesa 5"
}

function getQueue(): PendingSave[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function setQueue(queue: PendingSave[]) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)) } catch { /* full */ }
}

/** Add a save operation to the queue (before attempting) */
export function enqueue(url: string, payload: Record<string, any>, description: string): string {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const queue = getQueue()
  queue.push({ id, url, payload, retries: 0, createdAt: Date.now(), description })
  setQueue(queue)
  return id
}

/** Remove from queue (after successful save) */
export function dequeue(id: string) {
  const queue = getQueue().filter(item => item.id !== id)
  setQueue(queue)
}

/** Get all pending saves */
export function getPending(): PendingSave[] {
  return getQueue()
}

/** Get count of pending saves */
export function getPendingCount(): number {
  return getQueue().length
}

/**
 * Try to send a save request. If it fails, keeps it in the queue for retry.
 * Returns { exito, data } or throws after adding to retry queue.
 */
export async function saveWithRetry(
  url: string,
  payload: Record<string, any>,
  description: string,
): Promise<{ exito: boolean; mensaje?: string; data?: any }> {
  const id = enqueue(url, payload, description)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()

    if (data.exito) {
      dequeue(id)
      return data
    }

    // API returned error (not network) - don't retry, remove from queue
    dequeue(id)
    return data
  } catch {
    // Network error - keep in queue for retry
    return { exito: false, mensaje: 'Sin conexión. Los datos se guardarán automáticamente cuando vuelva la señal.' }
  }
}

/**
 * Process all pending saves in the queue. Call on app mount or when connection returns.
 * Returns number of successfully processed items.
 */
export async function processPendingQueue(
  onSuccess?: (item: PendingSave) => void,
  onFail?: (item: PendingSave) => void,
): Promise<number> {
  const queue = getQueue()
  if (queue.length === 0) return 0

  let processed = 0

  for (const item of queue) {
    if (item.retries >= MAX_RETRIES) {
      // Too many retries, remove
      dequeue(item.id)
      onFail?.(item)
      continue
    }

    try {
      const res = await fetch(item.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      })
      const data = await res.json()

      if (data.exito) {
        dequeue(item.id)
        processed++
        onSuccess?.(item)
      } else {
        // API error (e.g. "ya fue registrado") - remove, don't retry
        dequeue(item.id)
        processed++
        onSuccess?.(item)
      }
    } catch {
      // Still offline - increment retry and keep
      const updated = getQueue().map(q =>
        q.id === item.id ? { ...q, retries: q.retries + 1 } : q
      )
      setQueue(updated)
      onFail?.(item)
    }
  }

  return processed
}

/** Get delay for next retry based on retry count */
export function getRetryDelay(retries: number): number {
  return RETRY_DELAYS[Math.min(retries, RETRY_DELAYS.length - 1)]
}
