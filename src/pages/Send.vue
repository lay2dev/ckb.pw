<template>
  <q-page padding>
    <outputs-form ref="outputs_form" :outputs="outputs" />
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
            @click="resetTXs"
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
import {
  sumAmount,
  subAmount,
  cmpAmount,
  toCKB,
  fromCKB
} from '../services/utils'
import { sendTx } from '../services/chain'
export default {
  name: 'Send',
  components: { 'outputs-form': OutputsForm },
  data() {
    return {
      outputs: [],
      sending: false,
      sent: false
    }
  },
  async mounted() {
    this.outputs.push({})
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
      feeRate: 'feeRateGetter'
    }),
    ...mapGetters('cell', {
      unSpent: 'unSpentGetter'
    }),
    sendAmount() {
      if (!this.outputs.length) return 0
      let amount = this.outputs.map(tx => tx.amount).reduce(sumAmount)
      !amount && (amount = 0)
      return amount
    },
    remaining() {
      return subAmount(this.balance, fromCKB(this.sendAmount))
    },
    fee() {
      return '1000'
    }
  },
  methods: {
    resetTXs() {
      this.outputs = [{}]
      this.$refs.outputs_form.resetOutputs()
    },
    displayCKB(val) {
      return toCKB(val).split('.')
    },
    async send() {
      this.sending = true
      try {
        await sendTx(
          this.unSpent.cells,
          this.outputs.map(({ address, amount }) => {
            return { address, amount: fromCKB(amount) }
          }),
          this.fee,
          this.address
        )
        this.$store.dispatch('cell/CLEAR_UNSPENT_CELLS')
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
    },
    async sendAmount(newVal) {
      const needed = fromCKB(newVal)
      if (cmpAmount(needed, this.unSpent.capacity) === 'gt') {
        this.$store.dispatch('cell/LOAD_UNSPENT_CELLS', {
          address: this.address,
          capacity: needed
        })
      }
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
