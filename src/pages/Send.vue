<template>
  <q-page padding>
    <outputs-form ref="outputs_form" :outputs="txs" />
    <q-card>
      <q-card-section class="row">
        <div class="col column">
          <span class="text-blue-grey-4">{{
            $t('label_remaining') + ':'
          }}</span>
          <div v-if="loadingBalance">{{ $t('label_loading') }}</div>
          <div v-else class="row items-baseline">
            <strong>{{ displayCKB(remaining)[0] }}</strong>
            <span v-if="displayCKB(remaining)[1]" class="text-dig">{{
              '.' + displayCKB(remaining)[1]
            }}</span>
            <span class="q-ml-xs">CKB</span>
          </div>
        </div>
        <div class="col column">
          <span class="text-blue-grey-4">{{ $t('label_fee') + ':' }}</span>
          <div class="row items-baseline">
            <strong>{{ displayCKB(fee)[0] }}</strong>
            <span v-if="displayCKB(fee)[1]" class="text-dig">{{
              '.' + displayCKB(fee)[1]
            }}</span>
            <span class="q-ml-xs">CKB</span>
          </div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="around">
        <q-btn
          unelevated
          color="blue-grey-4"
          class="col"
          :label="$t('btn_clear')"
          @click="resetTXs"
        />
        <q-btn
          unelevated
          class="col"
          color="primary"
          :label="$t('btn_send')"
          :loading="sending"
          :disable="sending"
          @click="send"
        >
          <template v-slot:loading>
            <q-spinner-facebook color="white" />
          </template>
        </q-btn>
      </q-card-actions>
    </q-card>
    <q-dialog v-model="sent" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="done_all" color="primary" text-color="white" />
          <span class="q-ml-sm text-h5">{{ $t('msg_sent_success') }}</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            :label="$t('label_return')"
            color="blue-grey-6"
            to="/"
            v-close-popup
          />
          <q-btn
            flat
            :label="$t('label_send_more')"
            color="primary"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import OutputsForm from '../components/OutputsForm'
import { mapGetters } from 'vuex'
import { sumAmount, subAmount, toCKB, fromCKB } from '../services/utils'
import { transferETH2CKB } from '../services/chain'
export default {
  name: 'Send',
  components: { 'outputs-form': OutputsForm },
  data() {
    return {
      txs: [],
      sending: false,
      sent: false
    }
  },
  async mounted() {
    this.txs.push({})
    this.$store.dispatch('account/LOAD_BALANCE')
    this.$store.dispatch('chain/LOAD_FEE_RATE')
  },
  computed: {
    ...mapGetters('account', {
      address: 'addressGetter',
      balance: 'balanceGetter',
      loadingBalance: 'loadingBalanceGetter',
      MIN_AMOUNT: 'minAmountGetter'
    }),
    ...mapGetters('chain', {
      feeRate: 'feeRateGetter',
      fee: 'feeGetter'
    }),
    sendAmount() {
      if (!this.txs.length) return 0
      let amount = this.txs.map(tx => tx.amount).reduce(sumAmount)
      !amount && (amount = 0)
      return amount
    },
    remaining() {
      return subAmount(this.balance, fromCKB(this.sendAmount))
    }
  },
  methods: {
    resetTXs() {
      this.txs = [{}]
      this.$refs.outputs_form.resetOutputs()
    },
    displayCKB(val) {
      return toCKB(val).split('.')
    },
    async send() {
      this.sending = true
      try {
        await transferETH2CKB(
          this.address,
          this.txs.map(x => {
            return { address: x.address, amount: fromCKB(x.amount) }
          })
        )
        this.sent = true
      } catch (e) {
        this.$q.notify({
          message: e.toString(),
          position: 'top',
          timeout: 2000,
          color: 'negative'
        })
      }
      this.sending = false
    }
  },
  watch: {
    async address() {
      this.$store.dispatch('account/LOAD_BALANCE')
    }
  }
}
</script>
<style lang="scss" scoped>
.text-dig {
  font-size: 0.8em;
  font-weight: 300;
}
</style>
