<template>
  <q-page padding>
    <q-list bordered separator>
      <q-slide-item v-if="txs.length === 1">
        <tx-input :address.sync="txs[0].address" :amount.sync="txs[0].amount" />
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
        <tx-input :address.sync="tx.address" :amount.sync="tx.amount" />
      </q-slide-item>
    </q-list>
    <q-btn class="full-width q-ma-xs" icon="add" @click="txs.push({})" />
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
          <strong>{{ remaining }} CKB</strong>
        </div>
        <div class="col column">
          <span>{{ $t('label_fee') + ':' }}</span>
          <strong>{{ fee }} CKB</strong>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="around">
        <q-btn class="col" :label="$t('btn_clear')" @click="txs = [{}]" />
        <q-btn
          class="col"
          color="primary"
          :label="$t('btn_send')"
          @click="send"
        />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script>
import TXInput from '../components/TXInput'
import { mapGetters } from 'vuex'
import { sumAmount, subAmount } from '../services/utils'
import { signWitness } from '../services/eth'
export default {
  name: 'Send',
  components: { 'tx-input': TXInput },
  data() {
    return {
      txs: [],
      confirmDelete: false,
      deletion: {
        index: 0,
        reset: null
      }
    }
  },
  mounted() {
    this.txs.push({})
  },
  computed: {
    ...mapGetters('account', {
      address: 'addressGetter',
      balance: 'balanceGetter',
      MIN_AMOUNT: 'minAmountGetter'
    }),
    sendAmount() {
      if (!this.txs.length) return 0
      return this.txs.map(tx => tx.amount).reduce(sumAmount)
    },
    remaining() {
      return subAmount(this.balance, this.sendAmount)
    },
    fee() {
      return 0
    }
  },
  methods: {
    registerDelete(index, reset) {
      this.deletion.index = index
      this.deletion.reset = reset
      this.confirmDelete = true
    },
    deleteTX() {
      this.txs.splice(this.deletion.index, 1)
      this.deletion.reset && this.deletion.reset()
    },
    async send() {
      const witness = await signWitness(
        '0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0',
        this.address
      )
      console.log('signed witness: ', witness)
    }
  }
}
</script>
