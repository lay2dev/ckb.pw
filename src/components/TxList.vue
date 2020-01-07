<template>
  <div class="bg-white">
    <q-tabs
      v-model="direction"
      dense
      inline-label
      active-color="black"
      class="text-blue-grey-5"
      align="justify"
    >
      <q-tab name="all" icon="import_export" :label="$t('label_tx_all')" />
      <q-tab name="in" icon="call_received" :label="$t('label_tx_in')" />
      <q-tab name="out" icon="call_made" :label="$t('label_tx_out')" />
    </q-tabs>
    <q-separator />
    <q-scroll-area :style="scrollHeight">
      <q-list separator>
        <q-item
          v-for="(tx, index) in filteredTXs"
          :key="index"
          clickable
          @click="checkTX(tx)"
          v-ripple
        >
          <q-item-section avatar>
            <q-avatar
              v-if="tx.direction === 'in'"
              icon="call_received"
              size="2.2em"
              color="primary"
              text-color="white"
            />
            <q-avatar
              v-else
              icon="call_made"
              size="2.2em"
              color="blue-grey-6"
              text-color="white"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label lines="1">
              <span :class="`${tx.direction}-text`" class="text-weight-bold">{{
                displayAmount(tx.amount)
              }}</span>
            </q-item-label>
            <q-item-label caption lines="1">
              <span class="text-weight-bold">{{
                displayDirection(tx.direction)
              }}</span>
              <span> - {{ tx.counterparty }}</span>
            </q-item-label>
          </q-item-section>

          <q-item-section side top>
            {{ new Date(tx.timestamp).toLocaleTimeString() }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-scroll-area>
  </div>
</template>

<script>
import { toCKB } from '../services/utils'
import { openURL } from 'quasar'
export default {
  name: 'TxList',
  props: ['height'],
  data() {
    return {
      direction: 'all',
      txs: [
        {
          hash:
            '0x9cba3f872959cc9c4478e17872dd4fa89bbe70ab62732d314bf9a57a907c2c72',
          direction: 'in',
          amount: '1230000000',
          counterparty: 'ckb123321213213213',
          timestamp: 1578294299965
        },
        {
          hash:
            '0xc79a19c8c8590c07206182b35b7299cbe01f1595f35174b24222de2aa0f7c31f',
          direction: 'out',
          amount: '321000000',
          counterparty: 'ckb454545454544',
          timestamp: 1578274290965
        }
      ]
    }
  },
  mounted() {
    this.onLoad()
    this.onLoad()
    this.onLoad()
  },
  methods: {
    checkTX: function({ hash }) {
      openURL(`https://explorer.nervos.org/aggron/transaction/${hash}`)
    },
    displayAmount: amount => toCKB(amount) + ' CKB',
    displayDirection: function(direction) {
      return this.$t(direction === 'in' ? 'label_from' : 'label_to')
    },
    onLoad: function() {
      this.txs = [...this.txs, ...this.txs]
    }
  },
  computed: {
    filteredTXs: function() {
      if (this.direction === 'all') return this.txs
      return this.txs.filter(tx => tx.direction === this.direction)
    },
    scrollHeight: function() {
      return 'height:' + this.height
    }
  }
}
</script>
<style lang="scss" scoped>
.in-text {
  color: $primary;
}
.out-text {
  color: $blue-grey-7;
}
</style>
