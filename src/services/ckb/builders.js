import { scriptToHash, toHexInLittleEndian } from '@nervosnetwork/ckb-sdk-utils'
import { ckb, DAO_LOCK_PERIOD_EPOCHS } from './core'
import {
  getLockScriptFromAddress,
  fromCKB,
  JSBI,
  BigInt,
  getDaoTypeScript,
  numberToHexString,
  getPWDaoDeps,
  absoluteEpochSince
} from './utils'

const dummyCKBAddresses = {
  main: 'ckb1qyqy5vmywpty6p72wpvm0xqys8pdtxqf6cmsr8p2l0',
  ckb_testnet: 'ckt1qyqwknsshmvnj8tj6wnaua53adc0f8jtrrzqz4xcu2'
}

export const txBuilder = (fromAddress, cells, outputs, fee = '0x0') => {
  const dummyAddress = dummyCKBAddresses[ckb.pw.chain]
  typeof fee === 'string' && (fee = BigInt(fee))

  const receivePairs = outputs.map(({ address, amount }) => {
    if (!address) return null
    !address.startsWith('ck') && (address = dummyAddress)
    return { address, capacity: numberToHexString(fromCKB(amount)) }
  })

  const cellsMap = new Map()
  const key = scriptToHash(getLockScriptFromAddress(dummyAddress))
  cellsMap.set(key, cells)

  const txParams = {
    fromAddresses: [dummyAddress],
    receivePairs,
    fee: numberToHexString(fee),
    cells: cellsMap,
    deps: ckb.config.secp256k1Dep
  }

  console.log('[txBuilder] tx params', txParams)

  const ckbTx = ckb.generateRawTransaction(txParams)

  ckbTx.witnesses = ckbTx.inputs.map(() => '0x')
  ckbTx.witnesses.unshift({ lock: '', inputType: '', outputType: '' })

  const toAddresses = [...outputs.map(o => o.address), fromAddress] // add the change output
  const pwTx = changeLock(ckbTx, toAddresses)
  pwTx.cellDeps = ckb.pw.txCellDeps

  return pwTx
}

export const depositTxBuilder = (fromAddress, amount, cells, fee = '0x0') => {
  typeof amount === 'string' && (amount = BigInt(fromCKB(amount)))
  typeof fee === 'string' && (fee = BigInt(fee))
  const dummyAddress = dummyCKBAddresses[ckb.pw.chain]

  const txParams = {
    fromAddress: dummyAddress,
    toAddress: dummyAddress,
    capacity: numberToHexString(amount),
    fee: numberToHexString(fee),
    cells,
    deps: ckb.config.secp256k1Dep
  }

  const depositTx = ckb.generateRawTransaction(txParams)
  depositTx.outputs[0].type = getDaoTypeScript()
  depositTx.outputsData[0] = '0x0000000000000000'
  depositTx.witnesses.unshift({ lock: '', inputType: '', outputType: '' })

  const toAddresses = [fromAddress, fromAddress]
  const pwDepositTx = changeLock(depositTx, toAddresses)
  pwDepositTx.cellDeps = getPWDaoDeps()

  return pwDepositTx
}

// settlement tx for withdraw phase 1
export const settleTxBuilder = (
  fromAddress,
  { changeCell, depositHeader, depositOutPoint, outputCell },
  fee = '0x0'
) => {
  const encodedBlockNumber = toHexInLittleEndian(
    numberToHexString(depositHeader.number),
    8
  )
  const dummyAddress = dummyCKBAddresses[ckb.pw.chain]
  const txParams = {
    fromAddress: dummyAddress,
    toAddress: dummyAddress,
    capacity: '0x0',
    fee: numberToHexString(fee),
    deps: ckb.config.secp256k1Dep,
    capacityThreshold: '0x0',
    cells: [changeCell]
  }
  const settleTx = ckb.generateRawTransaction(txParams)

  const toAddresses = [fromAddress, fromAddress]
  const pwSettleTx = changeLock(settleTx, toAddresses)
  pwSettleTx.cellDeps = getPWDaoDeps()

  pwSettleTx.outputs.splice(0, 1)
  pwSettleTx.outputsData.splice(0, 1)

  pwSettleTx.inputs.unshift({ previousOutput: depositOutPoint, since: '0x0' })
  pwSettleTx.outputs.unshift(outputCell)

  pwSettleTx.headerDeps.push(depositHeader.hash)
  pwSettleTx.outputsData.unshift(encodedBlockNumber)
  pwSettleTx.witnesses.unshift({ lock: '', inputType: '', outputType: '' })

  return pwSettleTx
}

// claim tx for withdraw phase 2
export const claimTxBuilder = (
  {
    depositHeader,
    settleHeader,
    settleOutPoint,
    claimerLockScript,
    claimedCapacity
  },
  fee = '0x0'
) => {
  const depositEpoch = depositHeader.epoch
  const settleEpoch = settleHeader.epoch

  const settleFraction = JSBI.multiply(
    BigInt(settleEpoch.index),
    BigInt(depositEpoch.length)
  )
  const depositFraction = JSBI.multiply(
    BigInt(depositEpoch.index),
    BigInt(settleEpoch.length)
  )
  let depositedEpochs = JSBI.subtract(
    BigInt(settleEpoch.number),
    BigInt(depositEpoch.number)
  )
  if (JSBI.GT(settleFraction, depositFraction))
    depositedEpochs = JSBI.add(depositedEpochs, BigInt(1))
  const lockEpochs = JSBI.multiply(
    JSBI.divide(
      JSBI.add(depositedEpochs, BigInt(DAO_LOCK_PERIOD_EPOCHS - 1)),
      BigInt(DAO_LOCK_PERIOD_EPOCHS)
    ),
    BigInt(DAO_LOCK_PERIOD_EPOCHS)
  )
  const minimalSince = absoluteEpochSince({
    length: numberToHexString(depositEpoch.length),
    index: numberToHexString(depositEpoch.index),
    number: numberToHexString(JSBI.add(BigInt(depositEpoch.number), lockEpochs))
  })

  const targetCapacity = BigInt(claimedCapacity)
  const targetFee = BigInt(fee)
  if (JSBI.LT(targetCapacity, targetFee)) {
    throw new Error(
      `The fee(${targetFee}) is too big that withdraw(${targetCapacity}) is not enough`
    )
  }

  const outputs = [
    {
      capacity: numberToHexString(JSBI.subtract(targetCapacity, targetFee)),
      lock: claimerLockScript
    }
  ]
  const outputsData = ['0x']

  const pwClaimTx = {
    version: '0x0',
    cellDeps: getPWDaoDeps(),
    headerDeps: [depositHeader.hash, settleHeader.hash],
    inputs: [
      {
        previousOutput: settleOutPoint,
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

  return pwClaimTx
}

const changeLock = (tx, toAddresses) => {
  // adapt lock scripts for different types of address
  for (let i in toAddresses) {
    tx.outputs[i].lock = getLockScriptFromAddress(toAddresses[i])
  }

  return tx
}
