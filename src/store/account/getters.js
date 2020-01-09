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

export function loadingBalanceGetter(state) {
  return state.loadingBalance
}

export function loadingTXsGetter(state) {
  return state.loadingTXs
}

export function txsGetter(state) {
  return state.txs
}

export const noMoreTXsGetter = state => state.noMoreTXs
