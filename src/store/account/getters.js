export function addressGetter(state) {
  return state.address
}
export function balanceGetter(state) {
  return state.capacity.total
}
export function platformGetter(state) {
  return state.platform
}

export function minAmountGetter() {
  return 62
}
