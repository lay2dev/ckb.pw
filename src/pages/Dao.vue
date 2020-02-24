<template>
  <q-pull-to-refresh @refresh="refresh" color="primary">
    <q-page class="bg-grey-4 q-gutter-sm" padding>
      <dao-input :amount.sync="amount" :ready.sync="ready" />
      <q-card>
        <q-btn
          push
          no-caps
          size="lg"
          :color="canSend ? 'primary' : 'grey'"
          class="full-width"
          label="Let's DAO !"
          :disable="!canSend"
          :loading="loadingUnSpent || sending"
          @click="lockIt"
        >
          <template v-slot:loading>
            <q-spinner-facebook color="white" />
          </template>
        </q-btn>
      </q-card>
      <q-card square>
        <q-card-section>
          <div>
            <span class="text-dao-locked q-mr-sm">{{ locked }}</span>
            <span class="text-blue-grey"> CKB {{ $t('label_in_dao') }}</span>
          </div>
          <div class="row justify-between">
            <div>
              <span class="text-blue-grey">{{ $t('label_apc') }}: </span>
              <span>~{{ apc }} %</span>
            </div>
            <div>
              <span class="text-blue-grey">{{ $t('label_revenue') }}: </span>
              <span class="text-primary">~{{ revenue }} CKB</span>
            </div>
          </div>
        </q-card-section>
        <q-list>
          <dao-item v-for="item in list" :item="item" :key="item.hash" />
        </q-list>
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
              @click="amount = 0"
              v-close-popup
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-page>
  </q-pull-to-refresh>
</template>

<script>
import { mapGetters } from 'vuex'
import { toCKB, fromCKB } from '../services/ckb/utils'
import { deposit } from '../services/ckb/core'
import DaoInput from '../components/DaoInput'
import DaoItem from '../components/DaoItem'
import api from '../services/api'
import { setFeeRate } from '../services/ckb/core'

export default {
  name: 'Dao',
  components: { DaoInput, DaoItem },
  data() {
    return {
      amount: 0,
      ready: false,
      sending: false,
      sent: false
    }
  },
  computed: {
    ...mapGetters('dao', {
      locked: 'lockedGetter',
      revenue: 'revenueGetter',
      apc: 'apcGetter',
      list: 'listGetter',
      loadingList: 'loadingListGetter'
    }),
    ...mapGetters('account', {
      address: 'addressGetter'
    }),
    ...mapGetters('cell', {
      loadingUnSpent: 'loadingUnSpentGetter',
      unSpent: 'unSpentGetter'
    }),
    ...mapGetters('chain', {
      feeRate: 'feeRateGetter'
    }),
    balance: function() {
      return toCKB(this.rawBalance)
    },
    canSend: function() {
      return this.ready && !this.loadingUnSpent && !this.sending
    }
  },
  mounted() {
    this.$nextTick(async () => {
      const feeRate = await api.getFeeRate()
      setFeeRate(feeRate)
      if (this.address.length) {
        this.$store.dispatch('dao/LOAD_LIST', { address: this.address })
      }
    })
  },
  methods: {
    init(address = this.address) {
      this.$store.dispatch('account/LOAD_BALANCE')
      this.$store.dispatch('dao/LOAD_LIST', { address })
    },
    refresh(done) {
      this.done = done
      this.init()
    },
    async lockIt() {
      this.sending = true
      try {
        const txHash = await deposit(this.address, this.amount)
        if (txHash) {
          this.$store.dispatch('cell/CLEAR_UNSPENT_CELLS', {
            lastId: this.unSpent.lastId
          })
          this.sent = true
        }
      } catch (e) {
        this.$q.notify({
          message: e.toString(),
          position: 'top',
          timeout: 2000,
          color: 'negative'
        })
        console.log(e)
      }
      this.sending = false
    }
  },
  watch: {
    async address(address) {
      this.init(address)
    },
    async amount(amount) {
      this.$store.dispatch('cell/LOAD_UNSPENT_CELLS', {
        address: this.address,
        capacity: fromCKB(amount),
        lastId: this.unSpent.lastId
      })
    },
    loadingList(loading) {
      if (!loading && this.done) {
        this.done()
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.text-dao-locked {
  font-size: 1.5em;
}
.text-balance {
  font-size: 1.2em;
}
</style>
