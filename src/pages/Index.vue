<template>
  <q-page id="view" class="bg-grey column q-pa-sm no-scroll">
    <q-pull-to-refresh @refresh="refresh" color="primary">
      <meta-card ref="meta" />
      <keep-alive>
        <tx-card ref="tx" />
      </keep-alive>
      <dash-card />
    </q-pull-to-refresh>
  </q-page>
</template>

<script>
import { mapGetters } from 'vuex'
import MetaCard from '../components/MetaCard'
import TxCard from '../components/TxCard'
import DashCard from '../components/DashCard'

export default {
  name: 'PageIndex',
  components: {
    MetaCard,
    TxCard,
    DashCard
  },
  data() {
    return {
      tab: 'account',
      viewHeight: 0,
      cardHeight: 0,
      splitter: 10
    }
  },
  computed: {
    ...mapGetters('account', {
      txs: 'txsGetter'
    }),
    ...mapGetters('config', {
      barHeight: 'barHeightGetter',
      topOffset: 'topOffsetGetter',
      bottomOffset: 'bottomOffsetGetter'
    })
  },
  methods: {
    refresh: async function(done) {
      await Promise.all([
        this.$refs.meta.loadBalance(),
        this.$refs.tx.loadTXs()
      ])
      done && done()
    }
  }
}
</script>
