/* eslint-env browser */

export class AbortError extends Error {
  constructor (message) {
    super(message || 'The operation was aborted')
    this.type = 'aborted'
    this.name = 'AbortError'
    this.code = 'ABORT_ERR'
  }
}

export function controllerWithParent (parentSignal) {
  const controller = new AbortController()

  if (parentSignal == null) {
    return controller
  }

  if (parentSignal.aborted) {
    controller.abort()
    return controller
  }

  const onAbort = () => {
    controller.abort()
    parentSignal.removeEventListener('abort', onAbort)
  }

  parentSignal.addEventListener('abort', onAbort)

  controller.signal.addEventListener('abort', () => {
    parentSignal.removeEventListener('abort', onAbort)
  })

  return controller
}
