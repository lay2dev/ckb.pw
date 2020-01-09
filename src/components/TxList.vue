<template>
  <div class="bg-white">
    <q-tabs
      v-model="direction"
      dense
      inline-label
      active-color="black"
      class="text-blue-grey-5"
      align="justify"
      @input="filterTXs"
    >
      <q-tab name="all" icon="import_export" :label="$t('label_tx_all')" />
      <q-tab name="in" icon="call_received" :label="' ' + $t('label_tx_in')" />
      <q-tab name="out" icon="call_made" :label="$t('label_tx_out')" />
    </q-tabs>
    <q-separator />
    <q-scroll-area :style="scrollHeight">
      <q-pull-to-refresh @refresh="done => reload({ type: direction }, done)">
        <q-infinite-scroll
          ref="inf"
          @load="loadMore"
          :offset="100"
          debounce="250"
        >
          <q-list separator>
            <q-item
              v-for="(tx, index) in txs"
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
                  <span :class="`${tx.direction}-text`">
                    <span class="text-balance-int">{{
                      displayAmount(tx.amount)[0]
                    }}</span>
                    <span
                      v-if="displayAmount(tx.amount)[1]"
                      class="text-caption"
                      >{{ '.' + displayAmount(tx.amount)[1] }}</span
                    >
                    <span> CKB</span>
                  </span>
                </q-item-label>
                <q-item-label caption lines="1">
                  <span class="text-weight-bold">{{
                    displayDirection(tx.direction)
                  }}</span>
                  <span>
                    -
                    {{
                      displayAddress(tx.direction === 'in' ? tx.from : tx.to)
                    }}</span
                  >
                </q-item-label>
              </q-item-section>

              <q-item-section class="text-caption" side top>
                {{ displayTime(tx.time) }}
              </q-item-section>
            </q-item>
          </q-list>
          <template v-slot:loading>
            <div class="row justify-center q-my-md">
              <q-spinner-dots color="primary" size="30px" />
            </div>
          </template>
        </q-infinite-scroll>
      </q-pull-to-refresh>
    </q-scroll-area>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { toCKB, displayLongAddress } from '../services/utils'
import { openURL } from 'quasar'
import moment from 'moment'
export default {
  name: 'TxList',
  props: ['height', 'txs'],
  data() {
    return {
      direction: 'all'
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
    },
    filterTXs() {
      switch (this.direction) {
        case 'all':
          this.reload({})
          break
        default:
          this.reload({ type: this.direction })
      }
    },
    reload: function(params, done) {
      this.$store.dispatch('account/LOAD_TXS', params)
      this.done = done
    },
    loadMore: function(index, done) {
      if (this.txs && this.txs.length) {
        const lastHash = this.txs[this.txs.length - 1].hash
        this.reload({ type: this.direction, lastHash }, done)
      } else {
        done && done()
      }
    }
  },
  computed: {
    scrollHeight: function() {
      return 'height:' + this.height
    },
    ...mapGetters('account', {
      loadingTXs: 'loadingTXsGetter',
      noMoreTXs: 'noMoreTXsGetter'
    })
  },
  watch: {
    loadingTXs(newVal) {
      !newVal && this.done && this.done()
    },
    noMoreTXs(newVal) {
      newVal ? this.$refs.inf.stop() : this.$refs.inf.resume()
    }

    // txs(newVal, oldVal) {
    //   this.done && this.done()
    //   const growth = newVal.length - oldVal.length
    //   if (!growth) {
    //     console.log('stop loading')
    //     this.$refs.inf.stop()
    //   }
    // }
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
