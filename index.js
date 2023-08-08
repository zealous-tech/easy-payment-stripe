import STRIPE from './lib/stripe.js';
import assert from 'assert';

export default {
  gateway: function (options) {
    assert(options.SECRET_KEY, 'SECRET_KEY is mandatory');
    options = options || {};
    const service = new STRIPE(options);
    return service;
  },
  STRIPE: STRIPE
};
