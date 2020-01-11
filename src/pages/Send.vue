<template>
  <q-page padding>
    <q-list bordered separator>
      <q-slide-item v-if="txs.length === 1">
        <tx-input
          :address.sync="txs[0].address"
          :amount.sync="txs[0].amount"
          :rules="rules"
        />
      </q-slide-item>
      <q-slide-item
        v-else
        v-for="(tx, index) in txs"
        @right="({ reset }) => registerDelete(index, reset)"
        :key="index"
      >
        <template v-slot:right>
          <q-icon name="delete" />
        </template>
        <tx-input
          :address.sync="tx.address"
          :amount.sync="tx.amount"
          :rules="rules"
        />
      </q-slide-item>
    </q-list>
    <q-btn
      outline
      :ripple="false"
      class="full-width q-ma-xs"
      text-color="blue-grey-4"
      icon="add"
      @click="addTX"
    />
    <q-dialog v-model="confirmDelete" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="error" text-color="warning" />
          <h6 class="q-ml-sm">{{ $t('msg_confirm_delete') }}</h6>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            :label="$t('btn_cancel')"
            color="error"
            @click="deletion.reset && deletion.reset()"
            v-close-popup
          />
          <q-btn
            flat
            :label="$t('btn_confirm')"
            color="primary"
            @click="deleteTX()"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
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
import TXInput from '../components/TXInput'
import { mapGetters } from 'vuex'
import { sumAmount, subAmount, toCKB, fromCKB } from '../services/utils'
import { transferETH2CKB, FEE } from '../services/chain'
import BN from 'bn.js'
export default {
  name: 'Send',
  components: { 'tx-input': TXInput },
  data() {
    return {
      txs: [],
      confirmDelete: false,
      sending: false,
      sent: false,
      deletion: {
        index: 0,
        reset: null
      },
      rules: {
        address: [
          val => !!val || this.$t('msg_field_required'),
          val =>
            !(val.startsWith('ck') && val.length > 46) ||
            this.$t('msg_full_address_unsupported')
        ],
        amount: [
          val => !!val || this.$t('msg_field_required'),
          val =>
            new BN(val).gte(new BN(this.MIN_AMOUNT)) ||
            this.$t('label_min_amount') + ' is ' + this.MIN_AMOUNT + ' CKB'
        ]
      }
    }
  },
  async mounted() {
    this.addTX()
    this.$store.dispatch('account/LOAD_BALANCE')
  },
  computed: {
    ...mapGetters('account', {
      address: 'addressGetter',
      balance: 'balanceGetter',
      loadingBalance: 'loadingBalanceGetter',
      MIN_AMOUNT: 'minAmountGetter'
    }),
    sendAmount() {
      if (!this.txs.length) return 0
      let amount = this.txs.map(tx => tx.amount).reduce(sumAmount)
      !amount && (amount = 0)
      return amount
    },
    remaining() {
      return subAmount(this.balance, fromCKB(this.sendAmount))
    },
    fee() {
      return FEE
    }
  },
  methods: {
    registerDelete(index, reset) {
      this.deletion.index = index
      this.deletion.reset = reset
      this.confirmDelete = true
    },
    addTX() {
      this.txs.push({})
    },
    deleteTX() {
      this.txs.splice(this.deletion.index, 1)
      this.deletion.reset && this.deletion.reset()
    },
    resetTXs() {
      this.txs = [{}]
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
