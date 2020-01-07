<template>
  <q-page class="bg-lime-1 column q-gutter-sm" padding>
    <q-card>
      <q-card-section>
        <div>
          <span class="text-dao-locked q-mr-sm">{{ locked }} CKB</span>
          <span class="text-blue-grey">{{ $t('label_in_dao') }}</span>
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
    </q-card>
    <q-card>
      <q-card-section>
        <q-input
          filled
          v-model="amount"
          class="text-dao-locked"
          @click="selectInput"
          type="number"
          maxlength="12"
          :hint="`${this.balance} CKB ${this.$t('hint_available')}`"
          suffix="CKB"
          no-error-icon
          :rules="rules"
        />
        <q-slider
          v-model="amount"
          :min="102"
          :max="parseInt(balance)"
          color="primary"
        />
      </q-card-section>
      <q-card-section>
        <q-btn
          push
          no-caps
          size="lg"
          color="primary"
          class="full-width"
          label="Let's DAO !"
          @click="lockIt"
        />
      </q-card-section>
    </q-card>
    <q-btn
      class="q-ma-lg float-right"
      fab
      color="primary"
      @click="test"
      label="TEST"
    />
  </q-page>
</template>

<script>
import { mapGetters } from 'vuex'
import { toCKB } from '../services/utils'
import api from '../services/api'

export default {
  name: 'Dao',
  data() {
    return {
      amount: 102,
      rules: [val => parseInt(val) > 101 || this.$t('msg_dao_min_amount')]
    }
  },
  computed: {
    ...mapGetters('dao', {
      locked: 'lockedGetter',
      revenue: 'revenueGetter',
      apc: 'apcGetter'
    }),
    ...mapGetters('account', {
      rawBalance: 'balanceGetter',
      address: 'addressGetter'
    }),
    balance: function() {
      return toCKB(this.rawBalance)
    }
  },
  methods: {
    async test() {
      await api.getUnspentCells(
        '0x3c0f15ca6631565dd2b352f10e429deb4d765b1a5bf82dd6899b9315e1af9152',
        '0xd81215452e'
      )
    },
    async lockIt() {},
    selectInput(e) {
      e.srcElement.select()
    }
  },
  async mounted() {
    this.$store.dispatch('account/LOAD_BALANCE')
  },
  watch: {
    async address() {
      this.$store.dispatch('account/LOAD_BALANCE')
    }
  }
}
</script>
<style lang="scss" scoped>
.text-dao-locked {
  font-size: 1.8em;
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
