/* eslint prefer-arrow-callback: 0 */
const Schema = require('mongoose').Schema;

const schema = new Schema(
  {
    tutorId: { type: Schema.Types.ObjectId },
    start: {
      type: String
    },
    end: {
      type: String
    },
    range: {
      start: { type: Date },
      end: {
        type: Date
      }
    },
    dayOfWeek: [],
    isFree: { type: Boolean },
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

module.exports = schema;
