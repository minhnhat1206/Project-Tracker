import { useState, useEffect, useCallback } from 'react'
import useAppStore from '../store/useAppStore'

export function useSync() {
  const { syncStatus, lastSynced, triggerSync } = useAppStore()
  const [errorMsg, setErrorMsg] = useState(null)

  const handleSync = useCallback(async () => {
    try {
      setErrorMsg(null)
      await triggerSync()
    } catch (err) {
      setErrorMsg(err.message)
    }
  }, [triggerSync])

  const resetError = useCallback(() => setErrorMsg(null), [])

  // Poll Sheet every 60s — dùng reloadTasks (an toàn, không xoá data nếu fetch rỗng)
  useEffect(() => {
    const interval = setInterval(() => {
      const { reloadTasks, tasks } = useAppStore.getState()
      Object.keys(tasks).forEach(pid => reloadTasks(pid))
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  return { status: syncStatus, lastSynced, errorMsg, triggerSync: handleSync, resetError }
}
