export default class Chain {
  /**
   * roundAt determines the round number given a round time, a chain genesis and
   * a chain period.
   *
   * @param time {number} Round time in ms
   * @param genesis {number} Chain genesis time in ms
   * @param period {number} Chain period in ms
   */
  static roundAt (time, genesis, period) {
    if (time < genesis) return 1
    return Math.floor((time - genesis) / period) + 1
  }

  /**
   * roundTime determines the time a round should be available, given a chain
   * genesis and a chain period.
   *
   * @param round {number} Round number
   * @param genesis {number} Chain genesis time in ms
   * @param period {number} Chain period in ms
   */
  static roundTime (round, genesis, period) {
    round = round < 0 ? 0 : round
    return genesis + ((round - 1) * period)
  }
}
