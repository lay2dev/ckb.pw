import web3Utils from 'web3-utils'
import { parseAddress } from '@nervosnetwork/ckb-sdk-utils'
import { JSBI, BigInt } from './ckb/utils'

export const verifyAddress = address => {
  // address must be a string
  if (typeof address !== 'string') return null

  // check if is eth address
  if (web3Utils.isAddress(address)) return 'eth'

  console.log('not eth address')
  let maybe = null

  address.startsWith('ckb') && (maybe = 'ckb')
  address.startsWith('ckt') && (maybe = 'ckt')

  if (!maybe) return null

  try {
    const hexAddress = parseAddress(address, 'hex')
    hexAddress.startsWith('0x0100') && (maybe += '_short')
    hexAddress.startsWith('0x0200') && (maybe += '_full')
    hexAddress.startsWith('0x0400') && (maybe += '_full')
  } catch (err) {
    return null
  }

  // check address length for each kind
  if (maybe.endsWith('short')) {
    if (address.length !== 46) maybe = null
  } else if (maybe.endsWith('full')) {
    if (address.length !== 95) maybe = null
  }

  return maybe
}
export const sumAmount = (a = 0, b = 0) =>
  JSBI.add(BigInt(a), BigInt(b)).toString()

export const subAmount = (a = 0, b = 0) =>
  JSBI.subtract(BigInt(a), BigInt(b)).toString()

export const cmpAmount = (a = 0, b = 0) => {
  const A = BigInt(a)
  const B = BigInt(b)
  if (JSBI.GT(A, B)) return 'gt'
  if (JSBI.LT(A, B)) return 'lt'
  return 'eq'
}

export const sleep = async ms => {
  await new Promise(r => setTimeout(r, ms))
}

export const displayDateTime = timestamp => {
  return new Date(timestamp).toLocaleString()
}
