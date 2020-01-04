<template>
  <div class="column q-pa-sm q-gutter-xs">
    <q-input filled dense v-model="_address" :label="$t('label_address')" />
    <q-input
      filled
      dense
      v-model="_amount"
      :label="$t('label_amount')"
      suffix="CKB"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  name: 'TXInput',
  props: ['address', 'amount'],
  data() {
    return {}
  },
  computed: {
    ...mapGetters('account', {
      MIN_AMOUNT: 'minAmountGetter'
    }),
    _address: {
      get() {
        return this.address
      },
      set(val) {
        this.$emit('update:address', val)
      }
    },
    _amount: {
      get() {
        return this.amount
      },
      set(val) {
        if (!val || val < this.MIN_AMOUNT) {
          val = this.MIN_AMOUNT
        }
        this.$emit('update:amount', val)
      }
    }
  }
}
</script>
