<template>
  <q-item class="q-pa-sm" clickable @click="checkSwap(swap)" v-ripple>
    <q-item-section avatar>
      <q-spinner-tail
        v-if="swap.currency === 'pending'"
        :size="avatarSize"
        color="grey-6"
      />
      <q-avatar :size="avatarSize">
        <img :src="getIcon(swap)" />
      </q-avatar>
    </q-item-section>
    <q-item-section>
      <q-item-label class="row justify-between items-center" lines="1">
        <span :class="swap.type === 'pending' ? 'text-grey-6' : null">
          <span class="text-balance-int">{{
            displayAmount(swap.ckbAmount)[0]
          }}</span>
          <span v-if="displayAmount(swap.ckbAmount)[1]" class="text-caption">{{
            '.' + displayAmount(swap.ckbAmount)[1]
          }}</span>
          <span> CKB</span>
        </span>
        <span class="text-caption text-grey">
        {{ displayTime(swap.transferTime) }}
        </span>
      </q-item-label>
      <q-item-label v-if="!dense" caption lines="1">
        <span>{{ $t('label_price') }}: </span>
        <span class="text-weight-bold"> {{ getPrice(swap) }} {{swap.currency}} </span>
        <!-- <span class="text-weight-bold"> - {{ $t('label_rate') }}: </span> -->
        <span> (CKB / {{ swap.currency }} = {{ getRate(swap) }}) </span>
      </q-item-label>
    </q-item-section>

    <!-- <q-item-section class="text-caption" side>
      {{ displayTime(swap.transferTime) }}
    </q-item-section> -->
  </q-item>
</template>

<script>
import { openURL } from 'quasar'
import { toCKB, truncatedAddress } from '../services/ckb/utils'
import moment from 'moment'
import { fromWei } from 'web3-utils'
export default {
  name: 'SwapItem',
  props: {
    swap: Object,
    dense: Boolean
  },
  data() {
    return {}
  },
  computed: {
    avatarSize: function() {
      return this.dense ? '1.2em' : '2.2em'
    }
  },
  methods: {
    checkSwap: function({ txhash }) {
      openURL(`https://etherscan.io/tx/${txhash}`)
    },
    displayAddress: address => truncatedAddress(address),
    displayAmount: amount => toCKB(amount).split('.'),
    displayTime: time => moment(time).fromNow(),
    getIcon(swap) {
      return `../statics/${swap?.currency?.toLowerCase()}.svg`
    },
    getPrice: swap => {
      return Number(fromWei(swap.amount, getUnit(swap))).toPrecision(3)
    },
    getRate: swap => {
      let ckb = Number(toCKB(swap.ckbAmount))
      let token = Number(fromWei(swap.amount, getUnit(swap)))
      console.log(`[SwapItem] ckb: ${ckb}, ${swap.currency}: ${token}`)
      return Number(token / ckb).toPrecision(2)
    }
  }
}

function getUnit(swap) {
  if(swap.decimal === 18) {
    return 'ether'
  }
  if(swap.decimal === 6) {
    return 'mwei'
  }
}
</script>

<style lang="scss" scoped>
.text-balance-int {
  font-size: 1.1em;
  font-weight: 500;
}
.in-text {
  color: $primary;
}
.out-text {
  color: $blue-grey-7;
}
</style>
