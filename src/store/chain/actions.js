import api from '../../services/api'

export async function LOAD_FEE_RATE({ commit }) {
  const feeRate = await api.getFeeRate()
  commit('UPDATE_FEE_RATE', feeRate)
}
