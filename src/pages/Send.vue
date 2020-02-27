<template>
  <q-page class="bg-grey-4" padding>
    <outputs-form
      ref="outputs_form"
      :outputs="outputs"
      :outputsReady.sync="outputsReady"
    />
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
            <span class="text-caption q-ml-xs">CKB</span>
          </div>
        </div>
        <q-separator class="q-ml-xs" vertical />
        <div class="col row justify-between items-center">
          <div class="column q-ml-sm">
            <span class="text-blue-grey-4">{{ $t('label_fee') + ':' }}</span>
            <div class="row items-baseline">
              <strong>{{ displayCKB(fee)[0] }}</strong>
              <span v-if="displayCKB(fee)[1]" class="text-dig">{{
                '.' + displayCKB(fee)[1]
              }}</span>
              <span class="text-caption q-ml-xs">CKB</span>
            </div>
          </div>
          <q-toggle v-model="showFeeRate" icon="edit" size="sm" />
        </div>
      </q-card-section>
      <q-slide-transition>
        <fee-rate v-show="showFeeRate" :feeRate.sync="feeRate" />
      </q-slide-transition>
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
          :loading="sending || loadingUnSpent"
          :disable="!outputsReady || broke || loadingUnSpent || sending"
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
import FeeRate from '../components/FeeRate'
import api from '../services/api'
import { mapGetters } from 'vuex'
import { toCKB, fromCKB } from '../services/ckb/utils'
import { sumAmount, subAmount, cmpAmount } from '../services/utils'
import {
  calcFee,
  sendTx,
  setFeeRate,
  reloadCells,
  MIN_FEE_RATE
} from '../services/ckb/core'
import GTM from '../components/gtm'

const PRELOAD_AMOUNT = 10000

export default {
  name: 'Send',
  components: { 'outputs-form': OutputsForm, 'fee-rate': FeeRate },
  data() {
    return {
      feeRate: MIN_FEE_RATE,
      fee: 0,
      outputs: [],
      loadingUnSpent: false,
      outputsReady: false,
      broke: false,
      sending: false,
      sent: false,
      showFeeRate: false
    }
  },
  async mounted() {
    // load some cells in advance
    this.address && reloadCells(this.address, PRELOAD_AMOUNT)
    this.outputs.push({})
    this.$store.dispatch('account/LOAD_BALANCE')
    this.feeRate = await api.getFeeRate()
  },
  computed: {
    ...mapGetters('account', {
      address: 'addressGetter',
      balance: 'balanceGetter',
      loadingBalance: 'loadingBalanceGetter',
      MIN_AMOUNT: 'minAmountGetter'
    }),
    sendAmount() {
      if (!this.outputs.length) return 0
      let amount = this.outputs.map(tx => tx.amount).reduce(sumAmount)
      !amount && (amount = 0)
      return amount
    },
    remaining() {
      return subAmount(this.balance, fromCKB(this.sendAmount))
    }
  },
  methods: {
    resetTXs() {
      this.outputs = [{}]
      this.fee = 0
      this.$refs.outputs_form.resetOutputs()
    },
    displayCKB(val) {
      return toCKB(val).split('.')
    },
    async getFee(amount) {
      this.loadingUnSpent = true
      try {
        this.fee = await calcFee(this.address, amount, { data: this.outputs })
      } catch (e) {
        console.log(e.toString())
      }
      this.loadingUnSpent = false
    },
    async send() {
      this.sending = true
      const txHash = await sendTx(this.address, this.outputs)
      if (txHash) {
        const gtmEvent = {
          category: 'conversions',
          action: 'TransferEvent',
          label: this.address,
          value: Number(this.sendAmount)
        }
        GTM.logEvent(gtmEvent)
        this.sent = true
      }
      this.sending = false
    }
  },
  watch: {
    address(address) {
      this.$store.dispatch('account/LOAD_BALANCE')
      // load some cells in advance
      reloadCells(address, PRELOAD_AMOUNT)
    },
    sendAmount(amount) {
      if (!this.outputsReady) return
      this.getFee(amount)
    },
    remaining(remaining) {
      if (cmpAmount(remaining, 0) === 'lt') {
        this.broke = true
        this.$q.notify({
          message: this.$t('msg_broke'),
          color: 'negative',
          position: 'center',
          timeout: 1500
        })
      } else {
        this.broke = false
      }
    },
    feeRate(feeRate) {
      this.fee = setFeeRate(feeRate)
    },
    outputsReady(ready) {
      if (ready) {
        this.getFee(this.sendAmount)
      } else {
        this.fee = 0
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
