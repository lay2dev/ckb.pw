<template>
  <div :class="isWithdrawing && 'bg-lime-1'">
    <q-separator />
    <div class="row q-pa-sm justify-between items-center">
      <div class="column">
        <span> {{ displayCKB(item.size) }} CKB </span>
        <span class="text-caption text-blue-grey-4">
          {{ displayDateTime(item.depositBlockHeader.timestamp) }}
        </span>
      </div>
      <div class="column">
        <span class="text-caption text-primary">
          {{ $t('label_revenue') }}: ~{{ displayCKB(item.revenue) }} CKB</span
        >
        <span v-if="isWithdrawing" class="text-caption text-blue-grey-4">
          {{ $t('label_withdrawing') }}</span
        >
        <span v-else class="text-caption text-blue-grey-4">
          {{ $t('label_apc') }}: ~{{ item.apc }} %</span
        >
      </div>
      <q-btn
        @click="withdraw"
        color="primary"
        size="sm"
        icon="eject"
        round
        :disable="sending"
        :loading="sending"
      >
        <template v-slot:loading>
          <q-spinner-facebook color="white" />
        </template>
      </q-btn>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { toCKB } from '../services/ckb/utils'
import { displayDateTime } from '../services/utils'
import { settle, claim } from '../services/ckb/core'
import GTM from '../components/gtm'
export default {
  name: 'DaoItem',
  props: ['item', 'sent'],
  data() {
    return {
      sending: false
    }
  },
  computed: {
    ...mapGetters('account', {
      address: 'addressGetter'
    }),
    ...mapGetters('chain', {
      feeRate: 'feeRateGetter'
    }),
    isWithdrawing: function() {
      return this.item.type === 'withdraw'
    }
  },
  methods: {
    displayCKB(amount) {
      return toCKB(amount)
    },
    displayDateTime: displayDateTime,
    async withdraw() {
      this.sending = true
      if (this.item.type === 'deposit') {
        const txHash = await settle(this.item, this.address)
        if (txHash) {
          const gtmEvent = {
            category: 'conversions',
            action: 'DaoSettleEvent',
            label: this.address,
            value: Number(this.item.countedCapacity)
          }
          GTM.logEvent(gtmEvent)
          this.$emit('update:sent', true)
        }
        console.log('[DAOItem] settle tx sent: ', txHash)
      } else if (this.item.type === 'withdraw') {
        const txHash = await claim(this.item, this.address)
        if (txHash) {
          const gtmEvent = {
            category: 'conversions',
            action: 'DaoClaimEvent',
            label: this.address,
            value: Number(this.item.countedCapacity)
          }
          GTM.logEvent(gtmEvent)
          this.$emit('update:sent', true)
          console.log('[DAOItem] claim tx sent: ', txHash)
        }
      }
      this.sending = false
    }
  }
}
</script>
<style lang="scss" scoped></style>
