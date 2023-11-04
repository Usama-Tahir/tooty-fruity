const Stripe = require('stripe');
const Joi = require('joi');

exports.hook = async (req, res, next) => {
  try {
    const data = req.body;
    const eventType = data.type;

    if (data.id && data.data && data.data.object) {
      const object = data.data.object;
      const transaction = await DB.Transaction.findOne({ _id: object.metadata.transactionId });
      if (!transaction) return next();
      if (eventType === 'charge.succeeded') {
        transaction.paymentInfo = object;
        await transaction.save();
        await Service.Payment.updatePayment(transaction._id);
      }
    }
    return next();
  } catch (e) {
    return next(e);
  }
};
