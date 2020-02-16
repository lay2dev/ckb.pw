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
import { toCKB, displayDateTime } from '../services/utils'
import { DAO } from '../services/chain'
export default {
  name: 'DaoItem',
  props: ['item'],
  data() {
    return {
      sending: false,
      sent: false
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
      let txHash = ''
      if (this.item.type === 'deposit') {
        txHash = await DAO.withdraw1(this.item, this.address, this.feeRate)
      } else if (this.item.type === 'withdraw') {
        // txHash await DAO.withdraw2()
      }
      console.log('[DAO] Withdraw 1 tx sent: ', txHash)
      this.sending = false
    }
  }
}
</script>
<style lang="scss" scoped></style>
