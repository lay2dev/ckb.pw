<template>
  <q-item class="q-pa-sm" clickable @click="checkTX(tx)" v-ripple>
    <q-item-section avatar>
      <div v-if="tx.direction === 'in'">
        <q-avatar
          v-if="tx.type === null"
          icon="call_received"
          :size="avatarSize"
          color="primary"
          text-color="white"
        />

        <q-avatar
          v-if="tx.type === 'dao-withdraw2'"
          icon="las la-coins"
          :size="avatarSize"
          color="primary"
          text-color="white"
        />
      </div>
      <div v-else>
        <q-avatar
          v-if="tx.type === null"
          icon="call_made"
          :size="avatarSize"
          color="blue-grey-6"
          text-color="white"
        />
        <q-avatar
          v-if="tx.type === 'dao-deposit'"
          icon="las la-piggy-bank"
          :size="avatarSize"
          color="orange"
          text-color="white"
        />
        <q-avatar
          v-if="tx.type === 'dao-withdraw1'"
          icon="las la-clock"
          :size="avatarSize"
          color="amber-6"
          text-color="white"
        />
      </div>
    </q-item-section>
    <q-item-section>
      <q-item-label lines="1">
        <span :class="`${tx.direction}-text`">
          <span class="text-balance-int">{{
            displayAmount(tx.amount)[0]
          }}</span>
          <span v-if="displayAmount(tx.amount)[1]" class="text-caption">{{
            '.' + displayAmount(tx.amount)[1]
          }}</span>
          <span> CKB</span>
        </span>
      </q-item-label>
      <q-item-label v-if="!dense" caption lines="1">
        <span class="text-weight-bold">{{
          displayDirection(tx.direction)
        }}</span>
        <span>
          -
          {{
            tx.type
              ? 'Nervos DAO'
              : displayAddress(tx.direction === 'in' ? tx.from : tx.to)
          }}</span
        >
      </q-item-label>
    </q-item-section>

    <q-item-section class="text-caption" side>
      {{ displayTime(tx.time) }}
    </q-item-section>
  </q-item>
</template>

<script>
import { openURL } from 'quasar'
import { toCKB, displayLongAddress } from '../services/utils'
import moment from 'moment'
export default {
  name: 'TxItem',
  props: {
    tx: Object,
    dense: Boolean
  },
  data() {
    return {}
  },
  computed: {
    avatarSize: function() {
      return this.dense ? '1.2em' : '2.2em'
    }
  },
  methods: {
    checkTX: function({ hash }) {
      openURL(`https://explorer.nervos.org/aggron/transaction/${hash}`)
    },
    displayAddress: address => displayLongAddress(address),
    displayAmount: amount => toCKB(amount).split('.'),
    displayTime: time => moment(time).fromNow(),
    displayDirection: function(direction) {
      return this.$t(direction === 'in' ? 'label_from' : 'label_to')
    }
  }
}
</script>

<style lang="scss" scoped>
.text-balance-int {
  font-size: 1.1em;
  font-weight: 500;
}
.in-text {
  color: $primary;
}
.out-text {
  color: $blue-grey-7;
}
</style>
