import api from '../../services/api'
import { getLockHash } from '../../services/chain'

export async function LOAD_UNSPENT_CELLS(
  { commit },
  { address, capacity, lastId }
) {
  commit('LOADING_UNSPENT')
  const lockHash = getLockHash(address)
  const cells = await api.getUnspentCells(lockHash, capacity, lastId)
  console.log('unspent cells', cells)
  commit('SET_UNSPENT', cells)
  commit('UNSPENT_LOADED')
}

export function CLEAR_UNSPENT_CELLS({ commit }, { lastId }) {
  commit('SET_UNSPENT', [])
  lastId && commit('SET_LAST_ID', lastId)
}
