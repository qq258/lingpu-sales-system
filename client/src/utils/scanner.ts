export interface ScannerOptions {
  minInterval?: number
  onScan: (code: string) => void
  onError?: (msg: string) => void
}

export function createScanner(options: ScannerOptions) {
  const { minInterval = 30, onScan, onError } = options
  let buffer = ''
  let lastTime = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  let attached = false

  function handleKeyDown(e: KeyboardEvent) {
    const now = Date.now()

    if (e.key === 'Enter') {
      if (buffer.length > 0) {
        onScan(buffer)
        buffer = ''
        if (timer) {
          clearTimeout(timer)
          timer = null
        }
      }
      e.preventDefault()
      return
    }

    if (e.ctrlKey || e.altKey || e.metaKey) {
      return
    }

    const interval = now - lastTime
    lastTime = now

    if (interval > 50 || buffer.length === 0) {
      buffer = ''
    }

    if (e.key.length === 1) {
      buffer += e.key
      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(() => {
        if (buffer.length > 0 && buffer.length < 4) {
          if (onError) onError('扫码识别失败，请重试')
        }
        buffer = ''
      }, 200)
    }
  }

  return {
    attach(element: HTMLElement = document.body) {
      if (attached) return
      element.addEventListener('keydown', handleKeyDown)
      attached = true
    },
    detach(element: HTMLElement = document.body) {
      if (!attached) return
      element.removeEventListener('keydown', handleKeyDown)
      attached = false
      buffer = ''
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    },
  }
}
