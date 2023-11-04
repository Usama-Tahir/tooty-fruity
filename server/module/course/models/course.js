/* eslint prefer-arrow-callback: 0 */
const Schema = require('mongoose').Schema;

const schema = new Schema(
  {
    tutorId: {
      type: Schema.Types.ObjectId,
      index: true,
      ref: 'User'
    },
    createBy: {
      type: Schema.Types.ObjectId
    },
    name: {
      type: String,
      default: ''
    },
    alias: {
      type: String,
      default: '',
      index: true
    },
    categoryIds: [
      {
        type: Schema.Types.ObjectId,
        index: true,
        ref: 'Category'
      }
    ],
    couponId: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon'
    },
    price: {
      type: Number,
      default: 0
    },
    mainImageId: {
      type: Schema.Types.ObjectId,
      ref: 'Media',
      default: null
    },
    introductionVideoId: {
      type: Schema.Types.ObjectId,
      ref: 'Media',
      default: null
    },
    description: {
      type: String,
      default: ''
    },
    isFree: {
      type: Boolean,
      default: false
    },
    goalCourse: [
      {
        type: String,
        default: ''
      }
    ],
    whyJoinCourse: [
      {
        type: String,
        default: ''
      }
    ],
    needToJoinCourse: [
      {
        type: String,
        default: ''
      }
    ],
    totalSection: {
      type: Number,
      default: 0
    },
    approved: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    featured: {
      type: Boolean,
      default: false
    },
    gradeIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Grade',
        default: null
      }
    ],
    createdAt: {
      type: Date
    },
    updatedAt: {
      type: Date
    },
    subjectIds: [
      {
        type: Schema.Types.ObjectId,
        index: true,
        ref: 'Subject'
      }
    ],
    topicIds: [
      {
        type: Schema.Types.ObjectId,
        index: true,
        ref: 'Topic'
      }
    ],
    age: {
      type: Schema.Types.Mixed,
      default: null
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

schema.virtual('tutor', {
  ref: 'User',
  localField: 'tutorId',
  foreignField: '_id',
  justOne: true
});
schema.virtual('categories', {
  ref: 'Category',
  localField: 'categoryIds',
  foreignField: '_id',
  justOne: false
});
schema.virtual('mainImage', {
  ref: 'Media',
  localField: 'mainImageId',
  foreignField: '_id',
  justOne: true
});
schema.virtual('videoIntroduction', {
  ref: 'Media',
  localField: 'introductionVideoId',
  foreignField: '_id',
  justOne: true
});
schema.virtual('coupon', {
  ref: 'Coupon',
  localField: 'couponId',
  foreignField: '_id',
  justOne: true
});

schema.virtual('grades', {
  ref: 'Grade',
  localField: 'gradeIds',
  foreignField: '_id',
  justOne: false
});

schema.virtual('topics', {
  ref: 'Topic',
  localField: 'topicIds',
  foreignField: '_id',
  justOne: false
});

schema.virtual('subjects', {
  ref: 'Subject',
  localField: 'subjectIds',
  foreignField: '_id',
  justOne: false
});
module.exports = schema;
