/* eslint-env browser */

export class AbortError extends Error {
  constructor (message) {
    super(message)
    this.type = 'aborted'
    this.name = 'AbortError'
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
