<template>
  <q-card>
    <q-separator inset />
    <q-card-section>
      <q-input
        class="fee-rate-text"
        type="number"
        filled
        dense
        debounce="500"
        hide-bottom-space
        v-model.number="feeRate"
        no-error-icon
        :rules="[val => val >= minFeeRate || $t('msg_min_fee_rate')]"
      >
        <template v-slot:prepend>
          <span class="text-caption"> {{ $t('label_fee_rate') + ': ' }} </span>
        </template>
        <template v-slot:append>
          <span class="text-caption"> Shannons / KB </span>
        </template>
      </q-input>
    </q-card-section>
    <q-item>
      <q-item-section side>
        {{ $t('label_cheap') }}
      </q-item-section>
      <q-item-section>
        <q-slider
          v-model="_feeRate"
          color="primary"
          markers
          snap
          :min="minFeeRate"
          :step="minFeeRate"
          :max="minFeeRate * 5"
        />
      </q-item-section>
      <q-item-section side>
        {{ $t('label_fast') }}
      </q-item-section>
    </q-item>
  </q-card>
</template>

<script>
import { MIN_FEE_RATE } from '../services/ckb/core'
export default {
  name: 'FeeRate',
  props: ['feeRate'],
  data() {
    return {
      minFeeRate: MIN_FEE_RATE
    }
  },
  computed: {
    _feeRate: {
      get: function() {
        return Number(this.feeRate)
      },
      set: function(val) {
        this.$emit('update:feeRate', val)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.fee-rate-text {
  font-size: 1.2em;
}
</style>
