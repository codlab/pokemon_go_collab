(function (module) {
  module.exports = {
    "types": {
      POKESTOP: 9000,
      POKEGYM: 9001
    },
    "store": {
      UUID_KEY: "uuid",
      PASS_KEY: "login",
      TOKEN_KEY: "token"
    }
  }

  if ('undefined' != typeof window) {
    window.constants = module.exports;
  }
})('undefined' == typeof module ? { module: { exports: {} } } : module);
