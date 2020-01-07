import { getBalance } from '../../services/chain'

export async function LOAD_BALANCE({ commit, getters }) {
  commit('LOADING_BALANCE')
  const address = getters.addressGetter
  const ret = await getBalance(address)
  if (ret) {
    commit('SET_CAPACITY', ret.capacity)
    commit('cell/SET_TOTAL_CELL', ret.cellsCount, { root: true })
  }
  commit('BALANCE_LOADED')
}
