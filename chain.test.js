import test from 'ava'
import Chain from './chain.js'

test('should get round 1 when time is less than genesis', t => {
  t.is(Chain.roundAt(0, 1, 1000), 1)
})

test('should get round 1 for first round', t => {
  t.is(Chain.roundAt(1, 0, 1000), 1)
})

test('should get round 2 for second round', t => {
  t.is(Chain.roundAt(1001, 0, 1000), 2)
})

test('should get time 0 when round is < 0', t => {
  t.is(Chain.roundTime(1, 0, 1000), 0)
})

test('should get time 0 for first round', t => {
  t.is(Chain.roundTime(1, 0, 1000), 0)
})

test('should get time 1000 for second round', t => {
  t.is(Chain.roundTime(2, 0, 1000), 1000)
})
