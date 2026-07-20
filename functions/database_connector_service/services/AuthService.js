const AppConstants = require('../constants')
class AuthService {
  #DefaultKey = 'CODELIB_FAKE_KEY'
  #ValidSecretPattern = /^[a-zA-Z0-9]{32,}$/

  isValidRequest = (key) => {
    const configuredSecret = process.env[AppConstants.Env.CodelibSecretKey]
    return (
      key &&
      configuredSecret &&
      configuredSecret !== this.#DefaultKey &&
      this.#ValidSecretPattern.test(configuredSecret) &&
      key === configuredSecret
    )
  }

  static getInstance = () => {
    return new AuthService()
  }
}
module.exports = AuthService
