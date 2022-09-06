export interface SpeedTest {
    start: () => void
    stop: () => void
    average: () => number
}

export function createSpeedTest(test: () => Promise<void>, frequencyMs: number, samples: number = 5): SpeedTest {
    let queue = new DroppingQueue<number>(samples)
    let intervalId: ReturnType<typeof setInterval> | null = null

    const executeSpeedTest = async () => {
        const startTime = Date.now()
        try {
            await test()
            queue.add(Date.now() - startTime)
        } catch (err) {
            queue.add(Number.MAX_SAFE_INTEGER)
        }
    }

    return {
        start: () => {
            if (intervalId != null) {
                console.warn("Attempted to start a speed test, but it had already been started!")
                return
            }
            intervalId = setInterval(executeSpeedTest, frequencyMs)
        },
        stop: () => {
            if (intervalId !== null) {
                clearInterval(intervalId)
                intervalId = null
                queue = new DroppingQueue<number>(samples)
            }
        },
        average: (): number => {
            const values = queue.get()
            if (values.length === 0) {
                return Number.MAX_SAFE_INTEGER
            }

            const total = values.reduce((acc, next) => acc + next, 0)
            return total / values.length
        }
    }
}

class DroppingQueue<T> {
    values: Array<T> = []

    constructor(private capacity: number) {
    }

    add(value: T) {
        this.values.push(value)
        if (this.values.length > this.capacity) {
            this.values.pop()
        }
    }

    get(): Array<T> {
        return this.values
    }
}
