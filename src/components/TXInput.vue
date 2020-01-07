<template>
  <div class="column q-pa-sm q-gutter-xs">
    <q-input
      filled
      dense
      clearable
      clear-icon="close"
      no-error-icon
      v-model="_address"
      :label="$t('label_address')"
      :hint="$t('hint_address')"
      :rules="rules.address"
    >
      <template v-slot:append>
        <q-btn dense flat icon="crop_free" @click="scanQR" />
      </template>
    </q-input>
    <q-input
      type="number"
      filled
      dense
      clearable
      clear-icon="close"
      no-error-icon
      v-model="_amount"
      :label="$t('label_amount')"
      suffix="CKB"
      :hint="`${$t('hint_amount')} ${MIN_AMOUNT} CKB`"
      :rules="rules.amount"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  name: 'TXInput',
  props: ['address', 'amount', 'rules'],
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
        this.$emit('update:amount', val)
      }
    }
  },
  methods: {
    async scanQR() {
      if (window.ethereum.isImToken) {
        // eslint-disable-next-line no-undef
        let address = await imToken.callPromisifyAPI('native.scanQRCode')
        address.startsWith('ethereum:') &&
          (address = address.split('ethereum:')[1])
        this.$emit('update:address', address)
      }
    }
  }
}
</script>
