import * as ethUtil from 'ethereumjs-util'
import USDT_ABI from './usdt.json'
import { toWei, sha3, numberToHex } from 'web3-utils'
import { ckb } from '../ckb/core'
import { JSBI, BigInt, toCKB, truncatedAddress } from '../ckb/utils'

export const DecimalMap = {
  6: 'mwei',
  18: 'ether'
}
/*
const minABI = [
  // transfer
  {
    constant: false,
    inputs: [
      {
        name: '_to',
        type: 'address'
      },
      {
        name: '_value',
        type: 'uint256'
      }
    ],
    name: 'transfer',
    outputs: [
      {
        name: 'success',
        type: 'bool'
      }
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  }
]
*/

export const initETHProvider = async onAddressChanged => {
  if (typeof window.ethereum !== 'undefined') {
    console.log('Ethereum Detected')
    try {
      window.ethereum.autoRefreshOnNetworkChange = false

      // retrive address
      const accounts = await window.ethereum.enable()

      // watch address change
      window.ethereum.on &&
        window.ethereum.on('accountsChanged', function(accounts) {
          onAddressChanged && onAddressChanged(accounts[0])
        })

      console.log('ETH Address: ', accounts[0])
      return accounts[0]
    } catch (err) {
      return null
    }
  } else {
    console.log('Ethereum Env Not Found')
    return null
  }
}

const sendAsync = async (params, method, from) =>
  new Promise((resolve, reject) => {
    window.web3.currentProvider.sendAsync({ method, params, from }, function(
      err,
      result
    ) {
      err && reject(err)
      result.error && reject(result.error)
      resolve(result.result)
    })
  })

export const sendAssets = async (
  fromAddress,
  toAddress,
  amount,
  tokenAddress,
  decimal = 18,
  chain = 'mainnet'
) => {
  let params = [{ from: fromAddress, to: toAddress, chain }]
  let method = 'eth_sendTransaction'
  if (tokenAddress?.length) {
    let contract = await window.web3.eth.contract(USDT_ABI).at(tokenAddress)
    amount = numberToHex(toWei(amount.toFixed(6), DecimalMap[decimal]))
    params[0].to = tokenAddress
    params[0].data = contract.transfer.getData(toAddress, amount, {
      from: fromAddress
    })
  } else {
    params[0].value = numberToHex(toWei(amount + ''))
  }

  console.log('[sendAssets]', params[0])
  return sendAsync(params, method, fromAddress)
}

export const getBalance = async (fromAddress, tokenAddress) => {
  let params = [],
    method = '',
    from = fromAddress
  if (tokenAddress?.length) {
    const funcSelector = window.web3.sha3('balanceOf(address)').slice(0, 10)
    const data = funcSelector + '000000000000000000000000' + from.slice(2)
    params = [{ to: tokenAddress, data }, 'latest']
    method = 'eth_call'
  } else {
    params = [from, 'latest']
    method = 'eth_getBalance'
  }

  return sendAsync(params, method, fromAddress)
}

export const ethSign = async (
  fromAddress,
  hashBytes,
  provider,
  typedDataParams = null
) => {
  const signer = getSignerByProvider(provider)
  const message = sha3(hashBytes)
  const signature = await signer(fromAddress, message, typedDataParams)
  console.log('signature', signature)
  let signatureObj = ethUtil.fromRpcSig(signature)
  signatureObj.v -= 27
  return ethUtil.bufferToHex(
    // eslint-disable-next-line no-undef
    Buffer.concat([
      ethUtil.setLengthLeft(signatureObj.r, 32),
      ethUtil.setLengthLeft(signatureObj.s, 32),
      ethUtil.toBuffer(signatureObj.v)
    ])
  )
}

const getSignerByProvider = provider => {
  if (provider === 'MetaMask') return MetaMaskSigner
  if (provider === 'ImToken') return ImTokenSigner
  return DefaultSinger
}

const ImTokenSigner = (from, message) =>
  new Promise((resolve, reject) => {
    window.web3.eth.sign(from, message, (err, result) => {
      err && reject(err)
      resolve(result)
    })
  })

const MetaMaskSigner = async (from, message, typedDataParams) => {
  return await TypedDataSigner(from, message, typedDataParams)
}

const DefaultSinger = (from, message) =>
  new Promise((resolve, reject) => {
    const params = [message, from]
    const method = 'personal_sign'

    window.web3.currentProvider.sendAsync({ method, params, from }, function(
      err,
      result
    ) {
      err && reject(err)
      result.error && reject(result.error)
      resolve(result.result)
    })
  })

const TypedDataSigner = (from, message, { inputCapacity, outputs }) =>
  new Promise((resolve, reject) => {
    const typedData = buildTypedData(inputCapacity, outputs, message)
    const params = [from, typedData]
    const method = 'eth_signTypedData_v4'

    window.web3.currentProvider.sendAsync({ method, params, from }, function(
      err,
      result
    ) {
      err && reject(err)
      resolve(result.result)
    })
  })

const buildTypedData = (inputCapacity, outputs, messageHash) => {
  const typedData = getTypedDataTemplate()
  typedData.message.hash =
    '0x' +
    ethUtil.hashPersonalMessage(ethUtil.toBuffer(messageHash)).toString('hex')
  typedData.message.to = []

  let outputCapacity = BigInt(0)

  outputs.forEach(output => {
    const { hashType, codeHash, args } = output.lock
    const capacity = BigInt(output.capacity)
    outputCapacity = JSBI.add(outputCapacity, capacity)
    let amount = toCKB(capacity.toString(), { pad: true }) + 'CKB'
    let address = 'unknown'
    if (codeHash !== '0x00000000000000000000000000000000') {
      if (codeHash === ckb.config.secp256k1Dep.codeHash) {
        address = truncatedAddress(
          ckb.utils.bech32Address(args, {
            prefix: 'ckt',
            type: '0x01',
            codeHashOrCodeHashIndex: '0x00'
          })
        )
      } else {
        let type = hashType == 'data' ? '0x02' : '0x04'
        address = truncatedAddress(
          ckb.utils.fullPayloadToAddress({
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

  typedData.message['input-sum'] = toCKB(inputCapacity, { pad: true }) + 'CKB'
  const feeBigInt = JSBI.lessThan(BigInt(inputCapacity), outputCapacity)
    ? BigInt(0)
    : JSBI.subtract(BigInt(inputCapacity), outputCapacity)
  typedData.message.fee = toCKB(feeBigInt.toString(), { pad: true }) + 'CKB'

  return JSON.stringify(typedData)
}

const getTypedDataTemplate = () => ({
  domain: {
    chainId: 1,
    name: 'ckb.pw',
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    version: '1'
  },
  message: {
    hash: '0x545529d4464064d8394c557afb06f489e7044a63984c6113385431d93dcffa1b',
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
})
