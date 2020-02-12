/* eslint-disable no-undef */

import web3utils from 'web3-utils'
import * as ethUtil from 'ethereumjs-util'
import CKBCore from '@nervosnetwork/ckb-sdk-core'
import * as ckbUtils from '@nervosnetwork/ckb-sdk-utils'
import api from './api'
import txSize from './txSize'
import ABCWallet from 'abcwallet'
import { formatCKBAddress, fromCKB } from './utils'

export const ckb = new CKBCore('https://aggron.ckb.dev')
export const JSBI = ckb.utils.JSBI
export const MIN_FEE_RATE = 1000

var provider = ''
var keccak_code_hash
var cellDeps

export const init = async ctx => {
  let config = await api.getConfig()
  // keccak_code_hash = config.keccak_code_hash
  cellDeps = config.cellDeps
  keccak_code_hash =
    '0xac8a4bc0656aeee68d4414681f4b2611341c4f0edd4c022f2d250ef8bb58682f'
  cellDeps[1].outPoint.txHash =
    '0xff1bb8baaa5fca57b82901f993b35d1c5f697c855133fad90ffe482c3e342612'

  // detecting locale
  ctx.$i18n.locale = ctx.$q.lang.getLocale()

  console.log('UA: ', navigator.userAgent)

  await getAccount(ctx)

  imTokenInit(ctx)
  abcInit(ctx)
}

function imTokenInit(ctx) {
  if (!window.ethereum.isImToken) return
  provider = 'imToken'
  console.log('IN: imToken')

  try {
    imToken.callAPI('navigator.configure', {
      // navigationStyle: 'transparent'
      navigatorColor: 'black'
    })
    ctx.$store.commit('config/UPDATE', {
      provider,
      showBar: false,
      showHeader: false,
      barHeight: 23
    })
  } catch (e) {
    console.log(e)
  }
}

function abcInit(ctx) {
  if (navigator.userAgent.indexOf('ABCWallet') < 0) return
  provider = 'ABCWallet'
  console.log('IN: ABCWallet')
  ABCWallet.webview.setTitlebar({
    title: 'CKB P-Wallet',
    forecolor: '#ffffff',
    bgcolor: '#000000'
  })

  ctx.$store.commit('config/UPDATE', {
    provider,
    showBar: false,
    showHeader: false,
    showFooter: false
  })
}

export const getAccount = async ctx => {
  console.log('get account')
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
        console.log('try 1')
        const accounts = await window.ethereum.enable()
        // const accounts = await getAccountPromise
        account = accounts[0]
        console.log('account', account)
        ctx.$store.commit('account/SET_ADDRESS', account)
        ctx.$store.commit('account/SET_PLATFORM', 'eth')

        // watch address change
        ethereum.on('accountsChanged', function(accounts) {
          ctx.$store.commit('account/SET_ADDRESS', accounts[0])
        })

        resolve(account)
      } catch (err) {
        reject(err)
      }
    } else if (window.web3) {
      console.log('try 2')
      const accounts = await getAccountPromise
      account = accounts[0]
      console.log('account', account)
      ctx.$store.commit('account/SET_ADDRESS', account)
      ctx.$store.commit('account/SET_PLATFORM', 'eth')
      resolve(account)
    }
  })
}

export const loadDeps = async () => {
  ckb.config.secp256k1Dep = await api.loadK1()
  ckb.config.daoDep = await api.loadDaoCell()
}

export const getFullAddress = (
  address,
  prefix = 'ckt',
  type = '0x04',
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
    hashType: 'type',
    codeHash: keccak_code_hash
  })
}

export const sendTx = async (cells, outputs, fee, address) => {
  const rawTx = buildTx(cells, outputs, fee, address)
  const tx = await signTx(cells, rawTx, address)
  await ckb.rpc.sendTransaction(tx)
}

export const getLockScriptFromAddress = address => {
  console.log('address is', address)
  const payload = ckbUtils.parseAddress(address, 'hex').replace('0x', '')

  const type = payload.substring(0, 2)

  let codeHash, hashType, args

  if (type == '01') {
    if (payload.substring(2, 2) == '00') {
      codeHash =
        '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8'
    } else {
      //TODO multisig code here
      codeHash =
        '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8'
    }
    hashType = 'type'
    args = '0x' + payload.substring(4)
  } else if (type == '02') {
    hashType = 'data'
    codeHash = '0x' + payload.substring(2, 66)
    args = '0x' + payload.substring(66)
  } else if (type == '04') {
    hashType = 'type'
    codeHash = '0x' + payload.substring(2, 66)
    args = '0x' + payload.substring(66)
  }

  return { codeHash, hashType, args }
}
const getLockScriptFromEthAddress = address => {
  return {
    codeHash: keccak_code_hash,
    args: address,
    hashType: 'type'
  }
}
const getDaoTypeScript = () => {
  return {
    codeHash: ckb.config.daoDep.typeHash,
    args: '0x',
    hashType: ckb.config.daoDep.hashType
  }
}

