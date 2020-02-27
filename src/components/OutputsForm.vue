<template>
  <q-form ref="form" no-error-focus>
    <q-list bordered separator>
      <q-item
        class="q-pa-sm"
        v-for="(v, index) in $v.outputs.$each.$iter"
        :key="index"
      >
        <div class="column col">
          <q-input
            class="q-mb-xs"
            dense
            filled
            clearable
            clear-icon="close"
            no-error-icon
            v-model.trim="v.address.$model"
            :placeholder="$t('label_address')"
            :error="v.address.$error"
            hide-bottom-space
          >
            <template v-slot:append>
              <q-btn dense flat icon="crop_free" @click="scanQR(index)" />
            </template>
            <template v-slot:error>
              <div v-if="!v.address.validAddress">
                {{ $t('msg_invalid_address') }}
              </div>
            </template>
          </q-input>
          <q-field
            dense
            filled
            clearable
            clear-icon="close"
            no-error-icon
            v-model.trim.lazy="v.amount.$model"
            :placeholder="$t('label_amount')"
            :error="v.amount.$error"
            hide-bottom-space
            @clear="v.amount.$model = 0"
          >
            <template v-slot:error>
              <div v-if="!v.amount.minCapacity">
                {{ `${$t('label_min_amount')}: ${MIN_AMOUNT} CKB` }}
              </div>
              <div v-if="!v.amount.enoughBalance">
                {{ $t('msg_broke') }}
              </div>
            </template>
            <template v-slot:control="{ floatingLabel, value, emitValue }">
              <money
                class="q-field__input text-right"
                :value="value"
                @input="emitValue"
                v-bind="money"
                v-show="floatingLabel"
              />
            </template>
          </q-field>
        </div>
        <q-item-section class="q-pl-sm" side v-if="deleteMode">
          <q-btn flat dense round icon="delete" @click="deleteOutput(index)" />
        </q-item-section>
      </q-item>
    </q-list>
    <div class="row justify-between">
      <q-btn
        push
        ripple
        class="col-2 q-ma-xs"
        :color="outputs.length <= 1 ? 'grey-2' : 'white'"
        :text-color="outputs.length <= 1 ? 'grey-6' : 'dark'"
        icon="edit"
        :disable="outputs.length <= 1"
        @click="deleteMode = !deleteMode"
      />
      <q-btn
        push
        ripple
        class="col q-ma-xs"
        :color="valid ? 'primary' : 'grey-2'"
        :text-color="valid ? 'white' : 'grey-6'"
        icon="add"
        :disable="!valid"
        @click="addOutput"
      />
    </div>
  </q-form>
</template>

<script>
import { mapGetters } from 'vuex'
import ABCWallet from 'abcwallet'
import { Money } from 'v-money'
import {
  validAddress,
  minCapacity,
  enoughBalance
} from '../services/validation'
import { sleep } from '../services/utils'

export default {
  name: 'OutputsForm',
  props: ['outputs', 'broke', 'outputsReady'],
  components: { Money },
  data() {
    return {
      deleteMode: false,
      money: {
        precision: 0,
        thousands: ',',
        suffix: ' CKB'
      }
    }
  },
  computed: {
    ...mapGetters('account', {
      MIN_AMOUNT: 'minAmountGetter'
    }),
    ...mapGetters('config', {
      provider: 'providerGetter'
    }),
    valid() {
      return !this.$v.$invalid
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.resetOutputs()
    })
  },
  methods: {
    async scanQR(index) {
      let address = ''
      if (this.provider === 'ImToken') {
        address = await window.imToken.callPromisifyAPI('native.scanQRCode')
      } else if (this.provider === 'ABCWallet') {
        const { text } = await ABCWallet.webview.invokeQRScanner()
        address = text
      }
      console.log(`[${this.provider}] scaned address:`, address)

      // check if is eth address
      let ethAddress = address.match(/0x[a-fA-F0-9]{40}/)
      ethAddress && (address = ethAddress[0])

      // check if is ckb address
      let ckbAddress = address.match(/ck[bt]1.{91}/)
      !ckbAddress && (ckbAddress = address.match(/ck[bt]1.{42}/))
      ckbAddress && (address = ckbAddress[0])

      console.log('address:', address)
      // let output = { ...this.outputs[index], address }
      // this.$set(this.outputs, index, output)
      this.outputs[index].address = address
    },
    async addOutput() {
      this.outputs.push({ address: null, amount: 0 })
      await sleep(10)
      this.$v.$reset()
    },
    deleteOutput(index) {
      this.outputs.splice(index, 1)
      this.deleteMode = false
    },
    resetOutputs() {
      this.outputs.splice(0)
      this.addOutput()
    }
  },
  watch: {
    valid(valid) {
      this.$emit('update:outputsReady', valid)
      console.log('[valid]', valid)
    }
  },
  validations: {
    outputs: {
      $each: {
        address: {
          validAddress
        },
        amount: {
          minCapacity,
          enoughBalance
        }
      }
    }
  }
}
</script>
