const stripe = require("stripe");
const BaseGateway = require('@easy-payment/base').BaseGateway;

class STRIPE extends BaseGateway {
  constructor(options) {
    super();
    this.client = stripe(options.SECRET_KEY)
  }

  _retrieveCustomer = async (customerId) => {
    try {
      const data = await this.client.customers.retrieve(customerId);
      return { hasError: false, data: data };
    } catch (err) {
      return { hasError: true, err: err };
    }
  }

  _retrieveConnectedAccountCustomer = async (customerId, stripeAccount) => {
    try {
      const data = await this.client.customers.retrieve(customerId, { stripeAccount });
      return { hasError: false, data: data };
    } catch (err) {
      return { hasError: true, err: err };
    }
  }

  _createCustomer = async (customerData = {}) => {
    try {
      const data = await this.client.customers.create(customerData);
      return { hasError: false, data: data };
    } catch (err) {
      return { hasError: true, err: err };
    }
  }

  _attachCard = async (order) => {
    const payload = (({ customer, payment_method_types }) => ({ customer, payment_method_types }))(order);
    try {
      const data = await this.client.setupIntents.create(payload);
      return { hasError: false, data: data };
    } catch (err) {
      return { hasError: true, err: err };
    }
  }

  _removeCard = async (cardId) => {
    try {
      const data = await this.client.paymentMethods.detach(cardId);
      return { hasError: false, data: data };
    } catch (err) {
      return { hasError: true, err: err };
    }
  }

  _createToken = async (customer, stripeAccount) => {
    try {
      const data = await this.client.tokens.create({ customer }, { stripeAccount });
      return { hasError: false, data: data };
    } catch (err) {
      return { hasError: true, err: err };
    }
  }

  _payOrder = async (order, stripeAccount) => {
    try {
      const data = await this.client.paymentIntents.create(order, { stripeAccount });
      return { hasError: false, data: data };
    } catch (err) {
      return { hasError: true, err: err };
    }
  }

  _createCustomerForStripeAccount = async (customerData = {}, stripeAccount) => {
    try {
      const data = await this.client.customers.create(customerData, { stripeAccount });
      return { hasError: false, data: data };
    } catch (err) {
      return { hasError: true, err: err };
    }
  }

  _refund = async (order, stripeAccount) => {
    const payload = (({ charge, amount }) => ({ charge, amount }))(order);
    try {
      const data = await this.client.refunds.create(payload, { stripeAccount });
      return { hasError: false, data: data };
    } catch (err) {
      return { hasError: true, err: err };
    }
  }

  _getOrderStatus = async (orderId) => {
    try {
      const data = await this.client.paymentIntents.retrieve(orderId);
      return { hasError: false, data: data };
    } catch (err) {
      return { hasError: true, err: err };
    }
  }

  _getOrderStatusFromStripeAccount = async (orderId, stripeAccount) => {
    try {
      const data = await this.client.paymentIntents.retrieve(orderId, { stripeAccount });
      return { hasError: false, data: data };
    } catch (err) {
      return { hasError: true, err: err };
    }
  }

  _getPaymentMethod = async (paymentMethodId) => {
    try {
      const data = await this.client.paymentMethods.retrieve(paymentMethodId);
      return { hasError: false, data: data };
    } catch (err) {
      return { hasError: true, err: err };
    }
  }

  _getSetupIntent = async (setupIntentId) => {
    try {
      const data = await this.client.setupIntents.retrieve(setupIntentId);
      return { hasError: false, data: data };
    } catch (err) {
      return { hasError: true, err: err };
    }
  }

  _createPaymentMethod = async (data, stripeAccount) => {
    const payload = (({ customer, payment_method }) => ({ customer, payment_method }))(data);
    try {
      const data = await this.client.paymentMethods.create(payload, { stripeAccount });
      return { hasError: false, data: data };
    } catch (err) {
      return { hasError: true, err: err };
    }
  }
  _createLoginLink = async (stripeAccount, redirect_url) => {
    try {
      const data = await this.client.accounts.createLoginLink(stripeAccount, { redirect_url });
      return { hasError: false, data: data };
    } catch (err) {
      return { hasError: true, err: err };
    }
  }

  attachCard = async (order) => {
    const payload = (({ customer, customerData }) => ({ customer, customerData }))(order);
    let customer;
    if (payload.customer) {
      customer = await this._retrieveCustomer(payload.customer);
      if (customer.hasError || customer.data.deleted) {
        customer.hasError = true;
        customer.errorStep = 'customers.retrieve';
        return customer;
      }
    } else {
      customer = await this._createCustomer(payload.customerData);
      if (customer.hasError) {
        customer.errorStep = 'customers.create';
        return customer;
      }
    }
    order.customer = customer.data.id
    const setupIntent = await this._attachCard(order);
    setupIntent.customer = customer.data.id;
    if (setupIntent.hasError) {
      setupIntent.errorStep = 'setupIntents.create';
    }
    return setupIntent;
  }

  removeCard = async (cardId) => {
    const data = await this._removeCard(cardId);
    if (data.hasError) {
      data.errorStep = 'paymentMethods.detach';
    }

    return data;
  }

