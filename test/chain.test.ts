import Chain from '../lib/chain'

test('should get round 1 when time is less than genesis', () => {
  expect(Chain.roundAt(0, 1, 1000)).toBe(1)
})

test('should get round 1 for first round', () => {
  expect(Chain.roundAt(1, 0, 1000)).toBe(1)
})

test('should get round 2 for second round', () => {
  expect(Chain.roundAt(1001, 0, 1)).toBe(2)
})

test('should get time 0 when round is < 0', () => {
  expect(Chain.roundTime(1, 0, 1000)).toBe(0)
})

test('should get time 0 for first round', () => {
  expect(Chain.roundTime(1, 0, 1000)).toBe(0)
})

test('should get time 1000 for second round', () => {
  expect(Chain.roundTime(2, 0, 1)).toBe(1000)
})

test('should get time of genesis (in ms) for first round', () => {
  expect(Chain.roundTime(1, 1595431050, 1)).toBe(1595431050000)
})

test('should get time genesis + 1000 for second round', () => {
  expect(Chain.roundTime(2, 1595431050, 1)).toBe(1595431051000)
})

test('should work with different period as well', () => {
  expect(Chain.roundTime(2, 1595431050, 30)).toBe(1595431080000)
})

test('and should work with a larger round number', () => {
  expect(Chain.roundTime(2185561, 1595431050, 30)).toBe(1660997850000)
})
