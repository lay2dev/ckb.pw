<template>
  <div>
    <q-card v-if="loading" square class="q-mb-sm">
      <q-card-section>
        <div class="q-ma-sm" v-for="n in limit" :key="n">
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
import api from '../services/api'
import { getLockHash } from '../services/chain'
const LIMIT = 5
export default {
  name: 'TxCard',
  components: { TxItem },
  data() {
    return {
      txs: [],
      loading: false,
      limit: LIMIT
    }
  },
  computed: {
    ...mapGetters('account', {
      address: 'addressGetter'
    })
  },
  activated() {
    this.address !== '-' && this.loadTXs(this.address)
  },
  methods: {
    async loadTXs(address) {
      !address && (address = this.address)
      this.loading = true
      const _txs = await api.getTxList(getLockHash(address), null, this.limit)
      this.txs = _txs.slice(0, this.limit)
      this.loading = false
    },
    clearTXs() {
      this.txs = []
    }
  },
  watch: {
    address(address) {
      this.loadTXs(address)
    }
  }
}
</script>
