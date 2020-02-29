<template>
  <div id="q-app">
    <router-view />
  </div>
</template>

<script>
import vConsole from 'vconsole'
import moment from 'moment'
import { initProvider } from './services/provider'
import { initPW, setPlatform } from './services/ckb/core'
import { initETHProvider } from './services/eth/core'

// const CKB_NODE = 'https://aggron.ckb.dev'
// const CKB_NODE = 'http://w.yamen.co:8114'
const CKB_NODE = 'http://39.99.211.143:8116/'

export default {
  name: 'App',
  async created() {
    // vConsole
    if (localStorage.getItem('vconsole') === 'on') new vConsole()

    // init pw
    await initPW(CKB_NODE)

    // detecting locale
    this.$i18n.locale = this.$q.lang.getLocale()

    // Moment
    moment.updateLocale('en', momentConfig)

    const config = initProvider()
    this.$store.commit('config/UPDATE', config)

    // try ethereum
    const ethAddress = await initETHProvider(address => {
      this.$store.commit('account/SET_ADDRESS', address)
    })
    if (ethAddress) {
      this.$store.commit('account/SET_PLATFORM', 'eth')
      this.$store.commit('account/SET_ADDRESS', ethAddress)
      setPlatform({ provider: config.provider, chain: 'eth' })
    }
  }
}
const momentConfig = {
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
}
</script>
