export function UPDATE(state, payload) {
  for (let key in payload) {
    state[key] = payload[key]
  }
}
