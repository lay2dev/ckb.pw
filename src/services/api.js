import axios from 'axios'
import { Notify } from 'quasar'

const BASE_URL = 'https://api.ckb.pw/'

export const API = {
  GetUnspentCells: BASE_URL + 'cell/unSpent',
  LoadDaoCell: BASE_URL + 'cell/loadDaoCell',
  LoadK1: BASE_URL + 'cell/loadSecp256k1Cell',
  GetTxList: BASE_URL + 'cell/txList'
}

export const get = async (url, params) => {
  url += '?'
  for (let p in params) {
    url += `${p}=${params[p]}&`
  }
  let ret = null
  try {
    ret = await axios.get(url)
  } catch (e) {
    Notify.create({
      message: '[API] - ' + e.toString(),
      position: 'top',
      timeout: 2000,
      color: 'negative'
    })
  }

  return ret
}

export default {
  getUnspentCells: async (lockHash, capacity) =>
    get(API.GetUnspentCells, { lockHash, capacity }),
  getTxList: async (lockHash, page, size, type) =>
    get(API.GetTxList, { lockHash, page, size, type }),
  LoadK1: async () => get(API.LoadK1),
  loadDaoCell: async () => get(API.LoadDaoCell)
}
