(function (module) {
  module.exports = {
    "types": {
      POKESTOP: 9000,
      POKEGYM: 9001
    }
  }

  if ('undefined' != typeof window) {
    window.constants = module.exports;
  }
})('undefined' == typeof module ? { module: { exports: {} } } : module);
