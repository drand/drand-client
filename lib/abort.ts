export class AbortError extends Error {

    private type: string
    private code: string

    constructor(message?: string) {
        super(message || 'The operation was aborted')
        this.type = 'aborted'
        this.name = 'AbortError'
        this.code = 'ABORT_ERR'
    }
}

export function controllerWithParent(parentSignal?: AbortSignal) {
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

export function waitOrAbort(waitTime: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        if (signal.aborted) {
            return reject(new AbortError())
        }

        const timeoutId = setTimeout(() => {
            signal.removeEventListener('abort', onAbort)
            resolve()
        }, waitTime)

        const onAbort = () => {
            clearTimeout(timeoutId)
            reject(new AbortError())
        }

        signal.addEventListener('abort', onAbort)
    })
}
