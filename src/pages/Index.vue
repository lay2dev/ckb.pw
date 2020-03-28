<template>
  <q-page
    id="view"
    class="bg-grey-4 column q-pa-sm no-scroll"
    v-touch-hold:2000="toggleVConsole"
  >
    <q-pull-to-refresh @refresh="refresh" color="primary">
      <meta-card ref="meta" />
      <keep-alive>
        <tx-card ref="tx" />
      </keep-alive>
      <swap-card />
      <dash-card />
    </q-pull-to-refresh>
  </q-page>
</template>

<script>
import { mapGetters } from 'vuex'
import MetaCard from '../components/MetaCard'
import TxCard from '../components/TxCard'
import SwapCard from '../components/SwapCard'
import DashCard from '../components/DashCard'

export default {
  name: 'PageIndex',
  components: {
    MetaCard,
    TxCard,
    DashCard,
    SwapCard
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
      topOffset: 'topOffsetGetter',
      bottomOffset: 'bottomOffsetGetter'
    })
  },
  methods: {
    refresh: async function(done) {
      // this.$refs.tx.clearTXs()
      await Promise.all([
        this.$refs.meta.loadBalance(),
        this.$refs.tx.loadTXs()
      ])
      done && done()
    },
    toggleVConsole() {
      let vConsole = localStorage.getItem('vconsole')
      vConsole = vConsole === 'on' ? 'off' : 'on'
      this.$q.notify({
        message: `vConsole will be switched ${vConsole}`,
        position: 'top',
        actions: [
          {
            label: 'Cancel',
            color: 'white',
            handler: () => {}
          },
          {
            label: 'OK, Reload',
            color: 'primary',
            handler: () => {
              localStorage.setItem('vconsole', vConsole)
              window.location.reload()
            }
          }
        ]
      })
    }
  }
}
</script>
