<template>
  <q-infinite-scroll @load="loadMore" :offset="500" debounce="300">
    <div class="bg-white">
      <q-tabs
        v-model="direction"
        dense
        inline-label
        active-color="black"
        class="float-top text-blue-grey-5"
        align="justify"
        @input="filterTXs"
      >
        <q-tab name="all" icon="import_export" :label="$t('label_tx_all')" />
        <q-tab
          name="in"
          icon="call_received"
          :label="' ' + $t('label_tx_in')"
        />
        <q-tab name="out" icon="call_made" :label="$t('label_tx_out')" />
      </q-tabs>
      <q-separator />
      <q-pull-to-refresh @refresh="done => reload({ type: direction }, done)">
        <q-list separator>
          <tx-item v-for="tx in txs" :tx="tx" :key="tx.hash" />
        </q-list>
      </q-pull-to-refresh>
    </div>
    <template v-slot:loading>
      <div class="row justify-center q-my-md">
        <q-spinner-dots color="primary" size="30px" />
      </div>
    </template>
  </q-infinite-scroll>
</template>

<script>
import { mapGetters } from 'vuex'
import TxItem from './TxItem'
export default {
  name: 'TxList',
  components: { TxItem },
  data() {
    return {
      direction: 'all'
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
    this.reload({})
  },
  methods: {
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
  watch: {
    loadingTXs(newVal) {
      !newVal && this.done && this.done()
    },
    noMoreTXs(newVal) {
      newVal ? this.$refs.inf.stop() : this.$refs.inf.resume()
    },
    address() {
      this.reload({})
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
