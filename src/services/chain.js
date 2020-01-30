/* eslint-disable no-undef */

import web3utils from 'web3-utils'
import * as ethUtil from 'ethereumjs-util'
import CKBCore from '@nervosnetwork/ckb-sdk-core'
import api from './api'
import { sumAmount } from './utils'
import txSize from './txSize'

export const ckb = new CKBCore('https://aggron.ckb.dev')
const { BigInt } = ckb.utils.JSBI
export const MIN_FEE_RATE = 1000

var keccak_code_hash
var cellDeps

export const init = async () => {
  let config = await api.getConfig()
  keccak_code_hash = config.keccak_code_hash
  cellDeps = config.cellDeps
}

export const getAccount = async context => {
  const getAccountPromise = new Promise((resolve, reject) => {
    window.web3.eth.getAccounts((err, result) => {
      err && reject(err)
      resolve(result)
    })
  })
  return new Promise(async (resolve, reject) => {
    let account = '0x'
    if (typeof window.ethereum !== 'undefined') {
      try {
        ethereum.autoRefreshOnNetworkChange = false
        await window.ethereum.enable()
        const accounts = await getAccountPromise
        account = accounts[0]
        ethereum.on('accountsChanged', function(accounts) {
          context.$store.commit('account/SET_ADDRESS', accounts[0])
        })
        resolve(account)
      } catch (err) {
        reject(err)
      }
    } else if (window.web3) {
      const accounts = await getAccountPromise
      account = accounts[0]
      resolve(account)
    }
  })
}

export const getEthAddress = async context => {
  if (typeof window.ethereum !== 'undefined') {
    ethereum.autoRefreshOnNetworkChange = false
    ethereum.on('accountsChanged', function(accounts) {
      context.$store.commit('account/SET_ADDRESS', accounts[0])
    })
    const accounts = await window.ethereum.enable()
    return accounts[0]
  }
  return null
}

export const loadDeps = async () => {
  ckb.config.secp256k1Dep = await api.LoadK1()
}

export const getFullAddress = (
  address,
  prefix = 'ckt',
  type = '0x02',
  codeHash = keccak_code_hash
) => {
  return ckb.utils.fullPayloadToAddress({
    arg: address,
    prefix,
    type,
    codeHash
  })
}

export const getLockHash = address => {
  if (address === '-') return null
  return ckb.utils.scriptToHash({
    args: address,
    hashType: 'data',
    codeHash: keccak_code_hash
  })
}

/**
 * submit transfer eth to ckb transaction
 * @param {*} ethAddress
 * @param {*} capacity
 */
export const transferETH2CKB = async (ethAddress, txs, fee = '1000') => {
  const rawTransaction = await buildETH2CKBTx(ethAddress, txs, fee)
  const signedTx = await signETHTransaction(ethAddress, rawTransaction)
  await ckb.rpc.sendTransaction(signedTx)
}

/**
 * build raw Tx for send etch locked cell to ckb locked cell
 * @param {*} fromAddress
 * @param {*} ethAddress
 * @param {*} txs
 */
const buildETH2CKBTx = async (ethAddress, txs, fee) => {
  const fromAddress = 'ckt1qyqwknsshmvnj8tj6wnaua53adc0f8jtrrzqz4xcu2'
  if (!keccak_code_hash) return null
  const ethLockScript = {
    hashType: 'data',
    codeHash: keccak_code_hash,
    args: ethAddress
  }
  const ethLockHash = ckb.utils.scriptToHash(ethLockScript)

  const totalCapacity = txs.map(x => x.amount).reduce(sumAmount)

  const unspentEthCells = await api.getUnspentCells(ethLockHash, totalCapacity)

  const receivePairs = txs.map(x => {
    let { address: toAddress, amount: capacity } = x
    if (toAddress.indexOf('ck') !== 0) {
      toAddress = fromAddress
    }
    return { address: toAddress, capacity: BigInt(capacity) }
  })

  const unspentCellsMap = new Map()
  let mapKey = ckb.utils.scriptToHash({
    codeHash: ckb.config.secp256k1Dep.codeHash,
    hashType: ckb.config.secp256k1Dep.hashType,
    args: '0x' + ckb.utils.parseAddress(fromAddress, 'hex').slice(6)
  })
  unspentCellsMap.set(mapKey, unspentEthCells)

  //assemble transaction
  const txParams = {
    fromAddresses: [fromAddress],
    receivePairs,
    // capacity: BigInt(capacity),
    fee: '0x' + BigInt(fee).toString(16),
    safeMode: true,
    cells: unspentCellsMap,
    deps: ckb.config.secp256k1Dep
  }
  console.log('rawTxParams', txParams)
  const rawTransaction = ckb.generateRawTransaction(txParams)

  console.log('rawTX: ', rawTransaction)

  rawTransaction.witnesses = rawTransaction.inputs.map(() => '0x')
  rawTransaction.witnesses[0] = {
    lock: '',
    inputType: '',
    outputType: ''
  }

  for (let i in rawTransaction.outputs) {
    if (i < txs.length) {
      const { address: toAddress } = txs[i]
      if (toAddress.indexOf('ck') === 0) {
        // rawTransaction.outputs[0].lock.args = toAddress
      } else {
        rawTransaction.outputs[i].lock = {
          hashType: 'data',
          codeHash: keccak_code_hash,
          args: toAddress
        }
      }
    } else {
      // change output
      rawTransaction.outputs[i].lock = {
        hashType: 'data',
        codeHash: keccak_code_hash,
        args: ethAddress
      }
    }
  }

  // console.log('rawTransaction outputs', rawTransaction.outputs)

  // set cell deps for transaction
  // dep1: eth lock script
  // dep2: secp256k1_data_bin script in genesisBlock
  rawTransaction.cellDeps = cellDeps
  // console.log(rawTransaction.cellDeps)
  return rawTransaction
}

