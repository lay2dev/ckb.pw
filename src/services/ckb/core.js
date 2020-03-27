import CKBCore from '@nervosnetwork/ckb-sdk-core'
import * as ckbUtils from '@nervosnetwork/ckb-sdk-utils'
import ENS from 'ethereum-ens'
import { Notify } from 'quasar'
import api from '../api'
import GTM from '../../components/gtm'
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
  JSBI,
  BigInt,
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
var noMoreCells = false
var lastSize = 0
var feeRate = MIN_FEE_RATE
var platform = {
  provider: null,
  chain: null,
  typedData: false
}

const PRELOAD_AMOUNT = 10000

export const initPW = async nodeUrl => {
  ckb = new CKBCore(nodeUrl)

  const res = await Promise.all([
    api.loadK1Cell(),
    api.loadMultiSigCell(),
    api.loadDaoCell(),
    api.getConfig()
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
export const isNoMoreCells = () => noMoreCells
export const calcFee = async (address, amount, extra) => {
  console.log('[calcFee] amount:', amount)
  await reloadCells(address, amount)
  let tx = null,
    outputs = null
  switch (extra.type) {
    case 'deposit':
      tx = depositTxBuilder(address, amount, cells)
      break
    case 'settle':
      extra.data.feeCell = cells[0]
      tx = settleTxBuilder(address, extra.data)
      break
    case 'claim':
      tx = claimTxBuilder(extra.data)
      break
    default:
      // check if any ens name exists
      outputs = extra.data
      for (let i = 0; i < outputs.length; i++) {
        let addr = outputs[i].address
        if (addr.endsWith('.eth')) {
          outputs[i].address = await new ENS(window.web3.currentProvider)
            .resolver(addr)
            .addr()
          console.log(`${addr} resolved as ${outputs[i].address}`)
          if (!Number(outputs[i].address)) {
            outputs[i].address = 'Unknown ENS Name'
            throw new Error('No records of ens name ' + addr)
          }
        }
      }
      tx = txBuilder(address, cells, outputs)
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

  const txHash = await ckbSend(signedTx)
  console.log('[sendTx] TX Hash: ', txHash)

  // pre-load some new cells
  reloadCells(fromAddress)

  return txHash
}

export const deposit = async (fromAddress, amount) => {
  const fee = await calcFee(fromAddress, amount, { type: 'deposit' })
  const depositTx = depositTxBuilder(fromAddress, amount, cells, fee)
  console.log('[deposit] deposit tx', depositTx)

  const signedTx = await sign(depositTx, fromAddress)
  console.log('[deposit] signed tx', signedTx)

  const txHash = await ckbSend(signedTx)

  // pre-load some new cells
  reloadCells(fromAddress)

  return txHash
}

export const settle = async (daoItem, fromAddress) => {
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
      depositHeader: daoItem.depositBlockHeader,
      depositOutPoint,
      outputCell
    }
  }
  const fee = await calcFee(fromAddress, 62, extra)
  const settleTx = settleTxBuilder(fromAddress, extra.data, fee)

  outputCell = { ...outputCell, outPoint: depositOutPoint }
  cells.push(outputCell)

  const signedTx = await sign(settleTx, fromAddress)
  const txHash = await ckbSend(signedTx)

  // pre-load some new cells
  reloadCells(fromAddress)
  return txHash
}

export const claim = async (daoItem, fromAddress) => {
  const {
    depositBlockHeader: depositHeader,
    withdrawBlockHeader: settleHeader,
    hash,
    idx,
    size: capacity,
    countedCapacity
  } = daoItem

  const settleOutPoint = { txHash: hash, index: numberToHexString(idx) }
  const claimerLockScript = getLockScriptFromAddress(fromAddress)
  const claimedCapacity = numberToHexString(countedCapacity)

  const txParams = {
    depositHeader,
    settleHeader,
    settleOutPoint,
    claimerLockScript,
    claimedCapacity
  }
  const extra = {
    type: 'claim',
    data: txParams
  }
  const fee = await calcFee(fromAddress, 0, extra)
  const claimTx = claimTxBuilder(extra.data, fee)
  console.log('[clam tx]', claimTx)

  const settleCell = {
    capacity: numberToHexString(capacity),
    lock: getLockScriptFromAddress(fromAddress),
    type: getDaoTypeScript(),
    outPoint: settleOutPoint
  }

  cells = [settleCell]

  const signedTx = await sign(claimTx, fromAddress)
  const txHash = await ckbSend(signedTx)

  return txHash
}

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

export const reloadCells = async (address, needed = PRELOAD_AMOUNT) => {
  needed = fromCKB(needed)
  const lockHash = ckbUtils.scriptToHash(getLockScriptFromAddress(address))
  console.log('[reloadCells] cells begin', cells)

  if (cells.length) {
    const local = cells.map(c => c.capacity).reduce(sumAmount)
    console.log('[reloadCells] local, needed:', local, needed)

    if (cmpAmount(local, needed) === 'lt') {
      needed = JSBI.subtract(BigInt(needed), BigInt(local)).toString()
      console.log('[reloadCells] new needed', needed)
    } else return
  }

  const newCells = await api.getUnspentCells(lockHash, needed, lastId)

  if (newCells.length) {
    lastId = newCells[newCells.length - 1].id

    let tempCells = []
    if (cells.length) {
      for (let i = 0; i < cells.length && i < newCells.length; i++) {
        if (cells[i].id !== newCells[i].id) {
          tempCells.push(cells[i])
        }
      }
    }

    cells = [...tempCells, ...newCells]

    const local = cells.map(c => c.capacity).reduce(sumAmount)
    if (cmpAmount(local, needed) === 'lt') {
      noMoreCells = true
      console.log('[reloadCells] no more capacity than ', local)
    } else {
      noMoreCells = false
    }
  } else {
    noMoreCells = true
    console.log('[reloadCells] no more cells')
  }
  console.log('[reloadCells] cells end', cells)
}

const cellId = ({ txHash, index }) => `${txHash}+${index}`
const cellMatch = input =>
  cells.find(c => cellId(c.outPoint) === cellId(input.previousOutput))

function getInputCapacity(inputs) {
  return inputs.map(i => cellMatch(i).capacity).reduce(sumAmount)
}

function recycleCells(inputs) {
  cells = inputs.filter(i => !cellMatch(i))
}

async function ckbSend(tx) {
  try {
    const txHash = await ckb.rpc.sendTransaction(tx)
    recycleCells(tx.inputs)
    return txHash
  } catch (e) {
    Notify.create({
      message: e.toString(),
      position: 'top',
      timeout: 2000,
      color: 'negative'
    })

    GTM.logEvent({
      category: 'exceptions',
      label: 'RPC',
      action: `Time: ${new Date().toLocaleString()} 
        | ${e.toString()} 
        | TX: ${JSON.stringify(tx)} 
        | UA: ${navigator.userAgent}`
    })
  }
}
