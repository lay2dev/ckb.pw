<template>
  <q-page class="bg-grey-4" padding>
    <outputs-form
      ref="outputs_form"
      :outputs="outputs"
      :outputsReady.sync="outputsReady"
      :broke="broke"
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
          :disable="!outputsReady || broke || loadingUnSpent || sending || !fee"
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
import { debounce } from 'quasar'
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
  MIN_FEE_RATE,
  isNoMoreCells
} from '../services/ckb/core'
import GTM from '../components/gtm'

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
    this.getFee = debounce(this.getFee, 500)
    // load some cells in advance
    this.address && reloadCells(this.address)
    this.outputs.push({ address: null, amount: 0 })
    this.$store.dispatch('account/LOAD_BALANCE')
    this.feeRate = await api.getFeeRate()
    this.resetTXs()
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
        if (
          isNoMoreCells() &&
          e.toString().includes('Input capacity is not enough')
        ) {
          this.$q.notify({
            type: 'warning',
            message: this.$t('msg_no_more_cells'),
            position: 'center',
            timeout: 4000
          })
        }
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
      reloadCells(address)
    },
    sendAmount(amount) {
      if (!this.outputsReady) return
      this.getFee(amount)
    },
    remaining(remaining) {
      if (cmpAmount(remaining, fromCKB(61)) === 'lt') {
        this.broke = true
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
