<template>
  <div>
    <q-card v-if="!txs.length" square class="q-mb-sm">
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
      <q-list dense bordered separator>
        <tx-item dense v-for="tx in txs" :tx="tx" :key="tx.hash" />
      </q-list>
      <q-btn :label="$t('btn_view_more')" class="full-width" flat to="/txs" />
    </q-card>
  </div>
</template>

<script>
import TxItem from './TxItem'
import { mapGetters } from 'vuex'
import api from '../services/api'
import { getLockHash } from '../services/chain'
const LIMIT = 3
export default {
  name: 'TxCard',
  components: { TxItem },
  data() {
    return {
      txs: [],
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
      const _txs = await api.getTxList(getLockHash(address), null, this.limit)
      this.txs = _txs.slice(0, this.limit)
    }
  },
  watch: {
    address(address) {
      this.loadTXs(address)
    }
  }
}
</script>
