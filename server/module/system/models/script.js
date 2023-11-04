const Schema = require('mongoose').Schema;

const schema = new Schema({
  lastRun: {
    type: String,
    default: ''
  },
  scripts: {
    type: Schema.Types.Mixed,
    default: [
      {
        title: '',
        description: ''
      }
    ]
  }
});

module.exports = schema;
