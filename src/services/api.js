/* eslint-disable prettier/prettier */
import axios from 'axios'
import GTM from '../components/gtm'
import { Notify } from 'quasar'

const BASE_URL = 'https://api.ckb.pw/'
// const BASE_URL = 'http://192.168.1.137:3000/'

export const API = {
  GetUnspentCells: BASE_URL + 'cell/unSpent',
  LoadDaoCell: BASE_URL + 'cell/loadDaoCell',
  LoadK1Cell: BASE_URL + 'cell/loadSecp256k1Cell',
  LoadMultiSigCell: BASE_URL + 'cell/loadMultiSigCell',
  GetTxList: BASE_URL + 'cell/txList',
  GetConfig: BASE_URL + 'cell/getConfig',
  GetBalance: BASE_URL + 'cell/getCapacityByLockHash',
  GetFeeRate: BASE_URL + 'block/feeRate',
  GetDAOList: BASE_URL + 'dao/daoList'
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
    GTM.logEvent({
      'category': 'exceptions',
      'action': url.split('/').pop(),
      'label': 'API',
      'value': 'error: ' + e.toString() + 'params: ' + JSON.stringify(params)
    })
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
  getUnspentCells: async (lockHash, capacity, lastId) => {
    const { data } = await get(API.GetUnspentCells, {
      lockHash,
      capacity,
      lastId
    })
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
  loadK1Cell: async () => {
    const { data } = await get(API.LoadK1Cell)
    return data
  },
  loadMultiSigCell: async () => {
    const { data } = await get(API.LoadMultiSigCell)
    return data
  },
  loadDaoCell: async () => {
    const { data } = await get(API.LoadDaoCell)
    return data
  },
  getConfig: async () => {
    const { data } = await get(API.GetConfig)
    return data
  },
  getBalance: async lockHash => {
    const { data } = await get(API.GetBalance, { lockHash })
    return data
  },
  getFeeRate: async speed => {
    const { data } = await get(API.GetFeeRate)
    if (speed) {
      return data.feeRate
    } else {
      return data.feeRate
    }
  },
  getDAOList: async lockHash => {
    const { data } = await get(API.GetDAOList, { lockHash })
    return data
  }
}
