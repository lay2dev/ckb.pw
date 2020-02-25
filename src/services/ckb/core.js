import CKBCore from '@nervosnetwork/ckb-sdk-core'
import * as ckbUtils from '@nervosnetwork/ckb-sdk-utils'
import api from '../api'
import {
  txBuilder,
  depositTxBuilder,
  settleTxBuilder,
  claimTxBuilder
} from './builders'
import txSize from './txSize'
import { sumAmount, cmpAmount } from '../utils'
import {
  fromCKB,
  getLockScriptFromAddress,
  mergeTypedArraysUnsafe,
  getDaoTypeScript,
  numberToHexString
} from './utils'

export const MIN_FEE_RATE = 1000
export const DAO_LOCK_PERIOD_EPOCHS = 180
export var ckb

var cells = []
var lastId = 0
var lastSize = 0
var feeRate = MIN_FEE_RATE
var platform = {
  provider: null,
  chain: null,
  typedData: false
}

export const initPW = async nodeUrl => {
  ckb = new CKBCore(nodeUrl)

  const res = await Promise.all([
    await api.loadK1Cell(),
    await api.loadMultiSigCell(),
    await api.loadDaoCell(),
    await api.getConfig()
  ])
  ckb.pw = {}
  ckb.config.secp256k1Dep = res[0]
  ckb.config.multiSignDep = res[1]
  ckb.config.daoDep = res[2]
  ckb.pw.apc = res[3].apc
  ckb.pw.keccak_code_hash = res[3].keccak_code_hash
  ckb.pw.txCellDeps = res[3].cellDeps
  ckb.rpc.getBlockchainInfo().then(info => {
    ckb.pw.chain = info.chain
    console.log('chain info', info)
  })

  console.log('pw init: ', ckb.pw)
}

/**
 * setters
 **/
export const setFeeRate = _feeRate => {
  feeRate = Number(_feeRate)
  return ckbUtils.calculateTransactionFee(
    numberToHexString(lastSize),
    numberToHexString(feeRate)
  )
}
export const setPlatform = ({ provider, chain }) => {
  const EIP712Supported = ['MetaMask']
  platform.provider = provider
  platform.chain = chain
  platform.typedData = EIP712Supported.includes(provider)
}

/**
 * getters
 **/
export const getFeeRate = () => feeRate
export const calcFee = async (address, amount, extra) => {
  console.log('[calcFee] amount:', amount)
  await reloadCells(address, amount)
  let tx = null
  switch (extra.type) {
    case 'deposit':
      tx = depositTxBuilder(address, amount, cells)
      break
    case 'settle':
      tx = settleTxBuilder(address, extra.data)
      break
    case 'claim':
      tx = claimTxBuilder(extra.data)
      break
    default:
      tx = txBuilder(address, cells, extra.data)
  }
  lastSize = txSize(tx)
  return ckbUtils.calculateTransactionFee(
    numberToHexString(lastSize),
    numberToHexString(feeRate)
  )
}
/**
 * actions
 **/
export const sendTx = async (fromAddress, outputs) => {
  const amount = outputs.map(o => o.amount).reduce(sumAmount)
  const fee = await calcFee(fromAddress, amount, { data: outputs })
  const tx = txBuilder(fromAddress, cells, outputs, fee)
  console.log('[sendTx] Raw TX: ', tx)
  const signedTx = await sign(tx, fromAddress)
  console.log('[sendTx] Signed TX: ', signedTx)

  // const txHash = await ckb.rpc.sendTransaction(signedTx, 'passthrough')
  const txHash = await ckb.rpc.sendTransaction(signedTx)
  console.log('[sendTx] TX Hash: ', txHash)
  // clear local cells when sent
  lastId = cells[cells.length - 1].id
  cells = []
  return txHash
}

export const deposit = async (fromAddress, amount) => {
  const fee = await calcFee(fromAddress, amount, { type: 'deposit' })
  const depositTx = depositTxBuilder(fromAddress, amount, cells, fee)
  console.log('[deposit] deposit tx', depositTx)
  const signedTx = await sign(depositTx, fromAddress)
  console.log('[deposit] signed tx', signedTx)

  const txHash = await ckb.rpc.sendTransaction(signedTx)
  // clear local cells when sent
  lastId = cells[cells.length - 1].id
  cells = []
  return txHash
}

