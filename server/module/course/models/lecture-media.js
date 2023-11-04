/* eslint prefer-arrow-callback: 0 */
const Schema = require('mongoose').Schema;

const schema = new Schema(
  {
    lectureId: {
      type: Schema.Types.ObjectId,
      index: true
    },
    mediaId: {
      type: Schema.Types.ObjectId,
      ref: 'Media'
    },
    mediaType: {
      type: String
    },
    totalLength: {
      type: Number
    },
    ordering: {
      type: Number,
      default: 0
    },
    hashLecture: {
      type: String
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

schema.virtual('media', {
  ref: 'Media',
  localField: 'mediaId',
  foreignField: '_id',
  justOne: true
});
module.exports = schema;
