import { JSBI } from '../../services/chain'

export function SET_APC(state, payload) {
  state.apc = payload
}

export function SET_LOCKED(state, payload) {
  state.locked = payload
}

export function SET_REVENUE(state, payload) {
  state.revenue = payload
}

export function LOADING_LIST(state) {
  state.loadingList = true
}

export function SET_LIST(state, list) {
  state.list = list
  let locked = JSBI.BigInt(0)
  // let apc = 0
  for (let item of list) {
    locked = JSBI.ADD(locked, JSBI.BigInt(item.size))
  }

  state.locked = locked.toString()
}

export function LIST_LOADED(state) {
  state.loadingList = false
}
