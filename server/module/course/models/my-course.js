/* eslint prefer-arrow-callback: 0 */
const Schema = require('mongoose').Schema;

const schema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      index: true,
      ref: 'Course'
    },
    userId: {
      type: Schema.Types.ObjectId,
      index: true
    },
    name: {
      type: String,
      default: ''
    },
    categoryIds: [
      {
        type: Schema.Types.ObjectId,
        index: true,
        ref: 'Category'
      }
    ],
    paid: {
      type: Boolean,
      default: false
    },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', index: true },
    lectureMediaIdsCompleted: [
      {
        type: Schema.Types.ObjectId
      }
    ],
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    },
    createdAt: {
      type: Date
    },
    updatedAt: {
      type: Date
    }
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt'
    },
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    }
  }
);

schema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true
});
schema.virtual('transaction', {
  ref: 'Transaction',
  localField: 'transactionId',
  foreignField: '_id',
  justOne: true
});
schema.virtual('category', {
  ref: 'Category',
  localField: 'categoryIds',
  foreignField: '_id',
  justOne: false
});
module.exports = schema;
