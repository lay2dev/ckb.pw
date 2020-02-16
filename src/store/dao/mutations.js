import { JSBI } from '../../services/chain'
import { toCKB } from '../../services/utils'

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
  let revenue = JSBI.BigInt(0)
  let apc = 0
  for (let item of list) {
    const sizeBN = JSBI.BigInt(item.size)
    const revenueBN = JSBI.subtract(JSBI.BigInt(item.countedCapacity), sizeBN)
    item.revenue = revenueBN.toString()
    item.apc = parseFloat(item.rate * 100).toFixed(2)
    locked = JSBI.ADD(locked, sizeBN)
    revenue = JSBI.ADD(revenue, revenueBN)
    const amount = parseFloat(toCKB(item.size))
    apc += item.apc * amount
  }

  state.locked = locked.toString()
  state.revenue = revenue.toString()
  state.apc = parseFloat(apc / parseFloat(toCKB(state.locked))).toFixed(2)
}

export function LIST_LOADED(state) {
  state.loadingList = false
}
