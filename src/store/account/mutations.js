export function SET_PLATFORM(state, payload) {
  state.platform = payload
  return state
}

export function SET_ADDRESS(state, payload) {
  state.address = payload
  return state
}

export function SET_CAPACITY(state, payload) {
  state.capacity.total = payload
  return state
}
