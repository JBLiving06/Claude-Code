/**
 * commitment_surfacing.gs
 * Queries the Notion Commitments database and returns open commitments
 * grouped by counterparty, for use in the Morning Brief.
 */

var COMMITMENTS_DB_ID = 'fe2d9605-414c-4171-a5d6-5d26b78051b1';
var AGING_THRESHOLD_DAYS = 14;

/**
 * Fetches open commitments Jeff owes to the given list of people.
 * @param {string[]} personNames - Names of people Jeff is meeting today
 * @return {Object} Map of personName -> [{ title, createdDate, ageDays, isAging }]
 */
function getCommitmentsForPeople(personNames) {
  if (!personNames || personNames.length === 0) return {};

  var commitmentsByPerson = {};

  personNames.forEach(function(name) {
    var commitments = queryCommitmentsForPerson_(name);
    if (commitments.length > 0) {
      commitmentsByPerson[name] = commitments;
    }
  });

  return commitmentsByPerson;
}

/**
 * Queries Notion for open commitments where Jeff owes the given person.
 * @param {string} personName
 * @return {Array} Array of commitment objects
 * @private
 */
function queryCommitmentsForPerson_(personName) {
  var filter = {
    "and": [
      {
        "property": "Status",
        "status": {
          "equals": "Open"
        }
      },
      {
        "property": "Counterparty",
        "rich_text": {
          "contains": personName
        }
      },
      {
        "or": [
          {
            "property": "Ownership Direction",
            "select": {
              "equals": "Jeff Owes"
            }
          },
          {
            "property": "Ownership Direction",
            "select": {
              "equals": "Mutual"
            }
          }
        ]
      }
    ]
  };

  var payload = {
    "filter": filter,
    "sorts": [
      {
        "property": "Created",
        "direction": "ascending"
      }
    ]
  };

  var response = notionApiRequest('POST', '/databases/' + COMMITMENTS_DB_ID + '/query', payload);

  if (!response || !response.results) {
    Logger.log('No results or error querying commitments for: ' + personName);
    return [];
  }

  var today = new Date();
  return response.results.map(function(page) {
    var title = getNotionTitle_(page);
    var createdDate = getNotionDate_(page, 'Created') || page.created_time;
    var created = new Date(createdDate);
    var ageDays = Math.floor((today - created) / (1000 * 60 * 60 * 24));
    var ownershipDirection = getNotionSelect_(page, 'Ownership Direction') || '';

    return {
      title: title,
      createdDate: createdDate,
      ageDays: ageDays,
      isAging: ageDays > AGING_THRESHOLD_DAYS,
      ownershipDirection: ownershipDirection
    };
  });
}

/**
 * Extracts the title from a Notion page object.
 * @private
 */
function getNotionTitle_(page) {
  var props = page.properties;
  for (var key in props) {
    if (props[key].type === 'title' && props[key].title && props[key].title.length > 0) {
      return props[key].title.map(function(t) { return t.plain_text; }).join('');
    }
  }
  return '(untitled)';
}

/**
 * Extracts a date property value from a Notion page.
 * @private
 */
function getNotionDate_(page, propertyName) {
  var prop = page.properties[propertyName];
  if (prop && prop.type === 'date' && prop.date) {
    return prop.date.start;
  }
  return null;
}

/**
 * Extracts a select property value from a Notion page.
 * @private
 */
function getNotionSelect_(page, propertyName) {
  var prop = page.properties[propertyName];
  if (prop && prop.type === 'select' && prop.select) {
    return prop.select.name;
  }
  return null;
}

/**
 * Test function: manually verify commitment surfacing works.
 */
function testCommitmentSurfacing() {
  var testNames = ['Test Person'];
  var results = getCommitmentsForPeople(testNames);
  Logger.log(JSON.stringify(results, null, 2));
}
