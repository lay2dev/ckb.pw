<template>
  <q-page id="view" class="bg-grey column q-pa-sm no-scroll">
    <q-card id="metaCard" square class="q-mb-sm">
      <q-card-section
        @click="loadBalance()"
        :class="`${platform}-card-bg`"
        class="text-white"
      >
        <div v-if="loadingBalance" class="balance-text-int text-blue-grey-4">
          {{ $t('label_loading') }}
        </div>
        <div v-else class="row items-baseline">
          <div class="balance-text-int">
            {{ displayBalance(balance)[0] }}
          </div>
          <div
            v-if="displayBalance(balance)[1]"
            class="balance-text-dig text-blue-grey-2"
          >
            {{ '.' + displayBalance(balance)[1] }}
          </div>
          <div class="text-h6 text-blue-grey-2 q-ml-sm">
            CKB
          </div>
        </div>
        <div class="text-caption">{{ address }}</div>
      </q-card-section>
      <q-card-actions dense align="evenly">
        <q-btn flat class="full-width col" @click="receiveDialog = true">
          {{ $t('btn_receive') }}
        </q-btn>
        <q-separator vertical inset />
        <q-btn flat class="full-width col" to="send">
          {{ $t('btn_transfer') }}
        </q-btn>
      </q-card-actions>
    </q-card>
    <tx-list :height="listHeight" :txs="txs" />
    <q-dialog v-model="receiveDialog">
      <q-card>
        <q-card-section class="no-scroll column items-center">
          <vue-qr :text="chosenAddress" :size="200" />
          <div class="text-center address-in-dialog">
            <p>{{ chosenAddress }}</p>
          </div>
          <q-btn-toggle
            no-caps
            no-wrap
            size="sm"
            v-model="showFullAddress"
            toggle-color="dark"
            :options="[
              { label: 'ETH Address', value: false },
              { label: 'CKB Full Address', value: true }
            ]"
          >
          </q-btn-toggle>
        </q-card-section>
        <q-card-actions>
          <q-btn
            class="full-width"
            color="primary"
            :label="$t('btn_copy')"
            @click="copyAddress"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { mapGetters } from 'vuex'
import VueQr from 'vue-qr'
import TxList from '../components/TxList'
import { copyToClipboard, dom } from 'quasar'
import { getFullAddress } from '../services/chain'
import { toCKB } from '../services/utils'

export default {
  name: 'PageIndex',
  components: {
    VueQr,
    TxList
  },
  data() {
    return {
      tab: 'account',
      viewHeight: 0,
      cardHeight: 0,
      receiveDialog: false,
      showFullAddress: false,
      splitter: 10
    }
  },
  computed: {
    ...mapGetters('account', {
      balance: 'balanceGetter',
      address: 'addressGetter',
      loadingBalance: 'loadingBalanceGetter',
      platform: 'platformGetter',
      txs: 'txsGetter'
    }),
    ...mapGetters('config', {
      barHeight: 'barHeightGetter',
      topOffset: 'topOffsetGetter',
      bottomOffset: 'bottomOffsetGetter'
    }),
    listHeight() {
      const offset = 240 + this.topOffset + this.bottomOffset + this.barHeight
      console.log('offset', offset)
      try {
        let height = this.viewHeight - offset + 'px'
        return height
      } catch (e) {
        return 0
      }
    },
    chosenAddress() {
      return this.showFullAddress ? getFullAddress(this.address) : this.address
    }
  },
  methods: {
    async copyAddress() {
      try {
        console.log('to copy: ', this.chosenAddress)
        await copyToClipboard(this.chosenAddress)
      } catch (e) {
        if (window.ethereum.isImToken) {
          // eslint-disable-next-line no-undef
          imToken.callAPI('native.setClipboard', this.chosenAddress)
        } else {
          console.log(e) // long address not work on android
        }
      }
      this.$q.notify({
        message: this.$t('msg_copy_success'),
        position: 'center',
        icon: 'check',
        timeout: 1000
      })
    },
    displayBalance: balance => toCKB(balance).split('.'),
    async loadBalance() {
      this.$store.dispatch('account/LOAD_BALANCE')
    },
    async loadTXs(params) {
      this.$store.dispatch('account/LOAD_TXS', params)
    }
  },
  async mounted() {
    this.cardHeight = dom.height(document.getElementById('metaCard'))
    this.viewHeight = dom.height(document.getElementById('view'))
    await Promise.all([this.loadBalance(), this.loadTXs({})])
    this.$forceUpdate()
  },
  watch: {
    async address() {
      await Promise.all([this.loadBalance(), this.loadTXs({})])
    }
  }
}
</script>

<style lang="scss" scoped>
.q-card__actions {
  padding: 0;
}
.eth-card-bg {
  background: $meta-card-bg;
}
.ckb-card-bg {
  background-color: $ckb-green;
}
.balance-text-int {
  font-size: 2em;
}
.balance-text-dig {
  font-size: 0.8em;
}
.address-in-dialog {
  width: 200px;
  word-break: break-word;
}
</style>
