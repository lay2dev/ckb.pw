import api from '../../services/api'
import { scriptToHash } from '@nervosnetwork/ckb-sdk-utils'
import { getLockScriptFromETHAddress } from '../../services/ckb/utils'

export async function LOAD_BALANCE({ commit }, { address, quiet }) {
  try {
    const lockHash = scriptToHash(getLockScriptFromETHAddress(address))
    if (lockHash) {
      !quiet && commit('LOADING_BALANCE')
      const capacity = await api.getBalance(lockHash)
      commit('SET_CAPACITY', capacity)
      !quiet && commit('BALANCE_LOADED')
    }
  } catch (e) {
    console.log(e.toString())
  }
}

export async function LOAD_TXS(
  { commit, getters },
  { lastHash, size = 20, type = 'all', quiet }
) {
  try {
    const lockHash = scriptToHash(
      getLockScriptFromETHAddress(getters.addressGetter)
    )
    if (lockHash) {
      !quiet && commit('LOADING_TXS')
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
      !quiet && commit('TXS_LOADED')
    } else {
      console.log('address not ready')
    }
  } catch (e) {
    console.log(e.toString())
  }
}