/**
 * sign one eth lock input
 * @param {*} ckb
 * @param {*} rawTransaction
 */
const signETHTransaction = async (ethAddress, rawTransaction) => {
  // console.log('rawTransaction', rawTransaction)
  const transactionHash = ckb.utils.rawTransactionToHash(rawTransaction)
  const emptyWitness = {
    ...rawTransaction.witnesses[0],
    lock: `0x${'0'.repeat(130)}`
  }

  let { hexToBytes, serializeWitnessArgs, toHexInLittleEndian } = ckb.utils

  const serializedEmptyWitnessBytes = hexToBytes(
    serializeWitnessArgs(emptyWitness)
  )
  const serialziedEmptyWitnessSize = serializedEmptyWitnessBytes.length

  // Calculate keccak256 hash for rawTransaction
  let hashBytes = hexToBytes(transactionHash)

  hashBytes = mergeTypedArraysUnsafe(
    hashBytes,
    hexToBytes(
      toHexInLittleEndian(`0x${serialziedEmptyWitnessSize.toString(16)}`, 8)
    )
  )
  hashBytes = mergeTypedArraysUnsafe(hashBytes, serializedEmptyWitnessBytes)

  rawTransaction.witnesses.slice(1).forEach(w => {
    const bytes = hexToBytes(
      typeof w === 'string' ? w : serializeWitnessArgs(w)
    )
    hashBytes = mergeTypedArraysUnsafe(
      hashBytes,
      hexToBytes(toHexInLittleEndian(`0x${bytes.length.toString(16)}`, 8))
    )
    hashBytes = mergeTypedArraysUnsafe(hashBytes, bytes)
  })
  let message = web3utils.sha3(hashBytes)
  // let message = ethUtil.keccak256(ethUtil.toBuffer(hashBytes));
  // console.log('message is', message)

  // Ehereum Personal Sign for keccak256 hash of rawTransaction
  let signatureHexString = await signWitness(message, ethAddress)
  let signatureObj = ethUtil.fromRpcSig(signatureHexString)
  signatureObj.v -= 27
  signatureHexString = ethUtil.bufferToHex(
    Buffer.concat([
      ethUtil.setLengthLeft(signatureObj.r, 32),
      ethUtil.setLengthLeft(signatureObj.s, 32),
      ethUtil.toBuffer(signatureObj.v)
    ])
  )
  // const keyPair = new ECPair(privateKey)
  // emptyWitness.lock = keyPair.signRecoverable(message)
  // let privateKeyBuffer = new Buffer(privateKey.replace('0x', ''), 'hex')
  // let messageHashBuffer = new Buffer(message.replace('0x', ''), 'hex')
  // let signatureObj = ethUtil.ecsign(messageHashBuffer, privateKeyBuffer)
  // signatureObj.v -= 27
  // let signatureHexString = ethUtil.bufferToHex(
  //   Buffer.concat([
  //     ethUtil.setLengthLeft(signatureObj.r, 32),
  //     ethUtil.setLengthLeft(signatureObj.s, 32),
  //     ethUtil.toBuffer(signatureObj.v)
  //   ])
  // )
  emptyWitness.lock = signatureHexString

  // console.log('emptyWitness is', emptyWitness)
  let signedWitnesses = [
    serializeWitnessArgs(emptyWitness),
    ...rawTransaction.witnesses.slice(1)
  ]

  let tx = {
    ...rawTransaction,
    witnesses: signedWitnesses.map(witness =>
      typeof witness === 'string' ? witness : serializeWitnessArgs(witness)
    )
  }

  // console.log('signedTx', tx)

  return tx
}

/**
 * merge two UInt8Array
 * @param {*} a
 * @param {*} b
 */
function mergeTypedArraysUnsafe(a, b) {
  var c = new a.constructor(a.length + b.length)
  c.set(a)
  c.set(b, a.length)

  return c
}

export const signWitness = async (message, from) => {
  const signFunc = new Promise((resolve, reject) => {
    if (web3.currentProvider.isImToken) {
      web3.eth.sign(from, message, (err, result) => {
        if (err) {
          reject(err)
        }
        resolve(result)
      })
      return
    }
    var params = [message, from]
    var method = 'personal_sign'
    // console.log('params', params)
    web3.currentProvider.sendAsync(
      {
        method,
        params,
        from
      },
      function(err, result) {
        // console.log(result, err)
        if (err) {
          reject(err)
        } else if (result.error) {
          reject(result.error)
        } else {
          resolve(result.result)
        }
      }
    )
  })

  const witness = await signFunc

  return witness
}

export const getFee = async function(feeRate, address, txs) {
  console.log('address', address)
  let rawTx = await buildETH2CKBTx(address, txs)
  console.log('raw tx: ', rawTx)
  if (!rawTx) return 0
  let size = txSize(rawTx)
  console.log('tx size: ', size)
  return ckb.utils.JSBI.multiply(BigInt(size) * BigInt(feeRate))
}