/**
 * build raw Tx for send etch locked cell to ckb locked cell
 * @param {*} cells
 * @param {*} outputs
 * @param {*} fee
 * @param {*} address
 */
export const buildTx = (cells, outputs, fee, address) => {
  const fromAddress = 'ckt1qyqwknsshmvnj8tj6wnaua53adc0f8jtrrzqz4xcu2'

  console.log('outputs', outputs)
  if (!keccak_code_hash) return null

  const receivePairs = outputs.map(o => {
    let { address: toAddress, amount: capacity } = o
    if (toAddress.indexOf('ck') !== 0) {
      toAddress = fromAddress
    }
    return { address: toAddress, capacity: JSBI.BigInt(capacity) }
  })

  const cellsMap = new Map()
  let mapKey = ckb.utils.scriptToHash({
    codeHash: ckb.config.secp256k1Dep.codeHash,
    hashType: ckb.config.secp256k1Dep.hashType,
    args: '0x' + ckb.utils.parseAddress(fromAddress, 'hex').slice(6)
  })
  cellsMap.set(mapKey, cells)

  //assemble transaction
  const txParams = {
    fromAddresses: [fromAddress],
    receivePairs,
    fee: '0x' + JSBI.BigInt(fee).toString(16),
    cells: cellsMap,
    deps: ckb.config.secp256k1Dep
  }
  console.log('rawTxParams', txParams)

  const rawTx = ckb.generateRawTransaction(txParams)
  console.log('rawTX: ', rawTx)

  rawTx.witnesses = rawTx.inputs.map(() => '0x')
  rawTx.witnesses[0] = {
    lock: '',
    inputType: '',
    outputType: ''
  }

  rawTx.outputs = replaceOutputsLock(rawTx, outputs, address)

  // console.log('rawTx outputs', rawTx.outputs)

  // set cell deps for transaction
  // dep1: eth lock script
  // dep2: secp256k1_data_bin script in genesisBlock
  rawTx.cellDeps = cellDeps
  // console.log(rawTx.cellDeps)
  return rawTx
}

/**
 * sign one eth lock input
 * @param {*} ckb
 * @param {*} rawTx
 */
