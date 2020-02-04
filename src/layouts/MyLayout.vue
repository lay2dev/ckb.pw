<template>
  <q-layout view="lHh Lpr lFf">
    <q-header v-if="showHeader" elevated class="bg-dark header">
      <q-bar v-if="showBar && !isX" dense class="bg-dark text-white" />
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
    <q-page-container class="container">
      <router-view />
    </q-page-container>
    <!-- <q-footer v-if="showFooter" elevated class="bg-dark footer">
      <q-tabs align="justify" narrow-indicator>
        <q-route-tab to="/" exact :label="$t('tab_account')" />
        <q-route-tab to="/explore" exact :label="$t('tab_explore')" />
      </q-tabs>
    </q-footer> -->
  </q-layout>
</template>

<script>
import { mapGetters } from 'vuex'
import { init, getAccount, loadDeps } from '../services/chain'
import vConsole from 'vconsole'
export default {
  name: 'MyLayout',

  data() {
    return {
      isHome: true,
      isX: false,
      showHeader: true,
      showFooter: true,
      tab: 'account'
    }
  },
  computed: {
    ...mapGetters('config', {
      showBar: 'showBarGetter',
      // showHeader: 'showHeaderGetter',
      // showFooter: 'showFooterGetter',
      barHeight: 'barHeightGetter'
    })
  },
  created: function() {
    if (this.$route.query.ctl == 5) {
      new vConsole()
      console.log('vConsole loaded')
    }

    // detecting locale
    this.$i18n.locale = this.$q.lang.getLocale()

    window.addEventListener('load', async () => {
      await init(this)
      console.log('inited')

      const header = document.querySelector('.header')
      // const footer = document.querySelector('.footer')
      let topOffset = parseInt(
        getComputedStyle(header).paddingTop.split('px')[0]
      )
      // let bottomOffset = parseInt(
      //   getComputedStyle(footer).paddingBottom.split('px')[0]
      // )
      let barHeight = this.barHeight

      if (topOffset) {
        this.isX = true
        barHeight = 0
      }

      this.$store.commit('config/UPDATE', {
        barHeight,
        topOffset
        // bottomOffset
      })
      // console.log(this.isX, topOffset, bottomOffset, barHeight)

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
      this.isHome = newVal === '/account'
      // this.showFooter = newVal !== '/txs'
      // console.log('show footer', this.showFooter)
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
<style lang="scss" scoped>
.header {
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
}
// .container {
//   padding-bottom: constant(safe-area-inset-bottom);
//   padding-bottom: env(safe-area-inset-bottom);
// }
</style>
