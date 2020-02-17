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
    <q-footer v-if="showFooter" class="footer" />
  </q-layout>
</template>

<script>
import { mapGetters } from 'vuex'
import { init } from '../services/chain'
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
      showFooter: 'showFooterGetter',
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
