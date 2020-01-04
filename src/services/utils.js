import JSBI from 'jsbi'

export { JSBI }

export const sumAmount = (a, b) => {
  return JSBI.add(JSBI.BigInt(safe(a)), JSBI.BigInt(safe(b))).toString()
}

export const subAmount = (a, b) => {
  return JSBI.subtract(JSBI.BigInt(safe(a)), JSBI.BigInt(safe(b))).toString()
}

function safe(n) {
  !n && (n = 0)
  return n
}
