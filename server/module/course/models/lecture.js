/* eslint prefer-arrow-callback: 0 */
const Schema = require('mongoose').Schema;

const schema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId
    },
    sectionId: {
      type: Schema.Types.ObjectId,
      index: true,
      ref: 'Section'
    },
    title: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    totalMedia: {
      type: Number,
      default: 0
    },
    ordering: {
      type: Number,
      default: 0
    },
    hashLecture: {
      type: String
    },
    preview: {
      type: Boolean,
      default: false
    },
    mediaIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'LectureMedia'
      }
    ],
    createdAt: {
      type: Date
    },
    updatedAt: {
      type: Date
    },
    mediaId: {
      type: Schema.Types.ObjectId,
      ref: 'Media'
    },
    mediaType: {
      type: String
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

schema.virtual('medias', {
  ref: 'LectureMedia',
  localField: 'mediaIds',
  foreignField: '_id',
  justOne: false
});
module.exports = schema;
