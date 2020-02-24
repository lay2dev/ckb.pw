<template>
  <q-page class="column q-gutter-sm" padding>
    <q-card class="card-dao text-white">
      <q-card-section @click="$router.push({ name: 'dao' })">
        <div class="text-h6">Nervos DAO</div>
        <div class="text-caption">
          {{ $t('label_locked') + ': ' + locked + ' CKB' }}
        </div>
        <div class="text-caption row q-gutter-sm">
          <span>{{ $t('label_apc') + ': ' + apc }} %</span>
          <span>{{ $t('label_revenue') + ': ' + revenue }} CKB</span>
        </div>
      </q-card-section>
    </q-card>
    <!-- <q-card class="card-dao-plus text-white">
      <q-card-section>
        <div class="text-h6">Nervos DAO +</div>
        <div class="text-subtitle2">
          {{ $t('label_locked') + ': ' + locked + ' CKB' }}
        </div>
        <div class="text-subtitle2 row q-gutter-sm">
          <span>{{ $t('label_apc') + ': ' + apc }}</span>
          <span>{{ $t('label_revenue') + ': ' + revenue }}</span>
        </div>
      </q-card-section>
    </q-card> -->
  </q-page>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  name: 'Explore',
  data() {
    return {}
  },
  computed: {
    ...mapGetters('account', {
      address: 'addressGetter'
    }),
    ...mapGetters('dao', {
      locked: 'lockedGetter',
      apc: 'apcGetter',
      revenue: 'revenueGetter'
    })
  },
  mounted() {
    this.$nextTick(() => {
      if (this.address.length) {
        this.$store.dispatch('dao/LOAD_LIST', { address: this.address })
      }
    })
  },
  watch: {
    address(address) {
      this.$store.dispatch('dao/LOAD_LIST', { address })
    }
  }
}
</script>
<style lang="scss" scoped>
.card-dao {
  background: linear-gradient(
    to right top,
    darken($ckb-green, 15%),
    $ckb-green
  );
}
.card-dao-plus {
  background: linear-gradient(to right top, $dark, $eth-gray);
}
</style>
