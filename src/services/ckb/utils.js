import { ckb } from './core'
import * as ckbUtils from '@nervosnetwork/ckb-sdk-utils'
import web3Utils from 'web3-utils'

export const JSBI = ckbUtils.JSBI
export const { BigInt } = JSBI

// get full payload address from args(i.e. an ETH address)
export const getFullAddress = arg =>
  ckbUtils.fullPayloadToAddress({
    arg,
    prefix: ckb.pw.chain === 'main' ? 'ckb' : 'ckt',
    type: '0x04', // hash_type = 'Type'
    codeHash: ckb.pw.keccak_code_hash
  })

export const getLockScriptFromCKBAddress = address => {
  const payload = ckbUtils.parseAddress(address, 'hex').replace('0x', '')
  const type = payload.substring(0, 2)

  const lockScript = {}

  if (type === '01') {
    // short address

    switch (payload.substr(2, 2)) {
      case '00': // secp256k1 lock script
        lockScript.codeHash = ckb.config.secp256k1Dep.codeHash
        lockScript.hashType = ckb.config.secp256k1Dep.hashType
        break
      case '01': // multisig lock script
        lockScript.codeHash = ckb.config.multiSignDep.codeHash
        lockScript.hashType = ckb.config.multiSignDep.hashType
        break
      default:
        break
    }
    lockScript.args = '0x' + payload.substring(4)
  } else {
    // full payload address

    lockScript.codeHash = '0x' + payload.substring(2, 66)
    if (type === '02') {
      // hashType is 'data'
      lockScript.hashType = 'data'
    }
    if (type === '04') {
      // hashType is 'type
      lockScript.hashType = 'type'
    }
    lockScript.args = '0x' + payload.substring(66)
  }
  return lockScript
}

export const getLockScriptFromETHAddress = address => ({
  codeHash: ckb.pw.keccak_code_hash,
  hashType: 'type',
  args: address
})

export const getLockScriptFromAddress = address => {
  if (isCKBAddress(address)) return getLockScriptFromCKBAddress(address)
  if (web3Utils.isAddress(address)) return getLockScriptFromETHAddress(address)
  return null
}

export const getDaoTypeScript = () => ({
  codeHash: ckb.config.daoDep.typeHash,
  hashType: ckb.config.daoDep.hashType,
  args: '0x'
})

export const getPWDaoDeps = () => [
  ...ckb.pw.txCellDeps,
  { depType: 'code', outPoint: ckb.config.daoDep.outPoint }
]

export const absoluteEpochSince = ({ length, index, number }) => {
  const epochSince = JSBI.add(
    JSBI.add(
      JSBI.add(
        JSBI.leftShift(BigInt(0x20), BigInt(56)),
        JSBI.leftShift(BigInt(length), BigInt(40))
      ),
      JSBI.leftShift(BigInt(index), BigInt(24))
    ),
    BigInt(number)
  )

  return numberToHexString(epochSince)
}

export const isCKBAddress = address => {
  // address must be a string
  if (typeof address !== 'string') return false

  let maybe = null

  address.startsWith('ckb') && (maybe = 'ckb')
  address.startsWith('ckt') && (maybe = 'ckt')

  // not any type of ckb address
  if (!maybe) return null

  try {
    const hexAddress = ckbUtils.parseAddress(address, 'hex')
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
const ckbBase = '100000000'
const zero = BigInt(0)

export const toCKB = capacity => {
  if (web3Utils.isHexStrict(capacity)) {
    capacity = web3Utils.hexToNumberString(capacity)
  }
  var cap = BigInt(capacity)
  const base = BigInt(ckbBase)
  const negative = JSBI.LT(cap, zero)
  const baseLength = ckbBase.length - 1
  const options = {}

  if (negative) {
    // cap = cap.mul(negative1)
    cap = JSBI.unaryMinus(cap)
  }

  // var fraction = cap.mod(base).toString(10)
  var fraction = JSBI.remainder(cap, base).toString(10)

  while (fraction.length < baseLength) {
    fraction = `0${fraction}`
  }

  if (!options.pad) {
    fraction = fraction.match(/^([0-9]*[1-9]|0)(0*)/)[1]
  }

  // var whole = cap.div(base).toString(10); // eslint-disable-line
  var whole = JSBI.divide(cap, base).toString(10)

  if (options.commify) {
    whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  var value = `${whole}${fraction == '0' ? '' : `.${fraction}`}`

  if (negative) {
    value = `-${value}`
  }

  return value
}

export const fromCKB = capacity => {
  capacity === '' && (capacity = 0)
  var cap = BigInt(capacity).toString()
  const base = BigInt(ckbBase)
  const baseLength = ckbBase.length - 1

  // Is it negative?
  var negative = cap.substring(0, 1) === '-'
  if (negative) {
    cap = cap.substring(1)
  }

  if (cap === '.') {
    throw new Error(
      `[ckb-unit] while converting number ${capacity} to CKB, invalid value`
    )
  }

  // Split it into a whole and fractional part
  var comps = cap.split('.')
  if (comps.length > 2) {
    throw new Error(
      `[ckb-unit] while converting number ${capacity} to CKB,  too many decimal points`
    )
  }

  var whole = comps[0],
    fraction = comps[1]

  if (!whole) {
    whole = '0'
  }
  if (!fraction) {
    fraction = '0'
  }
  if (fraction.length > baseLength) {
    throw new Error(
      `[ckb-unit] while converting number ${capacity} to CKB, too many decimal places`
    )
  }

  while (fraction.length < baseLength) {
    fraction += '0'
  }

  whole = BigInt(whole)
  fraction = BigInt(fraction)
  // cap = whole.mul(base).add(fraction)
  cap = JSBI.add(JSBI.multiply(whole, base), fraction)

  if (negative) {
    cap = JSBI.unaryMinus(cap)
  }

  return cap
}

export const truncatedAddress = function(address, length = 17) {
  if (address === null || address.length <= length) return address

  const separator = length % 2 ? '...' : '..'
  const fixlen = (length - separator.length) / 2

  return `${address.slice(0, fixlen)}...${address.slice(-fixlen)}`
}

export const mergeTypedArraysUnsafe = (a, b) => {
  var c = new a.constructor(a.length + b.length)
  c.set(a)
  c.set(b, a.length)

  return c
}

export const numberToHexString = n => {
  // eslint-disable-next-line valid-typeof
  typeof n !== 'bigint' && (n = BigInt(n))
  return `0x${n.toString(16)}`
}
