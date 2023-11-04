module.exports = async () => {
  await DB.Config.update(
    {
      key: 'siteName'
    },
    {
      $set: {
        name: 'Site Name'
      }
    }
  ),
    await DB.Config.update(
      {
        key: 'siteLogo'
      },
      {
        $set: {
          name: 'Site Logo'
        }
      }
    ),
    await DB.Config.update(
      {
        key: 'siteBanner'
      },
      {
        $set: {
          name: 'Site Banner'
        }
      }
    ),
    await DB.Config.update(
      {
        key: 'siteFavicon'
      },
      {
        $set: {
          name: 'Site Favicon'
        }
      }
    ),
    await DB.Config.update(
      {
        key: 'contactPhone'
      },
      {
        $set: {
          name: 'Contact Phone'
        }
      }
    ),
    await DB.Config.update(
      {
        key: 'contactEmail'
      },
      {
        $set: {
          name: 'Contact Email'
        }
      }
    ),
    await DB.Config.update(
      {
        key: 'commissionRate'
      },
      {
        $set: {
          name: 'Commission Rate Setting'
        }
      }
    );
};
