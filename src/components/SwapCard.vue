<!-- 
A card UI component for user to exchange CKBytes with Ethereum assets such as ETH or USDT. More ethereum tokens will be supported in the future.
The exchange rate is the realtime rate from HUOBI pro exchange.
The swap process is as follows:
1. User choose the demanded quantities of CKBytes. the corresponding number of ethereum assets will be calculated immediately.
2. User send the corresponding ethereum assets to specific ethereum address of Lay2 from user's ethereume wallet.
3. After Lay2 received the ethereum assets, Lay2 will send user demanded quantities of CKBytes to user. The CKBytes is locked by pw-lock script with user's ethereum address as lock args.
-->
<template>
  <q-card id="metaCard" square class="q-mb-sm">
    <q-card-section class="q-pa-sm">
      <div class="row">
        <div class="col column">
          <div class="row justify-between items-center q-gutter-xs">
            <q-skeleton class="col" v-show="loading" type="QBtn" />
            <q-select
              v-show="!loading"
              v-model="right"
              :options="tokenList"
              :display-value="right ? right.symbol : '-'"
              dense
              options-dense
              filled
              behavior="menu"
            >
              <template v-slot:prepend>
                <q-avatar>
                  <img :src="getIcon(right)" />
                </q-avatar>
                <div class="q-ml-xs price-text">
                  {{ displayPrice() }}
                </div>
              </template>
              <template v-slot:option="scope">
                <q-item
                  class="q-pa-sm"
                  v-bind="scope.itemProps"
                  v-on="scope.itemEvents"
                >
                  <q-item-section avatar>
                    <q-img :src="getIcon(scope.opt)" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label v-html="scope.opt.symbol" />
                    <q-item-label caption>
                      {{ $t('label_balance') + ': ' + scope.opt.balance }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-separator />
              </template>
            </q-select>
            <q-icon name="las la-exchange-alt" />
            <q-skeleton class="col" v-show="loading" type="QBtn" />
            <q-select
              v-show="!loading"
              v-model="ckbAmount"
              :options="config.swapCKBAmountList"
              :display-value="ckbAmount + ' CKB'"
              dense
              options-cover
              options-dense
              filled
              behavior="menu"
            />
          </div>
        </div>
        <div class="row items-center q-gutter-xs"></div>
      </div>
    </q-card-section>
    <q-separator />

    <q-slide-transition>
      <div v-show="showFeeDetails">
        <q-card-section class="text-subitle2">
          {{ $t('msg_fee_details') }}
        </q-card-section>
        <q-separator />
      </div>
    </q-slide-transition>
    <q-card-actions class="q-pa-xs" align="between">
      <q-btn
        class="col"
        flat
        dense
        :label="$t('btn_fee_details')"
        :icon-right="
          showFeeDetails ? 'keyboard_arrow_up' : 'keyboard_arrow_down'
        "
        @click="showFeeDetails = !showFeeDetails"
      />
      <q-separator inset vertical />
      <q-btn
        class="col-7"
        flat
        dense
        :label="$t('label_one_key_swap')"
        @click="swap"
      />
    </q-card-actions>
  </q-card>
</template>

<script>
import api from '../services/api'
import { getBalance, sendAssets, DecimalMap } from '../services/eth/core'
import { mapGetters } from 'vuex'
import web3Utils from 'web3-utils'
export default {
  name: 'SwapCard',
  data() {
    return {
      loading: false,
      config: {},
      ckbAmount: 1000,
      right: {},
      showFeeDetails: false,
      tokenList: [],
      pendingList: []
    }
  },
  computed: {
    ...mapGetters('account', {
      address: 'addressGetter'
    }),
    price() {
      return this.ckbAmount / this.right?.rate
    }
  },
  async created() {
    this.loading = true
    const rets = await Promise.all([
      api.getSwapConfig(),
      this.address && api.getSwapList(this.address)
    ])
    this.config = rets[0]
    this.pendingList = rets[1]
    this.tokenList = this.config.tokenList
    this.updateRate()
    this.right = this.tokenList[0]
    this.timer && clearInterval(this.timer)
    this.timer = setInterval(async () => {
      this.updateRate()
      this.pendingList = api.getSwapList(this.address)
    }, 5000)
    this.loading = false
  },
  destroyed() {
    this.timer && clearInterval(this.timer)
  },
  methods: {
    getIcon(token) {
      return `../statics/${token?.symbol?.toLowerCase()}.svg`
    },
    displayPrice() {
      const digits = this.right?.symbol === 'USDT' ? 2 : 4
      return Number(this.price).toFixed(digits)
    },
    async updateRate() {
      const rates = await api.getSwapRate()
      const ckbRate = rates.find(r => r.symbol === 'CKB')
      for (let i = 0; i < this.tokenList.length; i++) {
        const { price } = rates.find(r => r.symbol === this.tokenList[i].symbol)
        const rate = price / ckbRate.price
        this.tokenList[i] = { ...this.tokenList[i], rate }
      }
      this.right = this.tokenList.find(t => t.symbol === this.right?.symbol)
      // console.log('[update rate]', rates, this.right?.rate, this.price)
    },
    async updateBalance(address = this.address, tokenList = this.tokenList) {
      for (let i = 0; i < tokenList.length; i++) {
        try {
          const hexBalance = await getBalance(address, tokenList[i].address)
          const balance = web3Utils.fromWei(
            hexBalance,
            DecimalMap[tokenList[i].decimal]
          )
          console.log('balance', balance)
          this.tokenList[i] = { ...tokenList[i], balance }
        } catch (e) {
          console.log('[updateRate]', e.toString())
        }
      }
    },
    async swap() {
      const txHash = await sendAssets(
        this.address,
        this.config.depositEthAddress,
        this.price,
        this.right.address,
        this.right.decimal,
        this.config.chain
      )
      const ret = await api.submitPendingSwap({
        txHash,
        ckbAmount: this.ckbAmount,
        symbol: this.right.symbol,
        tokenAmount: this.price,
        fromAddress: this.address
      })
      console.log('[SwapCard] tx sent: ', txHash, ret)
    }
  },
  watch: {
    address(address) {
      console.log('[SwapCard] address changed: ', address)
      this.updateBalance(address, this.tokenList)
    },
    tokenList(tokenList) {
      console.log('[SwapCard] token list changed: ', tokenList)
      this.updateBalance(this.address, tokenList)
    }
  }
}
</script>
<style lang="scss" scoped>
.price-text {
  color: $dark;
  font-size: 14px;
}
</style>
