
export default class Chain {
    /**
     * roundAt determines the round number given a round time, a chain genesis and
     * a chain period.
     *
     * @param time {number} Round time in ms
     * @param genesis {number} Chain genesis time in seconds
     * @param period {number} Chain period in seconds
     */
    static roundAt(time: number, genesis: number, period: number) {
        if (time < genesis * 1000) return 1
        return Math.floor((time - (genesis * 1000)) / (period * 1000)) + 1
    }


    /**
     * roundTime determines the time a round should be available (in milliseconds), given a chain
     * genesis and a chain period.
     *
     * @param round {number} Round number
     * @param genesis {number} Chain genesis time in seconds
     * @param period {number} Chain period in seconds
     */
    static roundTime (round: number, genesis: number, period: number) {
        round = round < 0 ? 0 : round
        return (genesis + (round - 1) * period) * 1000
    }
}
