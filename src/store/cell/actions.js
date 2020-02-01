import api from '../../services/api'
import { getLockHash } from '../../services/chain'

export async function LOAD_UNSPENT_CELLS({ commit }, { address, capacity }) {
  const lockHash = getLockHash(address)
  const cells = await api.getUnspentCells(lockHash, capacity)
  console.log('unspent cells', cells)
  commit('SET_UNSPENT', cells)
}

export function CLEAR_UNSPENT_CELLS({ commit }) {
  commit('SET_UNSPENT', [])
}
