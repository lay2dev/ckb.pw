import CKBCore from '@nervosnetwork/ckb-sdk-core'
import * as ckbUtils from '@nervosnetwork/ckb-sdk-utils'
import api from '../api'
import { txBuilder } from './builders'
import {
  sumAmount,
  cmpAmount,
  getLockScriptFromAddress,
  mergeTypedArraysUnsafe
} from './utils'
import txSize from './txSize'

export const JSBI = ckbUtils.JSBI
export const { BigInt } = JSBI
export var ckb

var cells = []
var feeRate = 1000 // ckb's minimal fee rate
var platform = {
  provider: null,
  chain: 'eth',
  typedData: false
}

export const pwInit = async nodeUrl => {
  ckb = new CKBCore(nodeUrl)

  const res = await Promise.all([
    await ckb.rpc.getBlockchainInfo(),
    await ckb.loadSecp256k1Dep(),
    await ckb.loadDaoDep(),
    await loadMultiSignScript(),
    await api.getConfig()
  ])

  ckb.pw.chain = res[0].chain
  ckb.config.multiSignDep = res[3]
  ckb.pw.apc = res[4].apc
  ckb.pw.keccak_code_hash = res[4].keccak_code_hash
  ckb.pw.txCellDeps = res[4].cellDeps

  console.log('pw init: ', ckb.pw)
}

/**
 * setters
 **/
export const setFeeRate = _feeRate => (feeRate = _feeRate)
export const setPlatform = _platform => (platform = _platform)

/**
 * getters
 **/
export const calcFee = async (address, outputs) => {
  const needed = outputs.map(o => o.amount).reduce(sumAmount)
  await reloadCells(address, needed)
  const tx = txBuilder(address, cells, outputs)
  return ckbUtils.calculateTransactionFee(txSize(tx), feeRate)
}

/**
 * actions
 **/
export const sendTx = async (fromAddress, outputs) => {
  const fee = await calcFee(fromAddress, outputs)
  const tx = txBuilder(fromAddress, cells, outputs, fee)
  const signedTx = await sign(tx, fromAddress)

  const txHash = await ckb.rpc.sendTransaction(signedTx, 'passthrough')
  // clear local cells when sent
  cells = []
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
      emptyWitness.lock = await (await import('../eth/eth')).ethSign(
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
    console.log(e.toString())
  }

  return tx
}

async function reloadCells(address, needed) {
  let lastId = null
  const lockHash = ckbUtils.scriptToHash(getLockScriptFromAddress(address))
  if (cells.length) {
    const local = cells.map(c => c.capacity).reduce(sumAmount)
    if (cmpAmount(local, needed) === 'lt') {
      lastId = cells[cells.length - 1].id
      needed = JSBI.subtract(needed, local)
    } else return
  }

  cells = await api.getUnspentCells(lockHash, needed, lastId)
}

async function loadMultiSignScript() {
  const genesisBlock = await ckb.rpc.getBlockByNumber('0')
  const outPoint = {
    txHash: genesisBlock.transactions[1].hash,
    index: '0x01'
  }
  const codeHash = ckbUtils.scriptToHash(
    genesisBlock.transactions[0].outputs[4].type
  )
  const hashType = 'type'
  return {
    codeHash,
    hashType,
    outPoint
  }
}

function getInputCapacity(inputs) {
  const cellId = ({ txhash, index }) => `${txhash}+${index}`
  const cellMatch = input =>
    cells.find(c => cellId(c.outPoint) === cellId(input.previousOutput))
  return inputs.map(i => cellMatch(i).capacity).reduce(sumAmount)
}
