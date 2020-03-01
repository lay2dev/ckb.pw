import GTM from '../components/gtm'

export default ({ router }) => {
  router.afterEach(to => {
    GTM.logPage(to.path)
  })
}
