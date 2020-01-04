<template>
  <q-page class="flex">
    <q-tab-panels
      class="fit"
      v-model="tab"
      animated
      transition-prev="scale"
      transition-next="scale"
    >
      <q-tab-panel class="bg-grey" name="account">
        <q-card class="q-mb-xs">
          <q-card-section :class="`${platform}-card-bg`" class="text-white">
            <div class="balance-text">{{ capacity.total }} CKB</div>
            <div class="text-caption">{{ address }}</div>
          </q-card-section>
          <q-card-actions align="around">
            <q-btn flat @click="receiveDialog = true">
              {{ $t('btn_receive') }}
            </q-btn>
            <q-btn flat to="send"> {{ $t('btn_transfer') }} </q-btn>
          </q-card-actions>
        </q-card>
        <q-dialog v-model="receiveDialog">
          <q-card>
            <q-card-section class="no-scroll column items-center">
              <vue-qr :text="address" :size="200" />
              <div class="text-center address-in-dialog">
                <p>{{ address }}</p>
              </div>
            </q-card-section>
            <q-card-actions>
              <q-btn
                class="full-width"
                color="primary"
                :label="$t('btn_copy')"
                @click="copyAddress"
              />
            </q-card-actions>
          </q-card>
        </q-dialog>
      </q-tab-panel>
      <q-tab-panel class="bg-orange" name="explore">
        <h1>explore</h1>
      </q-tab-panel>
    </q-tab-panels>
    <q-tabs
      class="fixed-bottom bg-blue"
      v-model="tab"
      align="justify"
      narrow-indicator
    >
      <q-tab name="account" :label="$t('tab_account')" />
      <q-tab name="explore" :label="$t('tab_explore')" />
    </q-tabs>
  </q-page>
</template>

<script>
import { mapState } from 'vuex'
import VueQr from 'vue-qr'
import { copyToClipboard } from 'quasar'
export default {
  name: 'PageIndex',
  components: {
    VueQr
  },
  data() {
    return {
      tab: 'account',
      receiveDialog: false
    }
  },
  computed: {
    ...mapState('account', {
      address: 'address',
      capacity: 'capacity',
      platform: 'platform'
    })
  },
  methods: {
    async copyAddress() {
      await copyToClipboard(this.address)
      this.$q.notify({
        message: this.$t('msg_copy_success'),
        position: 'center',
        icon: 'check',
        timeout: 1000
      })
    }
  },
  async mounted() {}
}
</script>

<style lang="scss" scoped>
.eth-card-bg {
  background-color: $eth-gray;
}
.ckb-card-bg {
  background-color: $ckb-green;
}
.balance-text {
  font-size: 1.5em;
}
.address-in-dialog {
  width: 200px;
  word-break: break-word;
}
</style>
