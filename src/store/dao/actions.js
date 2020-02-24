import api from '../../services/api'
import { getLockScriptFromAddress } from '../../services/ckb/utils'
import { scriptToHash } from '@nervosnetwork/ckb-sdk-utils'
export async function LOAD_LIST({ commit }, { address }) {
  commit('LOADING_LIST')
  const list = await api.getDAOList(
    scriptToHash(getLockScriptFromAddress(address))
  )
  commit('SET_LIST', list)
  commit('LIST_LOADED')
}
