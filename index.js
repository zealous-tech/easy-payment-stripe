const STRIPE = require('./lib/stripe.js');
const assert = require('assert');

module.exports = {
  gateway: function (options) {
    assert(options.SECRET_KEY, 'SECRET_KEY is mandatory');
    options = options || {};
    const service = new STRIPE(options);
    return service;
  },
  STRIPE: STRIPE
};
