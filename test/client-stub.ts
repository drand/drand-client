import {DrandOptions, RandomnessBeacon} from '../lib/drand'
import Chain from '../lib/chain'
import {controllerWithParent, waitOrAbort} from '../lib/abort'
import {ClientOptions} from '../lib/http'

interface TestOptions extends DrandOptions {
    latestBeaconIndex?: number
    beacons?: Array<TestBeacon>
}

type TestBeacon = {
    round: number
    delay?: number
}
export default class ClientStub {

    private beaconIndex: number
    private controllers: Array<AbortController>

    constructor (private options: TestOptions = {}) {
        this.beaconIndex = this.options.latestBeaconIndex || 0
        this.controllers = []
    }

    async get (round: number, options: ClientOptions) {
        options = options || {}
        const beacons = this.options.beacons || []
        const beacon = round
            ? beacons.find(b => b.round === round)
            : beacons[this.beaconIndex]
        if (!beacon) throw new Error('not found')

        const controller = controllerWithParent(options.signal)
        this.controllers.push(controller)

        try {
            await waitOrAbort(beacon.delay || 0, controller.signal)
        } finally {
            this.controllers = this.controllers.filter(c => c !== controller)
            controller.abort()
        }

        return beacon
    }

    info () {
        const { chainInfo } = this.options
        if (!chainInfo) throw new Error('no chain info passed to constructor')
        return chainInfo
    }

    async * watch(options: ClientOptions = {}): AsyncGenerator<RandomnessBeacon> {
        const { chainInfo } = this.options
        if (!chainInfo) throw new Error('watch needs to know period from missing chain info')

        const controller = controllerWithParent(options.signal)
        this.controllers.push(controller)

        const beacons = this.options.beacons || []

        try {
            while (true) {
                const beacon = beacons[this.beaconIndex]
                if (!beacon) throw new Error(`no beacon at index ${this.beaconIndex}`)
                await waitOrAbort(beacon.delay || 0, controller.signal)
                yield beacon as RandomnessBeacon
                this.beaconIndex++
                await waitOrAbort(chainInfo.period * 1000, controller.signal)
            }
        } finally {
            this.controllers = this.controllers.filter(c => c !== controller)
            controller.abort()
        }
    }

    roundAt (time: number) {
        const { chainInfo } = this.options
        if (!chainInfo) throw new Error('roundAt needs genesis and period from missing chain info')
        return Chain.roundAt(time, chainInfo.genesis_time * 1000, chainInfo.period * 1000)
    }

    close () {
        this.controllers.forEach(c => c.abort())
        this.controllers = []
    }
}
