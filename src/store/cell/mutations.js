import { sumAmount } from '../../services/utils'
export function SET_TOTAL_CELL(state, payload) {
  state.total = payload
}

export function SET_UNSPENT(state, cells) {
  state.unSpent.cells = cells
  try {
    state.unSpent.capacity = cells.map(c => c.capacity).reduce(sumAmount)
    state.unSpent.lastId = cells[cells.length - 1].id
  } catch (e) {
    state.unSpent = { cells: [], capacity: '0', lastId: 0 }
  }
}

export function SET_LAST_ID(state, lastId) {
  state.unSpent.lastId = lastId
}

export function LOADING_UNSPENT(state) {
  state.loadingUnSpent = true
}

export function UNSPENT_LOADED(state) {
  state.loadingUnSpent = false
}