export const settle = async (fromAddress, daoItem) => {
  let outputCell = {
    capacity: numberToHexString(daoItem.size),
    lock: getLockScriptFromAddress(fromAddress),
    type: getDaoTypeScript()
  }
  const depositOutPoint = {
    txHash: daoItem.hash,
    index: numberToHexString(daoItem.idx)
  }
  const extra = {
    type: 'settle',
    data: {
      changeCell: cells[0],
      depositHeader: daoItem.depositBlockHeader,
      depositOutPoint,
      outputCell
    }
  }
  const fee = await calcFee(fromAddress, fromCKB(62), extra)
  const settleTx = settleTxBuilder(fromAddress, extra.data, fee)

  outputCell = { ...outputCell, outPoint: depositOutPoint }
  cells.push(outputCell)
  const signedTx = await sign(settleTx, fromAddress)

  const txHash = await ckb.rpc.sendTransaction(signedTx)
  // clear local cells when sent
  lastId = cells[cells.length - 1].id
  cells = []
  return txHash
}

export const claim = () => {}

async function sign(rawTx, fromAddress) {
  const {
    rawTransactionToHash,
    hexToBytes,
    serializeWitnessArgs,
    toHexInLittleEndian
  } = ckbUtils

  const emptyWitness = {
    ...rawTx.witnesses[0],
    lock: `0x${'0'.repeat(130)}`
  }
  const serializedEmptyWitnessBytes = hexToBytes(
    serializeWitnessArgs(emptyWitness)
  )
  const serialziedEmptyWitnessSize = serializedEmptyWitnessBytes.length

  let hashBytes = hexToBytes(rawTransactionToHash(rawTx))
  hashBytes = mergeTypedArraysUnsafe(
    hashBytes,
    hexToBytes(
      toHexInLittleEndian(`0x${serialziedEmptyWitnessSize.toString(16)}`, 8)
    )
  )
  hashBytes = mergeTypedArraysUnsafe(hashBytes, serializedEmptyWitnessBytes)

  rawTx.witnesses.slice(1).forEach(w => {
    const bytes = hexToBytes(
      typeof w === 'string' ? w : serializeWitnessArgs(w)
    )
    hashBytes = mergeTypedArraysUnsafe(
      hashBytes,
      hexToBytes(toHexInLittleEndian(`0x${bytes.length.toString(16)}`, 8))
    )
    hashBytes = mergeTypedArraysUnsafe(hashBytes, bytes)
  })

  // now we can sign with desired provider
  let tx = null
  let typedDataParams = null
  if (platform.typedData) {
    typedDataParams = {
      inputCapacity: getInputCapacity(rawTx.inputs),
      outputs: rawTx.outputs
    }
  }
  try {
    if (platform.chain === 'eth') {
      emptyWitness.lock = await (await import('../eth/core')).ethSign(
        fromAddress,
        hashBytes,
        platform.provider,
        typedDataParams
      )
    } else {
      throw new Error('Unsupported platform: ', platform)
    }

    let signedWitnesses = [
      serializeWitnessArgs(emptyWitness),
      ...rawTx.witnesses.slice(1)
    ]

    tx = {
      ...rawTx,
      witnesses: signedWitnesses.map(witness =>
        typeof witness === 'string' ? witness : serializeWitnessArgs(witness)
      )
    }
  } catch (e) {
    console.log('[sign] error', e)
  }

  return tx
}

async function reloadCells(address, needed) {
  needed = fromCKB(needed)
  const lockHash = ckbUtils.scriptToHash(getLockScriptFromAddress(address))
  console.log('[reloadCells] cells begin', cells)
  if (cells.length) {
    const local = cells.map(c => c.capacity).reduce(sumAmount)
    console.log('[reloadCells] local, needed', local, needed)
    if (cmpAmount(local, needed) === 'lt') {
      // lastId = cells[cells.length - 1].id
      // needed = JSBI.subtract(needed, local)
      console.log('[reloadCells] new needed', needed)
    } else return
  }

  cells = await api.getUnspentCells(lockHash, needed, lastId)
  console.log('[reloadCells] cells end', cells)
}

function getInputCapacity(inputs) {
  const cellId = ({ txhash, index }) => `${txhash}+${index}`
  const cellMatch = input =>
    cells.find(c => cellId(c.outPoint) === cellId(input.previousOutput))
  return inputs.map(i => cellMatch(i).capacity).reduce(sumAmount)
}
