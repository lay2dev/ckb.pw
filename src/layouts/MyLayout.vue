<template>
  <q-layout view="lHh Lpr lFf">
    <q-header reveal elevated class="bg-dark">
      <q-toolbar>
        <q-toolbar-title>
          <center>
            <div>{{ $t('title') }}</div>
          </center>
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
    <q-footer elevated class="bg-dark">
      <q-tabs align="justify" narrow-indicator>
        <q-route-tab to="/" exact :label="$t('tab_account')" />
        <q-route-tab to="/explore" exact :label="$t('tab_explore')" />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script>
import { getEthAddress, loadDeps } from '../services/chain'
export default {
  name: 'MyLayout',

  data() {
    return {
      isHome: true,
      tab: 'account'
    }
  },
  async mounted() {
    const address = await getEthAddress(this)
    if (address) {
      this.$store.commit('account/SET_PLATFORM', 'eth')
      this.$store.commit('account/SET_ADDRESS', address)
    }
    this.isHome =
      this.$route.path === '/account' || this.$route.path === '/explore'
    await loadDeps()
  },
  watch: {
    '$route.path': function(newVal) {
      // console.log('route: ', newVal)
      this.isHome = newVal === '/account' || newVal === '/explore'
    }
  }
}
</script>
