<template>
  <q-page id="view" class="bg-grey column q-pa-sm no-scroll">
    <meta-card />
    <keep-alive>
      <tx-card />
    </keep-alive>
    <dash-card />
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
  methods: {}
}
</script>
