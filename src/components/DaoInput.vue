<template>
  <q-card square>
    <q-card-section>
      <p>{{ $t('hint_dao_deposit') }}</p>
      <q-input
        type="number"
        standout
        class="amount-text"
        clearable
        clear-icon="close"
        no-error-icon
        debounce="500"
        v-model="_amount"
        suffix="CKB"
        :hint="`${$t('hint_available')}: ${displayCKB(rawBalance)} CKB`"
        :rules="rules('amount')"
        @input="validate"
      />
    </q-card-section>
  </q-card>
</template>

<script>
import { mapGetters } from 'vuex'
import { JSBI, toCKB } from '../services/ckb/utils'

const MIN_DAO_AMOUNT = 102

export default {
  name: 'DaoInput',
  props: ['amount', 'ready'],
  data() {
    return {
      MIN_DAO_AMOUNT: MIN_DAO_AMOUNT
    }
  },
  computed: {
    ...mapGetters('account', {
      rawBalance: 'balanceGetter'
    }),
    _amount: {
      get() {
        return this.amount
      },
      set(val) {
        if (val == null) return
        this.$emit('update:amount', val)
      }
    }
  },
  methods: {
    rules() {
      const rule_not_empty = val => !!val || this.$t('msg_field_required')
      const rule_min_amount = val =>
        JSBI.GE(JSBI.BigInt(val), JSBI.BigInt(MIN_DAO_AMOUNT)) ||
        this.$t('label_min_amount') + ': ' + MIN_DAO_AMOUNT + ' CKB'
      const rule_is_integer = val =>
        !/[\D]/.test(val) || this.$t('msg_only_integer')
      return [rule_not_empty, rule_min_amount, rule_is_integer]
    },
    displayCKB(amount) {
      return toCKB(amount)
    },
    validate(amount) {
      for (let rule of this.rules()) {
        if (typeof rule(amount) === 'string') {
          this.$emit('update:ready', false)
          return
        }
      }
      this.$emit('update:ready', true)
    },
    selectInput(e) {
      e.srcElement.select()
    }
  }
}
</script>
<style lang="scss" scoped>
.amount-text {
  font-size: 1.5em;
}
</style>
