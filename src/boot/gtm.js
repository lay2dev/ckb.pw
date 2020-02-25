import gtm from 'src/components/gtm'

export default ({ router }) => {
  router.afterEach(to => {
    gtm.logPage(to.path)
  })
}
