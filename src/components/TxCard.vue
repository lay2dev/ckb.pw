<template>
  <div>
    <q-card v-if="loadingTXs" square class="q-mb-sm">
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
        <tx-item
          dense
          v-for="n in limit"
          :tx="txs[n - 1]"
          :key="txs[n - 1].hash"
        />
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
// import api from '../services/api'
// import { getLockScriptFromAddress } from '../services/ckb/utils'
// import { scriptToHash } from '@nervosnetwork/ckb-sdk-utils'
const LIMIT = 5
export default {
  name: 'TxCard',
  components: { TxItem },
  data() {
    return {
      limit: LIMIT
    }
  },
  computed: {
    ...mapGetters('account', {
      txs: 'txsGetter',
      address: 'addressGetter',
      loadingTXs: 'loadingTXsGetter'
    })
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
      this.$store.dispatch('account/LOAD_TXS', { size: this.limit, quiet })
    }
  },
  watch: {
    address(address) {
      this.loadTXs(address)
    }
  }
}
</script>
