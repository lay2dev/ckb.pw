import web3Utils from 'web3-utils'
import { parseAddress } from '@nervosnetwork/ckb-sdk-utils'
import BN from 'bn.js'
import numberToBN from 'number-to-bn'

export const displayLongAddress = (address, maxlen = 20) => {
  !address && (address = 'NULL')
  address.length > maxlen &&
    (address =
      address.slice(0, 8) +
      (address.length > 46 ? '......' : '...') +
      address.slice(-8))
  return address
}

export const sumAmount = (a, b) => {
  const A = new BN(safe(a))
  const B = new BN(safe(b))
  return A.add(B).toString()
}

export const subAmount = (a, b) => {
  const A = new BN(safe(a))
  const B = new BN(safe(b))
  return A.sub(B).toString()
}

export const cmpAmount = (a, b) => {
  const A = new BN(safe(a))
  const B = new BN(safe(b))
  console.log('cmp:', A.toString(), B.toString())
  if (A.gt(B)) return 'gt'
  if (A.lt(B)) return 'lt'
  return 'eq'
}

// eslint-disable-next-line prettier/prettier
const unitMap = { 'ckb': '100000000' }
const zero = new BN(0)
const negative1 = new BN(-1)
const unit = 'ckb'
export const toCKB = capacity => {
  if (web3Utils.isHexStrict(capacity)) {
    capacity = web3Utils.hexToNumberString(capacity)
  }
  var cap = numberToBN(capacity)
  var negative = cap.lt(zero)
  const base = getValueOfUnit(unit)
  const baseLength = unitMap[unit].length - 1 || 1
  const options = {}

  if (negative) {
    cap = cap.mul(negative1)
  }

  var fraction = cap.mod(base).toString(10)

  while (fraction.length < baseLength) {
    fraction = `0${fraction}`
  }

  if (!options.pad) {
    fraction = fraction.match(/^([0-9]*[1-9]|0)(0*)/)[1]
  }

  var whole = cap.div(base).toString(10); // eslint-disable-line

  if (options.commify) {
    whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  var value = `${whole}${fraction == '0' ? '' : `.${fraction}`}`; // eslint-disable-line

  if (negative) {
    value = `-${value}`
  }

  return value
}

export const fromCKB = capacity => {
  var cap = numberToString(capacity)
  const base = getValueOfUnit(unit)
  const baseLength = unitMap[unit].length - 1 || 1

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

  whole = new BN(whole)
  fraction = new BN(fraction)
  cap = whole.mul(base).add(fraction)

  if (negative) {
    cap = cap.mul(negative1)
  }

  return new BN(cap.toString(10), 10)
}

export const verifyAddress = address => {
  // address must be a string
  if (typeof address !== 'string') return null

  // check if is eth address
  console.log('verify address:', address)
  const isEthAddress = /^0x[a-fA-F0-9]{40}$/.test(address)
  if (isEthAddress) return 'eth'

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

function numberToString(arg) {
  if (typeof arg === 'string') {
    if (!arg.match(/^-?[0-9.]+$/)) {
      throw new Error(
        `while converting number to string, invalid number value '${arg}', should be a number matching (^-?[0-9.]+).`
      )
    }
    return arg
  } else if (typeof arg === 'number') {
    return String(arg)
  } else if (
    typeof arg === 'object' &&
    arg.toString &&
    (arg.toTwos || arg.dividedToIntegerBy)
  ) {
    if (arg.toPrecision) {
      return String(arg.toPrecision())
    } else {
      return arg.toString(10)
    }
  }
  throw new Error(
    `while converting number to string, invalid number value '${arg}' type ${typeof arg}.`
  )
}

function getValueOfUnit(unitInput) {
  const unit = unitInput ? unitInput.toLowerCase() : 'ether'
  var unitValue = unitMap[unit]

  if (typeof unitValue !== 'string') {
    throw new Error(
      `[ethjs-unit] the unit provided ${unitInput} doesn't exists, please use the one of the following units ${JSON.stringify(
        unitMap,
        null,
        2
      )}`
    )
  }

  return new BN(unitValue, 10)
}

function safe(n) {
  !n && (n = 0)
  web3Utils.isHexStrict(n) && (n = web3Utils.hexToNumberString(n))
  return n
}

export const sleep = async ms => {
  await new Promise(r => setTimeout(r, ms))
}

export const formatCKBAddress = function(address) {
  if (address === null || address.length <= 17) {
    return address
  }

  const len = address.length
  const formatedAddress =
    address.substring(0, 7) + '...' + address.substr(len - 7, 7)
  console.log(address, formatedAddress)
  return formatedAddress
}
