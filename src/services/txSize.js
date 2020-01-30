import { serializeOutput } from '@nervosnetwork/ckb-sdk-utils/lib/serialization/transaction'
import { serializeFixVec } from '@nervosnetwork/ckb-sdk-utils/lib/serialization'

const SERIALIZED_OFFSET_BYTESIZE = 4

const base = () => 68 + SERIALIZED_OFFSET_BYTESIZE

const cellDep = () => 37

const headerDep = () => 32

const input = () => 44

const output = output => {
  const bytes = serializeOutput(output)
  return byteLength(bytes) + SERIALIZED_OFFSET_BYTESIZE
}

const outputData = data => {
  const bytes = serializeFixVec(data)
  return byteLength(bytes) + SERIALIZED_OFFSET_BYTESIZE
}

const witness = witness => {
  const bytes = serializeFixVec(witness)
  return byteLength(bytes) + SERIALIZED_OFFSET_BYTESIZE
}

export default tx => {
  return [
    base(),
    cellDep() * tx.cellDeps.length,
    headerDep() * tx.headerDeps.length,
    input() * tx.inputs.length,
    ...tx.outputs.map(o => output(o)),
    ...tx.outputsData.map(data => outputData(data)),
    ...tx.witnesses.map(wit => witness(wit))
  ].reduce((result, c) => result + c, 0)
}

function byteLength(hex) {
  // eslint-disable-next-line no-undef
  return Buffer.byteLength(removePrefix(hex), 'hex')
}

function removePrefix(hex) {
  if (hex.startsWith('0x')) {
    return hex.slice(2)
  }
  return hex
}
