const args = process.argv.slice(2);
const path = require('path');
const fs = require('fs');

require('dotenv').config();

require('./app');

if (args.length && args[0]) {
  setTimeout(async () => {
    await require(path.join(__dirname, 'scripts', args[0]))();

    console.log('Script done');
    process.exit();
  });
} else {
  setTimeout(async () => {
    const script = await DB.Script.find();
    if (script && script.length) {
      const { scripts } = script[0];
      if (scripts.length) {
        let listLocalScripts = await fs.readdirSync(path.join(__dirname, 'scripts'));
        for (const item of listLocalScripts) {
          const index = scripts.findIndex(element => element.title === item);
          if (index === -1) {
            console.log(`Run script ${item}`);
            await require(path.join(__dirname, 'scripts', item))();
            await DB.Script.updateOne(
              {},
              {
                $set: {
                  lastRun: item
                },
                $push: {
                  scripts: {
                    $each: [
                      {
                        title: item,
                        description: `Run script ${item}`
                      }
                    ]
                  }
                }
              },
              { upsert: true }
            );
          }
        }
      }
    } else {
      const oldScript = [
        'add-custom-config-mailer.js',
        'add-lesson-space-config.js',
        'add-more-sprint3-configs.js',
        'add-teachwithus-number-config.js',
        'add-user-lesson-space.js',
        'check-schedule-expired.js',
        'check-status-zoom-account.js',
        'config-update.js',
        'create-zoom-account.js',
        'download-flag.js',
        'fake-appointments.js',
        'fake-transactions.js',
        'remove-old-data.js',
        'update-admin.js',
        'update-data-webinar.js',
        'update-display-time.js',
        'update-flag-tutor.js',
        'update-media-lecture.js',
        'update-recording-content.js',
        'update-tutor-pending-status.js',
        'zoom.js'
      ];
      for (const s of oldScript) {
        await DB.Script.updateOne(
          {},
          {
            $set: {
              lastRun: oldScript[oldScript.length - 1]
            },
            $push: {
              scripts: {
                $each: [
                  {
                    title: s,
                    description: `Run script ${s}`
                  }
                ]
              }
            }
          },
          { upsert: true }
        );
      }
    }
    process.exit();
  });
}
