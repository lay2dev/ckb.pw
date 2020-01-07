// export function DAO_UPDATE(state, {apr, locked, revenue}) {
export function SET_APC(state, payload) {
  state.apc = payload
}

export function SET_LOCKED(state, payload) {
  state.locked = payload
}

export function SET_REVENUE(state, payload) {
  state.revenue = payload
}
