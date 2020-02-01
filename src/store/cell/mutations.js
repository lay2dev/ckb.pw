import { sumAmount } from '../../services/utils'
export function SET_TOTAL_CELL(state, payload) {
  state.total = payload
}

export function SET_UNSPENT(state, payload) {
  state.unSpent.cells = payload
  try {
    state.unSpent.capacity = payload.map(u => u.capacity).reduce(sumAmount)
  } catch (e) {
    state.unSpent = { cells: [], capacity: '0' }
  }
}
