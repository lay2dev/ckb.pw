<template>
  <q-card square class="q-mb-sm items-center">
    <q-card-section class="row justify-around">
      <div class="row items-center">
        <small> English </small>
        <q-toggle
          v-model="lang"
          icon="language"
          true-value="zh-cn"
          false-value="en-us"
          color="grey-7"
        />
        <small> 中文 </small>
      </div>
      <q-separator spaced inset vertical />
      <div class="row">
        <q-btn
          flat
          icon="apps"
          class="full-width"
          :label="$t('label_dapps')"
          to="/explore"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script>
export default {
  name: 'DashCard',
  data() {
    return {
      lang: this.$i18n.locale
    }
  },
  watch: {
    lang(lang) {
      this.$i18n.locale = lang
    }
  }
}
</script>
