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
export default {
  name: 'MyLayout',

  data() {
    return {
      isHome: true
    }
  },
  watch: {
    '$route.path': function(newVal) {
      this.isHome = newVal === '/'
    }
  }
}
</script>
