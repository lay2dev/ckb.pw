export function LOADING_BALANCE(state) {
  state.loadingBalance = true
}

export function BALANCE_LOADED(state) {
  state.loadingBalance = false
}

export function LOADING_TXS(state) {
  state.loadingTXs = true
}

export function TXS_LOADED(state) {
  state.loadingTXs = false
}

export function TXS_NO_MORE(state, payload) {
  state.noMoreTXs = payload
}

export function SET_PLATFORM(state, payload) {
  state.platform = payload
}

export function SET_ADDRESS(state, payload) {
  state.address = payload
}

export function SET_CAPACITY(state, payload) {
  state.capacity.total = payload
}

export function SET_TXS(state, payload) {
  state.txs = distinctObjectArray([...payload, ...state.txs], 'hash')
  state.txs = state.txs.sort((a, b) => b.time - a.time)
}

export function APPEND_TXS(state, payload) {
  state.txs = distinctObjectArray([...state.txs, ...payload], 'hash')
}

function distinctObjectArray(arr, prop) {
  const map = new Map()
  for (let obj of arr) {
    if (!map.has(obj[prop])) {
      map.set(obj[prop], obj)
    }
  }

  return Array.from(map.values())
}
