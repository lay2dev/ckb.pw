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
import { init, getAccount, loadDeps } from '../services/chain'
import vConsole from 'vconsole'
export default {
  name: 'MyLayout',

  data() {
    return {
      isHome: true,
      tab: 'account'
    }
  },
  created: function() {
    if (this.$route.query.ctl == 5) {
      new vConsole()
      console.log('vConsole loaded')
    }
    window.addEventListener('load', async () => {
      await init()
      console.log('inited')
      let address = await getAccount(this)
      console.log('loaded address', address)

      this.$store.commit('account/SET_PLATFORM', 'eth')
      this.$store.commit('account/SET_ADDRESS', address)
      await loadDeps()
    })
  },
  mounted: function() {
    this.isHome =
      this.$route.path === '/account' || this.$route.path === '/explore'
  },
  watch: {
    '$route.path': function(newVal) {
      this.isHome = newVal === '/account' || newVal === '/explore'
    }
  }
}

/* init zone */
// moments
import moment from 'moment'
moment.updateLocale('en', {
  relativeTime: {
    future: 'in %s',
    past: '%s ago',
    s: 'seconds',
    ss: '%ds',
    m: '1m',
    mm: '%dm',
    h: '1h',
    hh: '%dh',
    d: '1d',
    dd: '%dd',
    M: '1m',
    MM: '%dm',
    y: 'a year',
    yy: '%d years'
  }
})
</script>
