export const addressGetter = state => state.address

export const balanceGetter = state => state.capacity.total

export const platformGetter = state => state.platform

export const minAmountGetter = () => 61

export const loadingBalanceGetter = state => state.loadingBalance

export const loadingTXsGetter = state => state.loadingTXs

export const txsGetter = state => state.txs

export const noMoreTXsGetter = state => state.noMoreTXs
