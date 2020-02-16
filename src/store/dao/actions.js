import api from '../../services/api'
import { getLockHash } from '../../services/chain'
export async function LOAD_LIST({ commit }, { address }) {
  commit('LOADING_LIST')
  const list = await api.getDAOList(getLockHash(address))
  commit('SET_LIST', list)
  commit('LIST_LOADED')
}