  payOrder = async (order) => {
    const payload = (({ customer, stripeAccount, connectedAccountCustomer, payment_method, customerData }) => ({ customer, stripeAccount, connectedAccountCustomer, payment_method, customerData }))(order);

    const customer = await this._retrieveCustomer(payload.customer);
    if (customer.hasError || customer.data.deleted) {
      customer.hasError = true;
      customer.errorStep = 'customers.retrieve';
      return customer;
    }
    let customerForConnectedAccount;
    if (payload.connectedAccountCustomer) {
      customerForConnectedAccount = await this._retrieveConnectedAccountCustomer(payload.connectedAccountCustomer, payload.stripeAccount);
      if (customerForConnectedAccount.hasError || customerForConnectedAccount.data.deleted) {
        customerForConnectedAccount.hasError = true;
        customerForConnectedAccount.errorStep = 'customers.retrieve';
        return customerForConnectedAccount;
      }
    } else {
      customerForConnectedAccount = await this._createCustomerForStripeAccount(payload.customerData, payload.stripeAccount);
      if (customerForConnectedAccount.hasError) {
        customerForConnectedAccount.errorStep = 'customers.create';
        return customerForConnectedAccount;
      }
    }

    const paymentMethod = await this._createPaymentMethod(payload, payload.stripeAccount);
    if (paymentMethod.hasError) {
      paymentMethod.errorStep = 'paymentMethods.create';
      return paymentMethod;
    }

    const orderPayload = (({ amount, currency, payment_method_types, off_session, confirm, description }) => ({ amount, currency, payment_method_types, off_session, confirm, description }))(order);
    orderPayload.payment_method = paymentMethod.data.id;
    orderPayload.customer = customerForConnectedAccount.data.id;
    const paymentIntent = await this._payOrder(orderPayload, payload.stripeAccount);
    paymentIntent.customerForConnectedAccount = customerForConnectedAccount.data.id;
    if (paymentIntent.hasError) {
      paymentIntent.errorStep = 'paymentIntents.create';
    }

    return paymentIntent;

  }

  getOrderStatus = async (order) => {
    const payload = (({ stripeAccount, orderId }) => ({ stripeAccount, orderId }))(order);
    const data = payload.stripeAccount ? await this._getOrderStatusFromStripeAccount(payload.orderId, payload.stripeAccount) : await this._getOrderStatus(payload.orderId);
    if (data.hasError) {
      data.errorStep = 'paymentIntents.retrieve';
    }

    return data;
  }

  getPaymentMethod = async (paymentMethodId) => {
    const data = await this._getPaymentMethod(paymentMethodId);
    if (data.hasError) {
      data.errorStep = 'paymentMethods.retrieve';
    }

    return data;
  }

  getSetupIntent = async (setupIntentId) => {
    const data = await this._getSetupIntent(setupIntentId);
    if (data.hasError) {
      data.errorStep = 'setupIntents.retrieve';
    }

    return data;
  }

  refundOrder = async (order) => {
    const payload = (({ stripeAccount }) => ({ stripeAccount }))(order);
    const refund = await this._refund(order, payload.stripeAccount);
    if (refund.hasError) {
      refund.errorStep = 'refunds.create';
    }
    return refund;
  }

  createLoginLink = async (stripeAccount, redirect_url) => {
    const accountLink = await this._createLoginLink(stripeAccount, redirect_url);
    if (accountLink.hasError) {
      accountLink.errorStep = 'accounts.createLoginLink';
    }
    return accountLink;
  }

  registerOrder = async (order) => {
    const payload = (({ customer, stripeAccount, connectedAccountCustomer, customerData }) => ({ customer, stripeAccount, connectedAccountCustomer, customerData }))(order);
    let customer;
    if (payload.customer) {
      customer = await this._retrieveCustomer(payload.customer);
      if (customer.hasError || customer.data.deleted) {
        customer.hasError = true;
        customer.errorStep = 'customers.retrieve';
        return customer;
      }
    } else {
      customer = await this._createCustomer(payload.customerData);
      if (customer.hasError) {
        customer.errorStep = 'customers.create';
        return customer;
      }
    }
    order.customer = customer.data.id;

    let customerForConnectedAccount;
    if (payload.customer && payload.connectedAccountCustomer) {
      customerForConnectedAccount = await this._retrieveConnectedAccountCustomer(payload.connectedAccountCustomer, payload.stripeAccount);
      if (customerForConnectedAccount.hasError || customerForConnectedAccount.data.deleted) {
        customerForConnectedAccount.hasError = true;
        customerForConnectedAccount.errorStep = 'customers.retrieve';
        return customerForConnectedAccount;
      }
    } else {
      customerForConnectedAccount = await this._createCustomerForStripeAccount(payload.customerData, payload.stripeAccount);
      if (customerForConnectedAccount.hasError) {
        customerForConnectedAccount.errorStep = 'customers.create';
        return customerForConnectedAccount;
      }
    }
    const orderPayload = (({ amount, currency, setup_future_usage, automatic_payment_methods, description }) => ({ amount, currency, setup_future_usage, automatic_payment_methods, description }))(order);
    orderPayload.customer = customerForConnectedAccount.data.id;
    const paymentIntent = await this._payOrder(orderPayload, payload.stripeAccount);
    paymentIntent.customerForConnectedAccount = customerForConnectedAccount.data.id;
    if (paymentIntent.hasError) {
      paymentIntent.errorStep = 'paymentIntents.create';
    }
    return paymentIntent;
  }
}

module.exports = STRIPE;