<template>
  <q-form ref="form">
    <q-list bordered separator>
      <q-slide-item
        v-for="(output, index) in outputs"
        @right="({ reset }) => registerDelete(index, reset)"
        :key="index"
      >
        <template v-slot:right>
          <q-icon name="delete" />
        </template>
        <div class="column q-pa-sm q-gutter-xs">
          <q-input
            filled
            dense
            clearable
            clear-icon="close"
            no-error-icon
            debounce="300"
            v-model="output.address"
            :label="$t('label_address')"
            :hint="$t('hint_address')"
            :rules="rules('address')"
            @input="validate"
            lazy-rules
          >
            <template v-slot:append>
              <q-btn dense flat icon="crop_free" @click="scanQR(index)" />
            </template>
          </q-input>
          <q-input
            type="number"
            filled
            dense
            clearable
            clear-icon="close"
            no-error-icon
            debounce="500"
            v-model="output.amount"
            :label="$t('label_amount')"
            suffix="CKB"
            :hint="`${$t('hint_amount')} ${MIN_AMOUNT} CKB`"
            :rules="rules('amount')"
            @input="validate"
            lazy-rules
          />
        </div>
      </q-slide-item>
    </q-list>
    <q-btn
      push
      ripple
      class="full-width q-ma-xs"
      :color="outputsReady ? 'primary' : 'grey-2'"
      :text-color="outputsReady ? 'white' : 'grey-6'"
      icon="add"
      :disable="!outputsReady"
      @click="addOutput"
    />
    <q-dialog v-model="confirmDelete" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="error" text-color="warning" />
          <h6 class="q-ml-sm">{{ $t('msg_confirm_delete') }}</h6>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            ripple
            :label="$t('btn_cancel')"
            color="error"
            @click="deletion.reset && deletion.reset()"
            v-close-popup
          />
          <q-btn
            ripple
            :label="$t('btn_confirm')"
            color="primary"
            @click="deleteOutput()"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-form>
</template>

<script>
import { mapGetters } from 'vuex'
import { sleep, verifyAddress } from '../services/utils'
import BN from 'bn.js'
export default {
  name: 'OutputsForm',
  props: ['outputs', 'outputsReady'],
  data() {
    return {
      confirmDelete: false,
      deletion: {
        index: 0,
        reset: null
      }
    }
  },
  computed: {
    ...mapGetters('account', {
      MIN_AMOUNT: 'minAmountGetter'
    })
  },
  methods: {
    async scanQR(index) {
      if (window.ethereum.isImToken) {
        // eslint-disable-next-line no-undef
        let address = await imToken.callPromisifyAPI('native.scanQRCode')
        console.log('scaned address:', address)

        // check if is eth address
        let ethAddress = address.match(/0x[a-fA-F0-9]{40}/)
        ethAddress && (address = ethAddress[0])

        // check if is ckb address
        let ckbAddress = address.match(/ck[bt]1.{91}/)
        !ckbAddress && (ckbAddress = address.match(/ck[bt]1.{42}/))
        ckbAddress && (address = ckbAddress[0])

        console.log('address:', address)
        let output = { ...this.outputs[index], address }
        this.$set(this.outputs, index, output)
      }
    },
    registerDelete(index, reset) {
      this.deletion.index = index
      this.deletion.reset = reset
      this.confirmDelete = true
    },
    async addOutput() {
      this.outputs.push({})
      // this.outputsReady = false
      await this.validate()
      this.$refs.form.resetValidation()
    },
    async deleteOutput() {
      this.outputs.splice(this.deletion.index, 1)
      this.deletion.reset && this.deletion.reset()
      await this.validate()
      this.$refs.form.resetValidation()
    },
    resetOutputs() {
      this.$emit('update:outputsReady', false)
      this.$refs.form.resetValidation()
    },
    rules(which) {
      const rule_not_empty = val => !!val || this.$t('msg_field_required')
      const rule_is_valid_address = val =>
        !!verifyAddress(val) || this.$t('msg_invalid_address')
      const rule_min_amount = val =>
        new BN(val).gte(new BN(this.MIN_AMOUNT)) ||
        this.$t('label_min_amount') + ': ' + this.MIN_AMOUNT + ' CKB'

      switch (which) {
        case 'address':
          return [rule_not_empty, rule_is_valid_address]
        case 'amount':
          return [rule_not_empty, rule_min_amount]
      }
      return []
    },
    async validate() {
      await sleep(100)
      let res = await this.$refs.form.validate()
      this.$emit('update:outputsReady', res)
    }
  }
}
</script>
