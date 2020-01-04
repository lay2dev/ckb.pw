<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>
          <center>{{ $t('title') }}</center>
        </q-toolbar-title>
      </q-toolbar>
      <q-btn
        v-if="!isHome"
        flat
        dense
        icon="chevron_left"
        class="absolute-left q-mx-sm"
        @click="$router.back()"
      />
    </q-header>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { getEthAddress } from '../services/eth'
export default {
  name: 'MyLayout',

  data() {
    return {
      isHome: true
    }
  },
  async mounted() {
    const address = await getEthAddress()
    if (address) {
      this.$store.commit('account/SET_PLATFORM', 'eth')
      this.$store.commit('account/SET_ADDRESS', address)
    }
    this.isHome = this.$route.path === '/'
  },
  watch: {
    '$route.path': function(newVal) {
      console.log('route: ', newVal)
      this.isHome = newVal === '/'
    }
  }
}
</script>
