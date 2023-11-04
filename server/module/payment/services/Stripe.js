const Stripe = require('stripe');
const zeroDecimalCurrencies = ['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'];
exports.charge = async (transaction, token) => {
  try {
    const configs = await DB.Config.find({
      key: {
        $in: ['currency', 'stripeKey', 'commissionRate', 'commissionCourse']
      }
    }).exec();
    const dataConfig = {};
    configs.forEach(item => {
      dataConfig[item.key] = item.value;
    });
    const currency = dataConfig.currency ? dataConfig.currency : 'usd';
    const stripeKey = dataConfig.stripeKey ? dataConfig.stripeKey : process.env.STRIPE_SECRET_KEY;
    const _stripe = new Stripe(stripeKey);
    const data = await _stripe.charges.create({
      amount: parseInt(transaction.price * 100, 10),
      currency: currency.toLowerCase(),
      source: token, // obtained with Stripe.js
      metadata: {
        webinarId: (transaction.webinarId && transaction.webinarId.toString()) || '',
        subjectId: (transaction.subjectId && transaction.subjectId.toString()) || '',
        type: transaction.type
      }
    });
    if (data.status !== 'succeeded' || !data.paid) {
      throw data;
    }

    return data;
  } catch (e) {
    throw e;
  }
};

exports.createPaymentIntent = async transaction => {
  try {
    const configs = await DB.Config.find({
      key: {
        $in: ['currency', 'stripeKey', 'commissionRate', 'commissionCourse']
      }
    }).exec();
    const dataConfig = {};
    configs.forEach(item => {
      dataConfig[item.key] = item.value;
    });
    const currency = dataConfig.currency ? dataConfig.currency || '' : 'usd';
    const stripeKey = dataConfig.stripeKey ? dataConfig.stripeKey : process.env.STRIPE_SECRET_KEY;
    const _stripe = new Stripe(stripeKey);
    const isZeroDecimalCurrency = zeroDecimalCurrencies.indexOf(currency.toUpperCase()) > -1 ? true : false;
    const amount = isZeroDecimalCurrency ? parseInt(transaction.priceForPayment, 10) : parseInt(transaction.priceForPayment * 100, 10);
    const data = await _stripe.paymentIntents.create({
      description: transaction.description,
      amount: amount,
      currency: currency.toLowerCase(),
      metadata: {
        transactionId: transaction._id.toString()
      }
    });

    return data;
  } catch (e) {
    console.log(e);
    throw e;
  }
};
