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
          <span>{{ $t('label_remaining') + ':' }}</span>
          <strong>{{ displayCKB(remaining) }} CKB</strong>
        </div>
        <div class="col column">
          <span>{{ $t('label_fee') + ':' }}</span>
          <strong>{{ displayCKB(fee) }} CKB</strong>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="around">
        <q-btn
          unelevated
          color="blue-grey-4"
          class="col"
          :label="$t('btn_clear')"
          @click="txs = [{}]"
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
  mounted() {
    this.addTX()
  },
  computed: {
    ...mapGetters('account', {
      address: 'addressGetter',
      balance: 'balanceGetter',
      MIN_AMOUNT: 'minAmountGetter'
    }),
    sendAmount() {
      if (!this.txs.length) return 0
      let amount = this.txs.map(tx => tx.amount).reduce(sumAmount)
      !amount && (amount = 0)
      return amount
    },
    remaining() {
      // console.log('balance', this.balance)
      // console.log('sendAmount', this.sendAmount)
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
    displayCKB(val) {
      return toCKB(val)
    },
    async send() {
      let { address, amount } = this.txs[0]
      this.sending = true
      await transferETH2CKB(this.address, address, amount)
      this.sending = false
    }
  }
}
</script>
