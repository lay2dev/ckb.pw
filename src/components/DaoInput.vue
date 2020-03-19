<template>
  <q-card square>
    <q-card-section>
      <q-field
        class="q-mt-md amount-text"
        filled
        clearable
        clear-icon="close"
        no-error-icon
        v-model.trim.lazy="$v._amount.$model"
        bottom-slots
        :error="!!$v._amount.$model && $v._amount.$error"
        @clear="$v._amount.$model = 0"
      >
        <template v-slot:hint>
          <div>
            {{ `${$t('hint_available')}: ${displayCKB(rawBalance)} CKB` }}
          </div>
        </template>
        <template v-slot:error>
          <div v-if="!$v._amount.minCapacity">
            {{ $t('msg_dao_min_amount') }}
          </div>
          <div v-if="!$v._amount.enoughBalance">
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
    </q-card-section>
  </q-card>
</template>

<script>
import { mapGetters } from 'vuex'
import { toCKB } from '../services/ckb/utils'
import { Money } from 'v-money'
import { minDaoCapacity, enoughBalance } from '../services/validation'

const MIN_DAO_AMOUNT = 102

export default {
  name: 'DaoInput',
  props: ['amount', 'ready'],
  components: { Money },
  data() {
    return {
      money: {
        precision: 0,
        thousands: ',',
        suffix: ' CKB'
      },
      MIN_DAO_AMOUNT: MIN_DAO_AMOUNT
    }
  },
  computed: {
    ...mapGetters('account', {
      rawBalance: 'balanceGetter'
    }),
    _amount: {
      get() {
        return this.amount
      },
      set(val) {
        if (val == null) val = 0
        this.$emit('update:amount', val)
      }
    },
    _ready() {
      return !this.$v.$invalid
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.$v.$reset()
    })
  },
  methods: {
    displayCKB(amount) {
      return toCKB(amount)
    }
  },
  watch: {
    _ready(ready) {
      this.$emit('update:ready', ready)
      console.log('[DaoInput] ready', ready)
    }
  },
  validations: {
    _amount: {
      minDaoCapacity,
      enoughBalance
    }
  }
}
</script>
<style lang="scss" scoped>
.amount-text {
  font-size: 1.5em;
}
</style>
