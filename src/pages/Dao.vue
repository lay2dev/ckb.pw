<template>
  <q-page class="bg-lime-1 q-gutter-sm" padding>
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
            <span class="text-dao-apc">{{ apc }}</span>
          </div>
          <div>
            <span class="text-blue-grey">{{ $t('label_revenue') }}: </span>
            <span class="text-dao-revenue">{{ revenue }} CKB</span>
          </div>
        </div>
      </q-card-section>
      <q-list bordered>
        <dao-item v-for="item in list" :item="item" :key="item.hash" />
      </q-list>
    </q-card>
  </q-page>
</template>

<script>
import { mapGetters } from 'vuex'
import { toCKB, fromCKB } from '../services/utils'
import api from '../services/api'
import { DAO } from '../services/chain'
import DaoInput from '../components/DaoInput'
import DaoItem from '../components/DaoItem'

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
  created() {
    // this.$store.dispatch('dao/LOAD_LIST', { address: this.address })
    // this.$store.dispatch('account/LOAD_BALANCE')
    this.$store.dispatch('chain/LOAD_FEE_RATE')
  },
  methods: {
    async lockIt() {
      this.sending = true
      try {
        await DAO.deposit(
          this.address,
          this.amount,
          this.unSpent.cells,
          this.feeRate
        )
        this.$store.dispatch('cell/CLEAR_UNSPENT_CELLS', {
          lastId: this.unSpent.lastId
        })
        this.sent = true
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
    },
    async test() {
      await api.getUnspentCells(
        '0x787e97af6860c58fcecd12653714330c003f5b960e09f027295a49e3c41d609f',
        '0xd81215452e'
      )
    }
  },
  watch: {
    async address(address) {
      this.$store.dispatch('account/LOAD_BALANCE')
      this.$store.dispatch('dao/LOAD_LIST', { address })
    },
    async amount(amount) {
      this.$store.dispatch('cell/LOAD_UNSPENT_CELLS', {
        address: this.address,
        capacity: fromCKB(amount),
        lastId: this.unSpent.lastId
      })
    }
  }
}
</script>
<style lang="scss" scoped>
.text-dao-locked {
  font-size: 1.5em;
}
.text-dao-apc {
  font-size: 1.2em;
}
.text-dao-revenue {
  font-size: 1.2em;
}
.text-balance {
  font-size: 1.2em;
}
</style>
