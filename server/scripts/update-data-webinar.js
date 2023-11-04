/* eslint no-restricted-syntax: 0, no-await-in-loop: 0 */
module.exports = async () => {
  try {
    const topics = await DB.Topic.find();
    if (topics && topics.length > 0) {
      for (const topic of topics) {
        const t = topic.toObject();
        delete t._id;
        delete t.id;
        const webinar = new DB.Webinar(t);
        await webinar.save();
        const appointments = await DB.Appointment.find({ topicId: topic._id });
        if (appointments && appointments.length > 0) {
          for (const a of appointments) {
            a.webinarId = webinar._id;
            await a.save();
          }
        }

        const coupons = await DB.Coupon.find({ topicId: topic._id });
        if (coupons && coupons.length > 0) {
          for (const c of coupons) {
            c.webinarId = webinar._id;
            await c.save();
          }
        }

        const favorites = await DB.Favorite.find({ topicId: topic._id });
        if (favorites && favorites.length > 0) {
          for (const f of favorites) {
            f.webinarId = webinar._id;
            await f.save();
          }
        }

        const transactions = await DB.Transaction.find({ targetId: topic._id });
        if (transactions && transactions.length > 0) {
          for (const tran of transactions) {
            tran.targetId = webinar._id;
            await tran.save();
          }
        }

        const refunds = await DB.RefundRequest.find({ topicId: topic._id });
        if (refunds && refunds.length > 0) {
          for (const r of refunds) {
            r.webinarId = webinar._id;
            await r.save();
          }
        }

        const reviews = await DB.Review.find({ topicId: topic._id });
        if (reviews && reviews.length > 0) {
          for (const review of reviews) {
            review.webinarId = webinar._id;
            await review.save();
          }
        }

        const schedules = await DB.Schedule.find({ topicId: topic._id });
        if (schedules && schedules.length > 0) {
          for (const schedule of schedules) {
            schedule.webinarId = webinar._id;
            await schedule.save();
          }
        }
      }
    }
  } catch (e) {
    console.log(e);
    throw e;
  }
};
