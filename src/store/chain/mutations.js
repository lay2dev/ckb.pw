export function UPDATE_FEE_RATE(state, payload) {
  state.feeRate = parseInt(payload)
}

export function UPDATE_FEE(state, payload) {
  state.fee = payload
}
