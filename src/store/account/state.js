export default function() {
  return {
    loadingBalance: false,
    loadingTXs: false,
    noMoreTXs: false,
    platform: '',
    address: '',
    alias: '',
    capacity: {
      total: '0',
      occupied: '1234'
    },
    txs: []
  }
}
