import { scriptToHash } from '@nervosnetwork/ckb-sdk-utils'
import { ckb, BigInt } from './ckb'
import { getLockScriptFromAddress } from './utils'

const dummyCKBAddresses = {
  main: 'ckb1qyqy5vmywpty6p72wpvm0xqys8pdtxqf6cmsr8p2l0',
  ckb_testnet: 'ckt1qyqwknsshmvnj8tj6wnaua53adc0f8jtrrzqz4xcu2'
}

export const txBuilder = (fromAddress, cells, outputs, fee = '0x0') => {
  const dummyAddress = dummyCKBAddresses[ckb.chain]

  const receivePairs = outputs.map(({ address, amount }) => {
    address.startsWith('ck') && (address = dummyAddress)
    return { address, capacity: BigInt(amount) }
  })

  const cellsMap = new Map()
  const key = scriptToHash(getLockScriptFromAddress(dummyAddress))
  cellsMap.set(key, cells)

  const txParams = {
    fromAddresses: [dummyAddress],
    receivePairs,
    fee,
    cells: cellsMap,
    deps: ckb.config.secp256k1Dep
  }

  const ckbTx = ckb.generateRawTransaction(txParams)

  ckbTx.witnesses = ckbTx.inputs.map(() => '0x')
  ckbTx.witnesses[0] = {
    lock: '',
    inputType: '',
    outputType: ''
  }

  const toAddresses = [...outputs.map(o => o.address), fromAddress]
  const pwTx = convertToPWTx(ckbTx, toAddresses)

  return pwTx
}

const convertToPWTx = (ckbTx, toAddresses) => {
  // adapt lock scripts for different types of address
  for (let i in toAddresses) {
    ckbTx.outputs[i].lock = getLockScriptFromAddress(toAddresses[i])
  }

  // adapt cell deps for specific locks
  ckbTx.cellDeps = ckb.txCellDeps

  return ckbTx
}

// const convertToPWDao = ckbDao => {}
