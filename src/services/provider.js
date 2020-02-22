import ABCWallet from 'abcwallet'

export const init = () => {
  const UA = navigator.userAgent
  if (window.ethereum.isImToken) return initImToken()
  if (UA.indexOf('ABCWallet') > 0) return initABCWallet()
  if (UA.indexOf('AlphaWallet') > 0) return initAlphaWallet()
  // MetaMask must be the last to check,
  // as other wallets often declare themselves
  // to be MetaMask for compatibility purpose
  if (window.ethereum.isMetaMask) return initMetaMask()
}

function initImToken() {
  try {
    window.imToken.callAPI('navigator.configure', {
      navigatorColor: 'black'
    })
  } catch (e) {
    console.log(e)
  }
  return {
    provider: 'ImToken',
    showHeader: false
  }
}

function initABCWallet() {
  ABCWallet.webview.setTitlebar({
    title: 'CKB P-Wallet',
    forecolor: '#ffffff',
    bgcolor: '#000000'
  })

  return {
    provider: 'ABCWallet',
    showHeader: false
  }
}

function initAlphaWallet() {
  return {
    provider: 'AlphaWallet',
    showHeader: true
  }
}

function initMetaMask() {
  return {
    provider: 'MetaMask',
    showHeader: true
  }
}
