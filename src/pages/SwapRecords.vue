<template>
  <q-pull-to-refresh @refresh="load" color="primary">
    <q-list v-if="swaps.length" bordered separator>
      <swap-item v-for="swap in swaps" :swap="swap" :key="swap.txhash" />
    </q-list>
    <div v-else class="text-grey-4 column items-center q-ma-sm">
      <q-icon size="3em" name="las la-inbox" />
      <span> {{ $t('label_no_record') }} </span>
    </div>
  </q-pull-to-refresh>
</template>

<script>
import SwapItem from '../components/SwapItem'
export default {
  name: 'SwapRecords',
  components: { SwapItem },
  data() {
    return {
      swaps: [
        {
          txhash: '0x5561358f69b6f038c7feb2a7a8652a910f09160f1b4cb0f7f4261008457634d1',
          currency: 'ETH',
          decimal: 18,
          amount: '50000000000000000',
          ckbAmount: '200000000000',
          transferTime: new Date().getTime()
        },
        {
          txhash: '0x4561358f69b6f038c7feb2a7a8652a910f09160f1b4cb0f7f4261008457634d1',
          currency: 'USDT',
          decimal: 6,
          amount: '5000000',
          ckbAmount: '100000000000',
          transferTime: new Date().getTime()
        }
      ]
    }
  },
  methods: {
    load() {}
  }
}
</script>
