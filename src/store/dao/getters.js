import { toCKB } from '../../services/utils'
export const lockedGetter = state => toCKB(state.locked)
export const apcGetter = state => state.apc + '%'
export const revenueGetter = state => toCKB(state.revenue)