export const signTx = async (unspentCells, rawTx, address) => {
  const { hexToBytes, serializeWitnessArgs, toHexInLittleEndian } = ckb.utils

  const txHash = ckb.utils.rawTransactionToHash(rawTx)

  const emptyWitness = {
    ...rawTx.witnesses[0],
    lock: `0x${'0'.repeat(130)}`
  }

  const serializedEmptyWitnessBytes = hexToBytes(
    serializeWitnessArgs(emptyWitness)
  )
  const serialziedEmptyWitnessSize = serializedEmptyWitnessBytes.length

  // Calculate keccak256 hash for rawTransaction
  let hashBytes = hexToBytes(txHash)

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
  let message = web3utils.sha3(hashBytes)
  // let message = ethUtil.keccak256(ethUtil.toBuffer(hashBytes));
  // console.log('message is', message)

  // Ehereum Personal Sign for keccak256 hash of rawTransaction
  let signatureHexString = await signWitness(
    unspentCells,
    rawTx,
    message,
    address
  )
  console.log('signatureHexString', signatureHexString)
  let signatureObj = ethUtil.fromRpcSig(signatureHexString)
  signatureObj.v -= 27
  signatureHexString = ethUtil.bufferToHex(
    Buffer.concat([
      ethUtil.setLengthLeft(signatureObj.r, 32),
      ethUtil.setLengthLeft(signatureObj.s, 32),
      ethUtil.toBuffer(signatureObj.v)
    ])
  )

  emptyWitness.lock = signatureHexString

  let signedWitnesses = [
    serializeWitnessArgs(emptyWitness),
    ...rawTx.witnesses.slice(1)
  ]

  let tx = {
    ...rawTx,
    witnesses: signedWitnesses.map(witness =>
      typeof witness === 'string' ? witness : serializeWitnessArgs(witness)
    )
  }

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

export const signWitness = async (unspentCells, tx, message, from) => {
  const signFunc = new Promise((resolve, reject) => {
    if (web3.currentProvider.isMetaMask && provider !== 'ABCWallet') {
      const typedData = buildTypedData(unspentCells, tx, message)
      const params = [from, typedData]
      const method = 'eth_signTypedData_v4'

      console.log('typedData', params)

      web3.currentProvider.sendAsync(
        {
          method,
          params,
          from
        },
        function(err, result) {
          if (err) {
            reject(err)
          }
          // console.log(result);
          resolve(result.result)
        }
      )
      return
    }

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

const buildTypedData = (unspentCells, rawTransaction, messageHash) => {
  const typedData = {
    domain: {
      chainId: 1,
      name: 'ckb.pw',
      verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      version: '1'
    },

    message: {
      hash:
        '0x545529d4464064d8394c557afb06f489e7044a63984c6113385431d93dcffa1b',
      fee: '0.00100000CKB',
      'input-sum': '100.00000000CKB',
      to: [
        {
          address: 'ckb1qyqv4yga3pgw2h92hcnur7lepdfzmvg8wj7qwstnwm',
          amount: '100.00000000CKB'
        },
        {
          address:
            'ckb1qftyhqxwuxdzp5zk4rctscnrr6stjrmfjdx54v05q8t3ad3493m6mhcekrn0vk575h44ql9ry53z3gzhtc2exudxcyg',
          amount: '799.99800000CKB'
        }
      ]
    },
    primaryType: 'CKBTransaction',
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' }
      ],
      CKBTransaction: [
        { name: 'hash', type: 'bytes32' },
        { name: 'fee', type: 'string' },
        { name: 'input-sum', type: 'string' },
        { name: 'to', type: 'Output[]' }
      ],
      Output: [
        { name: 'address', type: 'string' },
        { name: 'amount', type: 'string' }
      ]
    }
  }

  const message =
    '0x' +
    ethUtil.hashPersonalMessage(ethUtil.toBuffer(messageHash)).toString('hex')
  console.log('hash', messageHash)
  console.log('personal Hash', message)

  typedData.message.hash = message
  typedData.message.to = []

  let input_capacities = 0
  let output_capacities = 0

  rawTransaction.inputs.forEach(input => {
    const {
      previousOutput: { txHash, index }
    } = input
    let cell = unspentCells.filter(
      t => t.outPoint.txHash == txHash && t.outPoint.index == index
    )[0]
    const { capacity } = cell
    input_capacities += Number(capacity)
  })

  rawTransaction.outputs.forEach(output => {
    let { hashType, codeHash, args } = output.lock
    const capacity = web3utils.hexToNumber(output.capacity)
    output_capacities += capacity
    let amount = (capacity / 100000000.0).toFixed(8) + 'CKB'

    let address = 'unknown'
    if (output.lock.keccak_code_hash === '0x00000000000000000000000000000000') {
      address = 'unknown'
    } else {
      if (
        codeHash ===
        '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8'
      ) {
        address = formatCKBAddress(
          ckbUtils.bech32Address(args, {
            prefix: 'ckt',
            type: '0x01',
            codeHashOrCodeHashIndex: '0x00'
          })
        )
      } else {
        let type = '0x02'
        if (hashType == 'data') {
          type = '0x02'
        } else {
          type = '0x04'
        }
        address = formatCKBAddress(
          ckbUtils.fullPayloadToAddress({
            arg: args,
            prefix: 'ckt',
            type,
            codeHash
          })
        )
      }
    }
    typedData.message.to.push({ address, amount })
  })

  console.log(
    'input_capacities/output_capacities',
    input_capacities,
    output_capacities
  )

  typedData.message['input-sum'] =
    (input_capacities / 100000000.0).toFixed(8) + 'CKB'
  typedData.message.fee =
    ((input_capacities - output_capacities) / 100000000.0).toFixed(8) + 'CKB'

  // console.log('typed data', JSON.stringify(typedData));
  // const result = '0x' + sigUtil.TypedDataUtils.sign(typedData).toString('hex');
  return JSON.stringify(typedData)
}

export const getFee = function(feeRate, cells, outputs, address) {
  const rawTx = buildTx(cells, outputs, '0', address)
  if (!rawTx) return '0'

  const size = txSize(rawTx)
  const fee = JSBI.divide(
    JSBI.multiply(JSBI.BigInt(size), JSBI.BigInt(feeRate)),
    JSBI.BigInt(1000)
  )

  return fee.toString()
}

const replaceOutputsLock = (tx, toAddressList, ethAddress) => {
  const txOutputs = tx.outputs

  for (let i in txOutputs) {
    if (i < toAddressList.length) {
      const { address: toAddress } = toAddressList[i]

      if (toAddress.indexOf('ck') === 0) {
        txOutputs[i].lock = getLockScriptFromAddress(toAddress)
      } else {
        txOutputs[i].lock = {
          hashType: 'type',
          codeHash: keccak_code_hash,
          args: toAddress
        }
      }
    } else {
      // change output
      txOutputs[i].lock = {
        hashType: 'type',
        codeHash: keccak_code_hash,
        args: ethAddress
      }
    }
  }

  console.log(txOutputs)
  return txOutputs
}

export const DAO = {
  /**
   * Deposit
   */
  buildDepositTx: (unspentCell, fromAddress, capacity, fee) => {
    const tempAddress = 'ckt1qyqwknsshmvnj8tj6wnaua53adc0f8jtrrzqz4xcu2'
    const depositTx = ckb.generateRawTransaction({
      fromAddress: tempAddress,
      toAddress: tempAddress,
      capacity: BigInt(capacity),
      fee: BigInt(fee),
      safeMode: true,
      cells: unspentCell,
      deps: ckb.config.secp256k1Dep
    })

    depositTx.outputs[0].type = getDaoTypeScript()
    depositTx.outputsData[0] = '0x0000000000000000'

    depositTx.cellDeps = [
      ...cellDeps,
      {
        depType: 'code',
        outPoint: ckb.config.daoDep.outPoint
      }
    ]

    depositTx.witnesses.unshift({ lock: '', inputType: '', outputType: '' })
    depositTx.outputs = replaceOutputsLock(
      depositTx,
      [{ address: fromAddress }],
      fromAddress
    )

    return depositTx
  },

  getFee: (feeRate, rawTx) => {
    const size = txSize(rawTx)
    const fee = JSBI.divide(
      JSBI.multiply(JSBI.BigInt(size), JSBI.BigInt(feeRate)),
      JSBI.BigInt(1000)
    )

    return fee.toString()
  },

  async deposit(address, amount, cells, feeRate) {
    let rawTx = this.buildDepositTx(cells, address, fromCKB(amount), 0)
    const fee = this.getFee(feeRate, rawTx)
    rawTx = this.buildDepositTx(cells, address, fromCKB(amount), fee)
    console.log('raw tx', rawTx)
    const tx = await signTx(cells, rawTx, address)
    const txHash = await ckb.rpc.sendTransaction(tx)
    console.log('DAO Deposit TX: ', txHash)
    return txHash
  },

  async withdraw1(daoItem, address, feeRate) {
    const unspentCells = await api.getUnspentCells(
      getLockHash(address),
      fromCKB(62)
    )

    const changeCell = unspentCells[0]
    console.log('change cell', changeCell)
    const { depositBlockHeader, hash, idx, size } = daoItem
    const outPoint = {
      txHash: hash,
      index: '0x' + Number(idx).toString(16)
    }
    const outputCell = {
      capacity: '0x' + JSBI.BigInt(size).toString(16),
      lock: getLockScriptFromEthAddress(address),
      type: getDaoTypeScript(),
      outPoint: outPoint
    }

    let rawTx = this.buildWithdraw1Tx(
      changeCell,
      outPoint,
      outputCell,
      '0x10000',
      depositBlockHeader,
      address
    )
    const fee = this.getFee(feeRate, rawTx)
    console.log('Fee', fee)
    rawTx = this.buildWithdraw1Tx(
      changeCell,
      outPoint,
      outputCell,
      fee,
      depositBlockHeader,
      address
    )
    console.log('raw tx', rawTx)
    const tx = await signTx([changeCell, outputCell], rawTx, address)
    const txHash = await ckb.rpc.sendTransaction(tx)
    console.log('DAO Withdraw 1 TX: ', txHash)
    return txHash
  },

  /**
   * Withdraw PHASE ONE
   */
  buildWithdraw1Tx: (
    changeCell,
    outPoint,
    outputCell,
    fee,
    depositBlockHeader,
    fromAddress
  ) => {
    const encodedBlockNumber = ckb.utils.toHexInLittleEndian(
      '0x' + Number(depositBlockHeader.number).toString(16),
      8
    )
    const tempAddress = 'ckt1qyqwknsshmvnj8tj6wnaua53adc0f8jtrrzqz4xcu2'
    const rawTx = ckb.generateRawTransaction({
      fromAddress: tempAddress,
      toAddress: tempAddress,
      capacity: '0x0',
      fee: BigInt(fee),
      safeMode: true,
      deps: ckb.config.secp256k1Dep,
      capacityThreshold: '0x0',
      cells: changeCell
    })

    rawTx.outputs = replaceOutputsLock(
      rawTx,
      [{ address: fromAddress }],
      fromAddress
    )

    rawTx.outputs.splice(0, 1)
    rawTx.outputsData.splice(0, 1)

    rawTx.inputs.unshift({ previousOutput: outPoint, since: '0x0' })
    rawTx.outputs.unshift(outputCell)
    rawTx.cellDeps.push({
      outPoint: ckb.config.daoDep.outPoint,
      depType: 'code'
    })
    rawTx.headerDeps.push(depositBlockHeader.hash)
    rawTx.outputsData.unshift(encodedBlockNumber)
    rawTx.witnesses.unshift({
      lock: '',
      inputType: '',
      outputType: ''
    })

    return rawTx
  },

  /**
   * Withdraw PHASE TWO
   */
  buildWithdraw2Tx: (
    depositBlockHeader,
    withdrawBlockHeader,
    withdrawOutPoint,
    fee,
    toLock,
    outputCapacity
  ) => {
    const DAO_LOCK_PERIOD_EPOCHS = 180

    const depositEpoch = depositBlockHeader.epoch
    const withdrawEpoch = withdrawBlockHeader.epoch

    const withdrawFraction = JSBI.multiply(
      JSBI.BigInt(withdrawEpoch.index),
      JSBI.BigInt(depositEpoch.length)
    )
    const depositFraction = JSBI.multiply(
      JSBI.BigInt(depositEpoch.index),
      JSBI.BigInt(withdrawEpoch.length)
    )
    let depositedEpochs = JSBI.subtract(
      JSBI.BigInt(withdrawEpoch.number),
      JSBI.BigInt(depositEpoch.number)
    )
    if (JSBI.greaterThan(withdrawFraction, depositFraction)) {
      depositedEpochs = JSBI.add(depositedEpochs, JSBI.BigInt(1))
    }
    const lockEpochs = JSBI.multiply(
      JSBI.divide(
        JSBI.add(depositedEpochs, JSBI.BigInt(DAO_LOCK_PERIOD_EPOCHS - 1)),
        JSBI.BigInt(DAO_LOCK_PERIOD_EPOCHS)
      ),
      JSBI.BigInt(DAO_LOCK_PERIOD_EPOCHS)
    )
    const minimalSince = absoluteEpochSince({
      length: `0x${JSBI.BigInt(depositEpoch.length).toString(16)}`,
      index: `0x${JSBI.BigInt(depositEpoch.index).toString(16)}`,
      number: `0x${JSBI.add(
        JSBI.BigInt(depositEpoch.number),
        lockEpochs
      ).toString(16)}`
    })

    const targetCapacity = JSBI.BigInt(outputCapacity)
    const targetFee = JSBI.BigInt(`${fee}`)
    if (JSBI.lessThan(targetCapacity, targetFee)) {
      throw new Error(
        `The fee(${targetFee}) is too big that withdraw(${targetCapacity}) is not enough`
      )
    }

    const outputs = [
      {
        capacity: `0x${JSBI.subtract(targetCapacity, targetFee).toString(16)}`,
        lock: toLock
      }
    ]

    const outputsData = ['0x']

    const tx = {
      version: '0x0',
      cellDeps: [
        { outPoint: ckb.config.secp256k1Dep.outPoint, depType: 'depGroup' },
        { outPoint: ckb.config.daoDep.outPoint, depType: 'code' }
      ],
      headerDeps: [depositBlockHeader.hash, withdrawBlockHeader.hash],
      inputs: [
        {
          previousOutput: withdrawOutPoint,
          since: minimalSince
        }
      ],
      outputs,
      outputsData,
      witnesses: [
        {
          lock: '',
          inputType: '0x0000000000000000',
          outputType: ''
        }
      ]
    }

    return tx
  }
}

const absoluteEpochSince = ({ length, index, number }) => {
  const { JSBI } = ckb.utils
  const epochSince = JSBI.add(
    JSBI.add(
      JSBI.add(
        JSBI.leftShift(JSBI.BigInt(0x20), JSBI.BigInt(56)),
        JSBI.leftShift(JSBI.BigInt(length), JSBI.BigInt(40))
      ),
      JSBI.leftShift(JSBI.BigInt(index), JSBI.BigInt(24))
    ),
    JSBI.BigInt(number)
  )

  return `0x${epochSince.toString(16)}`
}
