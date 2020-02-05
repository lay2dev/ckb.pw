<template>
  <q-layout view="lHh Lpr lFf">
    <q-header v-if="showHeader" elevated class="bg-black text-primary header">
      <q-bar v-if="showBar && !isX" dense class="bg-black text-white" />
      <q-toolbar>
        <q-toolbar-title>
          <center>
            <!-- <small>{{ $t('title') }}</small> -->
            <small> CKB P-Wallet </small>
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
      <router-view class="app" />
    </q-page-container>
    <q-footer class="footer" />
  </q-layout>
</template>

<script>
import { mapGetters } from 'vuex'
import { init, getAccount, loadDeps } from '../services/chain'
import { sleep } from '../services/utils'
import vConsole from 'vconsole'
export default {
  name: 'MyLayout',

  data() {
    return {
      isHome: true,
      isX: false,
      tab: 'account'
    }
  },
  computed: {
    ...mapGetters('config', {
      showBar: 'showBarGetter',
      showHeader: 'showHeaderGetter',
      barHeight: 'barHeightGetter'
    })
  },
  created: function() {
    if (this.$route.query.ctl == 5) {
      new vConsole()
      console.log('vConsole loaded')
    }
  },
  mounted: function() {
    this.isHome = this.$route.path === '/account'
    this.$nextTick(async () => {
      await init(this)
      let address = await getAccount(this)
      console.log('loaded address', address)

      this.$store.commit('account/SET_PLATFORM', 'eth')
      this.$store.commit('account/SET_ADDRESS', address)

      await loadDeps()
    })

    sleep(250).then(() => {
      const header = document.querySelector('.header')
      let topOffset = parseInt(
        getComputedStyle(header).paddingTop.split('px')[0]
      )
      let barHeight = this.barHeight
      let showBar = this.showBar

      if (topOffset) {
        this.isX = true
        showBar = false
        barHeight = 0
      }

      console.log('interface params: ', topOffset, this.isX, showBar)

      this.$store.commit('config/UPDATE', {
        showBar,
        barHeight,
        topOffset
      })
    })
  },
  watch: {
    '$route.path': function(newVal) {
      this.isHome = newVal === '/account'
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
// .header {
//   padding-top: constant(safe-area-inset-top);
//   padding-top: env(safe-area-inset-top);
// }
.footer {
  background-color: $grey-4;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
