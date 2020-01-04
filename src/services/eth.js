/* eslint-disable no-undef */
export const getEthAddress = async () => {
  if (typeof window.ethereum !== 'undefined') {
    const accounts = await window.ethereum.enable()
    return accounts[0]
  }
  return null
}

export const signWitness = async (message, from) => {
  const signFunc = new Promise((resolve, reject) => {
    if (web3.currentProvider.isImToken) {
      web3.eth.sign(from, message, (err, result) => {
        if (err) {
          reject(err)
        }
        resolve(result)
      })
      return
    }
    var params = [message, from]
    var method = 'personal_sign'
    web3.currentProvider.sendAsync(
      {
        method,
        params,
        from
      },
      function(err, result) {
        if (err) {
          reject(err)
        } else if (result.error) {
          reject(result.error)
        } else {
          resolve(result.result)
        }
      }
    )
  })
  const witness = await signFunc

  return witness
}
