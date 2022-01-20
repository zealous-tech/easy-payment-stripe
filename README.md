# easy-payment-stripe

## Installation ##


    $ npm install -save easy-payment @easy-payment/stripe

## Usage

```javascript

const Gateways = require('easy-payment');
const STRIPE = require('@easy-payment/stripe').gateway;

const settings = {
    SECRET_KEY: 'SECRET_KEY'
};
const client = Gateways.create(STRIPE, settings);

```

## Gateway API

This is an adaptor of STRIPE APIs for [easy-payment](https://github.com/InstigateMobile/easy-payment-main).
It implements the [BaseGateway](https://github.com/InstigateMobile/easy-payment-base) API.
