/* eslint prefer-arrow-callback: 0 */
const Schema = require('mongoose').Schema;

const schema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      index: true,
      ref: 'Course'
    },
    title: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    totalLecture: {
      type: Number,
      default: 0
    },
    lectureIds: [{ type: Schema.Types.ObjectId, ref: 'Lecture' }],
    ordering: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date
    },
    updatedAt: {
      type: Date
    },
    trialVideoId: {
      type: Schema.Types.ObjectId,
      ref: 'Media'
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

schema.virtual('lectures', {
  ref: 'Lecture',
  localField: 'lectureIds',
  foreignField: '_id',
  justOne: false
});

schema.virtual('trialVideo', {
  ref: 'Media',
  localField: 'trialVideoId',
  foreignField: '_id',
  justOne: true
});
module.exports = schema;
