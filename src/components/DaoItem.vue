<template>
  <div class="row q-pa-sm justify-between items-center">
    <div class="column">
      <span> {{ displayCKB(item.size) }} CKB </span>
    </div>
    <q-btn
      @click="withdraw"
      color="primary"
      :label="$t('btn_withdraw')"
      :disable="sending"
      :loading="sending"
    >
      <template v-slot:loading>
        <q-spinner-facebook color="white" />
      </template>
    </q-btn>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { toCKB } from '../services/utils'
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
    })
  },
  methods: {
    displayCKB(amount) {
      return toCKB(amount)
    },
    async withdraw() {
      this.sending = true
      const txHash = await DAO.withdraw1(this.item, this.address, this.feeRate)
      console.log('[DAO] Withdraw 1 tx sent: ', txHash)
      this.sending = false
    }
  }
}
</script>
