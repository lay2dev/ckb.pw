<template>
  <q-card id="metaCard" square class="q-mb-sm">
    <q-card-section class="q-pa-sm">
      <div class="row">
        <div class="col column">
          <div class="row justify-between items-center q-gutter-xs">
            <q-select
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
            <!-- <div class="text-grey">{{ $t('label_for') }}</div> -->
            <q-select
              v-model="ckbAmount"
              :options="amountList"
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
    <q-card-actions class="q-pa-xs" align="evenly">
      <q-btn
        class="full-width col"
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
import { getBalance, sendAssets } from '../services/eth/core'
import { mapGetters } from 'vuex'
import web3Utils from 'web3-utils'
export default {
  name: 'SwapCard',
  data() {
    return {
      config: {},
      ckbAmount: 1000,
      right: {},
      amountList: [200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000],
      tokenList: []
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
    this.config = await api.getSwapConfig()
    this.tokenList = this.config.tokenList
    await this.updateRate()
    this.right = this.tokenList[0]
    this.timer && clearInterval(this.timer)
    this.timer = setInterval(() => {
      this.updateRate()
    }, 5000)
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
          const balance = web3Utils.fromWei(hexBalance)
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
      console.log('[SwapCard] tx sent: ', txHash)
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
