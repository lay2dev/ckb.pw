// import { getBalance } from '../../services/chain'
import api from '../../services/api'
import { getLockHash } from '../../services/chain'

export async function LOAD_BALANCE({ commit, getters }) {
  try {
    const lockHash = getLockHash(getters.addressGetter)
    if (lockHash) {
      commit('LOADING_BALANCE')
      const capacity = await api.getBalance(lockHash)
      commit('SET_CAPACITY', capacity)
      // commit('cell/SET_TOTAL_CELL', ret.cellsCount, { root: true })
      commit('BALANCE_LOADED')
    }
  } catch (e) {
    e.toString()
  }
}

export async function LOAD_TXS(
  { commit, getters },
  { lastHash, size = 20, type }
) {
  try {
    const lockHash = getLockHash(getters.addressGetter)
    if (lockHash) {
      commit('LOADING_TXS')
      const txs = await api.getTxList(lockHash, lastHash, size, type)
      if (txs.length) {
        lastHash ? commit('APPEND_TXS', txs) : commit('SET_TXS', txs)
        commit('TXS_NO_MORE', false)
      } else {
        commit('TXS_NO_MORE', true)
      }
      commit('TXS_LOADED')
    } else {
      console.log('address not ready')
    }
  } catch (e) {
    e.toString()
  }
}
