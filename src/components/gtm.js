/* eslint-disable prettier/prettier */
import { uid } from 'quasar'

export default {
  logEvent(e) {
    const { category, action, label, value } = e
    // eslint-disable-next-line no-undef
    dataLayer.push({
      'event': 'customEvent',
      'category': category,
      'action': action,
      'label': label,
      'value': value,
      'cid': this.getCid()
    })
    console.log('[GTM Event]', e)
  },

  logPage(path) {
    // Here you can preprocess the path, if needed
    // eslint-disable-next-line no-undef
    dataLayer.push({
      'event': 'customPageView',
      'path': path,
      'cid': this.getCid()
    })
  },

  getCid() {
    // We need an unique identifier for this session
    // We store it in a localStorage, but you may use cookies, too
    if (!localStorage.cid) {
      localStorage.cid = uid()
    }
    return localStorage.cid
  }
}
