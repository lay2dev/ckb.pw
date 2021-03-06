<template>
  <div>
    <q-card id="metaCard" square class="q-mb-sm">
      <q-card-section
        @click="loadBalance()"
        :class="`eth-card-bg`"
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
        <div class="text-caption">{{ displayAddress(address) }}</div>
      </q-card-section>
      <q-card-actions align="evenly">
        <q-btn flat ripple class="full-width col" @click="receiveDialog = true">
          {{ $t('btn_receive') }}
        </q-btn>
        <q-separator vertical inset />
        <q-btn flat ripple class="full-width col" to="send">
          {{ $t('btn_transfer') }}
        </q-btn>
      </q-card-actions>
    </q-card>
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
  </div>
</template>
<script>
import { mapGetters } from 'vuex'
import { copyToClipboard } from 'quasar'
import { toCKB, getFullAddress, truncatedAddress } from '../services/ckb/utils'
import VueQr from 'vue-qr'
import ABCWallet from 'abcwallet'
export default {
  name: 'MetaCard',
  components: { VueQr },
  data() {
    return {
      receiveDialog: false,
      showFullAddress: false
    }
  },
  computed: {
    ...mapGetters('account', {
      balance: 'balanceGetter',
      address: 'addressGetter',
      loadingBalance: 'loadingBalanceGetter'
    }),
    ...mapGetters('config', {
      provider: 'providerGetter'
    }),
    chosenAddress() {
      return this.showFullAddress ? getFullAddress(this.address) : this.address
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.loadBalance()
    })
    this.timer && clearInterval(this.timer)
    this.timer = setInterval(() => {
      this.loadBalance(this.address, true)
    }, 5000)
  },
  destroyed() {
    this.timer && clearInterval(this.timer)
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
        } else if (this.provider === 'ABCWallet') {
          ABCWallet.webview.copy({ text: this.chosenAddress })
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
    displayAddress: address => truncatedAddress(address, 25),
    displayBalance: balance => toCKB(balance).split('.'),
    async loadBalance(address = this.address, quiet) {
      address &&
        this.$store.dispatch('account/LOAD_BALANCE', { address, quiet })
    }
  },
  watch: {
    address(address) {
      console.log('[MetaCard] address changed: ', address)
      this.loadBalance(address)
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
