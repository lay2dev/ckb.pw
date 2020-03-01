<template>
  <q-layout view="lHh Lpr lFf">
    <q-header v-if="showHeader" elevated class="bg-black text-primary header">
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
    <!-- <q-footer v-if="showFooter" class="footer" /> -->
  </q-layout>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  name: 'MyLayout',

  data() {
    return {
      isHome: true,
      tab: 'account'
    }
  },
  computed: {
    ...mapGetters('config', {
      showHeader: 'showHeaderGetter'
    })
  },
  mounted: function() {
    this.isHome = this.$route.path === '/account'
  },
  watch: {
    '$route.path': function(newVal) {
      this.isHome = newVal === '/account'
    }
  }
}
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
