<template>
  <div>
    <q-card square class="q-mb-sm">
      <q-list dense bordered separator>
        <tx-item dense v-for="tx in txs" :tx="tx" :key="tx.hash" />
      </q-list>
      <q-btn class="full-width" dense flat to="/txs">{{
        $t('btn_view_more')
      }}</q-btn>
    </q-card>
  </div>
</template>

<script>
import TxItem from './TxItem'
import { mapGetters } from 'vuex'
import api from '../services/api'
import { getLockHash } from '../services/chain'
export default {
  name: 'TxCard',
  components: { TxItem },
  data() {
    return {
      txs: []
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
      const _txs = await api.getTxList(getLockHash(address), null, 3)
      this.txs = _txs.slice(0, 3)
    }
  },
  watch: {
    address(address) {
      this.loadTXs(address)
    }
  }
}
</script>
