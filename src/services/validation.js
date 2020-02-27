import { verifyAddress } from './utils'
export const validAddress = address => !!verifyAddress(address)
export const minCapacity = capacity => capacity && Number(capacity) > 61
export function enoughBalance() {
  return !this.broke
}
