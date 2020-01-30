<template>
  <q-form ref="form">
    <q-list bordered separator>
      <!-- <q-slide-item v-if="outputs.length === 1">
        <tx-input
          :address.sync="outputs[0].address"
          :amount.sync="outputs[0].amount"
          :status.sync="outputs[0].status"
        />
      </q-slide-item> -->
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
              <q-btn dense flat icon="crop_free" @click="scanQR" />
            </template>
          </q-input>
          <q-input
            type="number"
            filled
            dense
            clearable
            clear-icon="close"
            no-error-icon
            debounce="300"
            v-model="output.amount"
            :label="$t('label_amount')"
            suffix="CKB"
            :hint="`${$t('hint_amount')} is ${MIN_AMOUNT} CKB`"
            :rules="rules('amount')"
            @input="validate"
            lazy-rules
          />
        </div>
      </q-slide-item>
    </q-list>
    <q-btn
      outline
      :ripple="false"
      class="full-width q-ma-xs"
      :text-color="canAddOutput ? 'primary' : 'grey'"
      icon="add"
      :disable="!canAddOutput"
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
            flat
            :label="$t('btn_cancel')"
            color="error"
            @click="deletion.reset && deletion.reset()"
            v-close-popup
          />
          <q-btn
            flat
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
  props: ['outputs'],
  data() {
    return {
      canAddOutput: false,
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
    }),
    _outputs: {
      get() {
        return this.outputs
      },
      set(val) {
        this.$emit('update:outputs', val)
      }
    }
  },
  methods: {
    async scanQR() {
      if (window.ethereum.isImToken) {
        // eslint-disable-next-line no-undef
        let address = await imToken.callPromisifyAPI('native.scanQRCode')
        address.startsWith('ethereum:') &&
          (address = address.split('ethereum:')[1])
        this.$emit('update:address', address)
      }
    },
    registerDelete(index, reset) {
      this.deletion.index = index
      this.deletion.reset = reset
      this.confirmDelete = true
    },
    async addOutput() {
      this._outputs.push({})
      // this.canAddOutput = false
      await this.validate()
      this.$refs.form.resetValidation()
    },
    async deleteOutput() {
      this._outputs.splice(this.deletion.index, 1)
      this.deletion.reset && this.deletion.reset()
      await this.validate()
      this.$refs.form.resetValidation()
    },
    resetOutputs() {
      this.canAddOutput = false
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
    async validate(val) {
      await sleep(100)
      this.canAddOutput = await this.$refs.form.validate()
      console.log('input', val)
      console.log('valid', this.canAddOutput)
    }
  }
}
</script>
