import api from '../../services/api'
import { scriptToHash } from '@nervosnetwork/ckb-sdk-utils'
import { getLockScriptFromAddress } from '../../services/ckb/utils'

export async function LOAD_BALANCE({ commit, getters }) {
  try {
    const lockHash = scriptToHash(
      getLockScriptFromAddress(getters.addressGetter)
    )
    if (lockHash) {
      commit('LOADING_BALANCE')
      const capacity = await api.getBalance(lockHash)
      commit('SET_CAPACITY', capacity)
      commit('BALANCE_LOADED')
    }
  } catch (e) {
    e.toString()
  }
}

export async function LOAD_TXS(
  { commit, getters },
  { lastHash, size = 20, type = 'all' }
) {
  try {
    const lockHash = scriptToHash(
      getLockScriptFromAddress(getters.addressGetter)
    )
    if (lockHash) {
      commit('LOADING_TXS')
      const txs = await api.getTxList(lockHash, lastHash, size, type)
      if (txs.length) {
        if (lastHash) {
          commit('APPEND_TXS', txs)
        } else {
          commit('SET_TXS', txs)
          commit('TXS_NO_MORE', false)
        }
      } else {
        !lastHash && commit(commit('SET_TXS', txs))
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
