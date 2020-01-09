import axios from 'axios'
import { Notify } from 'quasar'

const BASE_URL = 'https://api.ckb.pw/'
// const BASE_URL = 'http://192.168.1.137:3000/'

export const API = {
  GetUnspentCells: BASE_URL + 'cell/unSpent',
  LoadDaoCell: BASE_URL + 'cell/loadDaoCell',
  LoadK1: BASE_URL + 'cell/loadSecp256k1Cell',
  GetTxList: BASE_URL + 'cell/txList',
  GetConfig: BASE_URL + 'cell/getConfig',
  GetBalance: BASE_URL + 'cell/getCapacityByLockHash'
}

export const get = async (url, params) => {
  url += '?'
  for (let p in params) {
    if (params[p]) {
      url += `${p}=${params[p]}&`
    }
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
  getUnspentCells: async (lockHash, capacity) => {
    const { data } = await get(API.GetUnspentCells, { lockHash, capacity })
    return data
  },
  getTxList: async (lockHash, lastHash, size, type) => {
    const { data } = await get(API.GetTxList, {
      lockHash,
      lastHash,
      size,
      type
    })
    return data
  },
  LoadK1: async () => {
    const { data } = await get(API.LoadK1)
    return data
  },
  loadDaoCell: async () => get(API.LoadDaoCell),
  getConfig: async () => {
    const { data } = await get(API.GetConfig)
    return data
  },
  getBalance: async lockHash => {
    const { data } = await get(API.GetBalance, { lockHash })
    return data
  }
}
