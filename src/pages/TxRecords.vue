<template>
  <q-page style="padding-top: 36px">
    <q-pull-to-refresh @refresh="load" color="primary">
      <q-tab-panels v-model="type" animated swipeable infinite>
        <q-tab-panel name="all">
          <q-list v-if="txs.length" bordered separator>
            <tx-item v-for="tx in txs" :tx="tx" :key="tx.hash" />
          </q-list>
          <div v-else class="text-grey-4 column items-center q-ma-sm">
            <q-icon size="3em" name="las la-inbox" />
            <span> {{ $t('label_no_record') }} </span>
          </div>
        </q-tab-panel>
        <q-tab-panel name="in">
          <q-list v-if="txs.length" bordered separator>
            <tx-item v-for="tx in txs" :tx="tx" :key="tx.hash" />
          </q-list>
          <div v-else class="text-grey-4 column items-center q-ma-sm">
            <q-icon size="3em" name="las la-inbox" />
            <span> {{ $t('label_no_record') }} </span>
          </div>
        </q-tab-panel>
        <q-tab-panel name="out">
          <q-list v-if="txs.length" bordered separator>
            <tx-item v-for="tx in txs" :tx="tx" :key="tx.hash" />
          </q-list>
          <div v-else class="text-grey-4 column items-center q-ma-sm">
            <q-icon size="3em" name="las la-inbox" />
            <span> {{ $t('label_no_record') }} </span>
          </div>
        </q-tab-panel>
      </q-tab-panels>
      <q-page-sticky position="top" class="bg-white" expand>
        <q-toolbar class="column" style="padding: 0;min-height:0">
          <q-tabs
            v-model="type"
            dense
            stretch
            inline-label
            active-color="black"
            class="text-blue-grey-5"
          >
            <q-tab
              name="all"
              icon="import_export"
              :label="$t('label_tx_all')"
            />
            <q-tab
              name="in"
              icon="call_received"
              :label="' ' + $t('label_tx_in')"
            />
            <q-tab name="out" icon="call_made" :label="$t('label_tx_out')" />
          </q-tabs>
        </q-toolbar>
      </q-page-sticky>
      <q-page-scroller
        position="bottom-right"
        :scroll-offset="150"
        :offset="[24, 48]"
      >
        <q-btn fab-mini icon="keyboard_arrow_up" color="primary" />
      </q-page-scroller>
      <q-scroll-observer debounce="500" @scroll="onScroll" />
      <q-ajax-bar
        ref="loadingBar"
        position="bottom"
        color="primary"
        size="7px"
        skip-hijack
      />
    </q-pull-to-refresh>
  </q-page>
</template>

<script>
import { mapGetters } from 'vuex'
import TxItem from '../components/TxItem'

export default {
  name: 'TxRecords',
  components: { TxItem },
  data() {
    return {
      type: 'all'
    }
  },
  computed: {
    ...mapGetters('account', {
      txs: 'txsGetter',
      address: 'addressGetter',
      loadingTXs: 'loadingTXsGetter',
      noMoreTXs: 'noMoreTXsGetter'
    })
  },
  created() {
    this.resetScroll()
    this.load()
  },
  methods: {
    load: function(done, params = { type: this.type }) {
      this.$store.dispatch('account/LOAD_TXS', params)
      this.done = done
    },
    loadMore: function() {
      if (this.txs && this.txs.length) {
        const lastHash = this.txs[this.txs.length - 1].hash
        this.load(null, { type: this.type, lastHash })
      } else {
        console.log('no more')
      }
    },
    onScroll() {
      if (this.loadingTXs || this.noMoreTXs) return

      let innerHeight = document.querySelector('#q-app').clientHeight
      let outerHeight = document.documentElement.clientHeight
      let scrollTop = document.documentElement.scrollTop + 100
      // console.log(innerHeight + ' ' + outerHeight + ' ' + scrollTop)
      if (innerHeight < outerHeight + scrollTop) {
        this.loadMore()
      }
    },
    resetScroll() {
      window.scrollTo(0, 0)
    }
  },
  watch: {
    loadingTXs(isLoading) {
      if (isLoading) {
        this.$refs.loadingBar.start()
      } else {
        this.$refs.loadingBar.stop()
        this.done && this.done()
      }
    },
    type(type) {
      this.load(null, { type })
      this.resetScroll()
    },
    address() {
      this.load()
    }
  }
}
</script>
<style lang="scss" scoped>
.q-tab-panel {
  padding: 0;
}
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
