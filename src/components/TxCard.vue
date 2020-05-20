<template>
  <div>
    <q-card v-if="loadingTXs" square class="q-mb-sm">
      <q-card-section>
        <div class="q-ma-sm" v-for="n in LIMIT" :key="n">
          <q-skeleton type="rect" />
        </div>
      </q-card-section>
    </q-card>
    <q-card v-else square class="q-mb-sm">
      <center class="text-caption text-blue-grey-4">
        - {{ $t('label_recent_tx') }} -
      </center>
      <q-separator />
      <q-list v-if="txs.length" dense bordered separator>
        <tx-item dense v-for="tx in txs" :tx="tx" :key="tx.hash" />
      </q-list>
      <div v-else class="text-grey-4 column items-center q-ma-sm">
        <q-icon size="3em" name="las la-inbox" />
        <span> {{ $t('label_no_record') }} </span>
      </div>
      <q-separator />
      <q-btn :label="$t('btn_view_more')" class="full-width" flat to="/txs" />
    </q-card>
  </div>
</template>

<script>
import TxItem from './TxItem'
import { mapGetters } from 'vuex'
const LIMIT = 5
export default {
  name: 'TxCard',
  components: { TxItem },
  data(){
    return {
      LIMIT: LIMIT
    }
  },
  computed: {
    ...mapGetters('account', {
      remoteTXs: 'txsGetter',
      address: 'addressGetter',
      loadingTXs: 'loadingTXsGetter'
    }),
    txs() {
      let pending = this.$q.localStorage.getItem('pending') || []
      let stillPending = []
      for (let p of pending) {
        if (this.remoteTXs.find(rtx => rtx.hash === p.hash)) {
          continue
        }
        stillPending.push(p)
      }
      this.$q.localStorage.set('pending', stillPending)
      return [...stillPending, ...this.remoteTXs].slice(0, LIMIT)
    }
  },
  activated() {
    this.address.length && this.loadTXs(this.address)
    this.timer && clearInterval(this.timer)
    this.timer = setInterval(() => {
      this.loadTXs(this.address, true)
    }, 5000)
  },
  deactivated() {
    this.timer && clearInterval(this.timer)
  },
  methods: {
    async loadTXs(address = this.address, quiet) {
      if (!address) return
      this.$store.dispatch('account/LOAD_TXS', { size: LIMIT, quiet })
    }
  },
  watch: {
    address(address) {
      this.loadTXs(address)
    }
  }
}
</script>
