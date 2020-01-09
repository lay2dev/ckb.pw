/* eslint-disable no-undef */

import web3utils from 'web3-utils'
import * as ethUtil from 'ethereumjs-util'
import CKBCore from '@nervosnetwork/ckb-sdk-core'
import api from './api'

// const startBlock = '0x2bf20' // query unspent cell start point

export const ckb = new CKBCore('https://aggron.ckb.dev')
const { BigInt } = ckb.utils.JSBI
export const FEE = 100000000

var keccak_code_hash
// var keccak_tx_hash
var cellDeps

export const init = async () => {
  let config = await api.getConfig()
  keccak_code_hash = config.keccak_code_hash
  // keccak_tx_hash = config.keccak_tx_hash
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

/*
export const getBalance = async address => {
  if (address === '-') return
  const lockHash = ckb.utils.scriptToHash({
    args: address,
    hashType: 'data',
    codeHash: keccak_code_hash
  })

  let states = await ckb.rpc.getLockHashIndexStates()
  let state = states.find(s => s.lockHash === lockHash)
  if (!state) {
    state = await ckb.rpc.indexLockHash(lockHash, startBlock)
  }
  let tipHeight = await ckb.rpc.getTipBlockNumber()
  while (parseInt(state.blockNumber, 16) < parseInt(tipHeight, 16)) {
    await sleep(2000)
    states = await ckb.rpc.getLockHashIndexStates()
    state = states.find(s => s.lockHash === lockHash)
    tipHeight = await ckb.rpc.getTipBlockNumber()
  }

  let {
    blockNumber,
    capacity,
    cellsCount
  } = await ckb.rpc.getCapacityByLockHash(lockHash)

  blockNumber = web3utils.hexToNumberString(blockNumber)
  capacity = web3utils.hexToNumberString(capacity)
  cellsCount = web3utils.hexToNumberString(cellsCount)

  return { blockNumber, capacity, cellsCount }
}
*/

/**
 * submit transfer eth to ckb transaction
 * @param {*} toAddress
 * @param {*} capacity
 * @param {*} privateKey
 */
export const transferETH2CKB = async (ethAddress, toAddress, capacity) => {
  const fromCKBAddress = 'ckt1qyqwknsshmvnj8tj6wnaua53adc0f8jtrrzqz4xcu2'
  const rawTransaction = await buildETH2CKBTx(
    ckb,
    fromCKBAddress,
    toAddress,
    ethAddress,
    capacity
  )
  const signedTx = await signETHTransaction(ethAddress, rawTransaction)
  // console.log(JSON.stringify(signedTx, null, 2))
  await ckb.rpc.sendTransaction(signedTx)
  // const realTxHash = await ckb.rpc.sendTransaction(signedTx)
  // console.log(`The real transaction hash is: ${realTxHash}`)
}

/**
 * build raw Tx for send etch locked cell to ckb locked cell
 * @param {*} ckb
 * @param {*} fromAddress
 * @param {*} publicKeyHash
 * @param {*} toAddress
 * @param {*} ethAddress
 * @param {*} capacity
 */
const buildETH2CKBTx = async (
  ckb,
  fromAddress,
  toAddress,
  ethAddress,
  capacity
) => {
  // fetch unspent cell by eth lock hash
  const ethLockScript = {
    hashType: 'data',
    codeHash: keccak_code_hash,
    args: ethAddress
  }
  const ethLockHash = ckb.utils.scriptToHash(ethLockScript)
  // const unspentEthCells = await ckb.loadCells({
  //   start: startBlock,
  //   lockHash: ethLockHash
  // })

  console.log('lock hash', ethLockHash)
  console.log('capacity', capacity)
  const unspentEthCells = await api.getUnspentCells(ethLockHash, capacity)
  console.log('unSpentCells', unspentEthCells)

  // console.log('unspentEthCells.length = ', unspentEthCells.length)

  //assemble transaction
  const txParams = {
    fromAddress,
    toAddress: toAddress.indexOf('ck') === 0 ? toAddress : fromAddress,
    capacity: BigInt(capacity),
    fee: '0x' + BigInt(FEE).toString(16),
    safeMode: true,
    cells: unspentEthCells,
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

  if (toAddress.indexOf('ck') === 0) {
    // rawTransaction.outputs[0].lock.args = toAddress
  } else {
    rawTransaction.outputs[0].lock = {
      hashType: 'data',
      codeHash: keccak_code_hash,
      args: toAddress
    }
  }

  //modify lock of change outputs to eth lock
  rawTransaction.outputs.forEach((_, i) => {
    if (i > 0) {
      rawTransaction.outputs[i].lock = {
        hashType: 'data',
        codeHash: keccak_code_hash,
        args: ethAddress
      }
    }
  })
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
