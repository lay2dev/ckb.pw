const routes = [
  {
    path: '/',
    component: () => import('layouts/MyLayout.vue'),
    children: [
      { path: '', redirect: 'account' },
      {
        path: 'account',
        name: 'account',
        component: () => import('pages/Index.vue')
      },
      {
        path: 'send',
        name: 'send',
        component: () => import('pages/Send.vue')
      },
      {
        path: 'explore',
        component: () => import('pages/Explore.vue'),
        name: 'explore'
      },
      {
        path: 'dao',
        name: 'dao',
        component: () => import('pages/Dao.vue')
      },
      {
        path: '/txs',
        component: () => import('pages/TxRecords.vue')
      }
    ]
  }
]

// Always leave this as last one
if (process.env.MODE !== 'ssr') {
  routes.push({
    path: '*',
    component: () => import('pages/Error404.vue')
  })
}

export default routes
