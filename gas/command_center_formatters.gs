/**
 * command_center_formatters.gs
 *
 * Formatters that convert Morning Brief data into Notion block structures
 * for the Command Center page. Each formatter produces an array of Notion
 * block objects ready to be appended to the appropriate section.
 *
 * TRAVEL DETECTION RULE: Hotel bookings and flights on Jeff's calendar are
 * NOT necessarily Jeff's travel. Known patterns: Donovan Livingston's Delta
 * flights, a Columbus hotel booked for a friend. Default to Atlanta unless
 * there is overwhelming corroborating evidence.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

var COMMAND_CENTER_PAGE_ID = '096bc1f3-e26c-4253-b282-7b1ceeb3215c';
var COMMITMENTS_DB_ID = '599184c4-c024-4617-8ca3-63e2da889172';

var SEVERITY = {
  OVERDUE: '\uD83D\uDD34',   // 🔴
  AGING: '\uD83D\uDFE1',     // 🟡
  TODAY: '\u26AA'              // ⚪
};

// ---------------------------------------------------------------------------
// Nanci Context Line
// ---------------------------------------------------------------------------

/**
 * Formats the Nanci context line as a callout block with 🕷️ icon.
 *
 * @param {Object} briefData - The Morning Brief data object
 * @param {string} briefData.contextLine - The context sentence
 * @param {string} briefData.weatherCity - City name (default: "Atlanta")
 * @param {string} briefData.weatherTemp - Temperature in °F
 * @param {string} briefData.weatherConditions - Weather conditions text
 * @returns {Array} Array with one callout block
 */
function formatNanciContextLine(briefData) {
  var contextLine = briefData.contextLine || 'No context generated for today.';
  var city = briefData.weatherCity || 'Atlanta';
  var temp = briefData.weatherTemp || '--';
  var conditions = briefData.weatherConditions || '';

  var richTextParts = [
    richText_('Nanci: ', { bold: true }),
    richText_(contextLine + ' '),
    richText_(city, { bold: true }),
    richText_(' ' + temp + '°F ' + conditions)
  ];

  return [calloutBlock_('\uD83D\uDD77\uFE0F', richTextParts)];  // 🕷️
}

// ---------------------------------------------------------------------------
// Today's Meetings
// ---------------------------------------------------------------------------

/**
 * Formats meeting intelligence as per-meeting card blocks.
 *
 * Each meeting becomes a paragraph block with the format:
 *   **[time]** [name] *([org])* — [one-line context]
 *
 * Meetings are filtered to include only those where context matters:
 * cold meetings, open commitments with attendees, long-silent contacts.
 * Internal energy blocks and deeply embedded meetings are excluded.
 *
 * @param {Array} meetings - Array of meeting intelligence objects
 * @param {string} meetings[].time - Meeting time (e.g., "9:00 AM")
 * @param {string} meetings[].name - Contact/meeting name
 * @param {string} [meetings[].org] - Organization
 * @param {string} meetings[].context - One-line intelligence context
 * @param {boolean} [meetings[].needsCard] - Whether this meeting warrants a card
 * @returns {Array} Array of Notion blocks for the meetings section
 */
function formatMeetingCards(meetings) {
  if (!meetings || meetings.length === 0) {
    return [
      paragraphBlock_([
        richText_('No meetings with actionable context today.', { italic: true })
      ])
    ];
  }

  // Filter to only meetings that warrant cards
  var cardMeetings = meetings.filter(function(m) {
    // If the pipeline already flagged it, respect that
    if (typeof m.needsCard !== 'undefined') return m.needsCard;
    // Default: include if there's context
    return m.context && m.context.length > 0;
  });

  if (cardMeetings.length === 0) {
    return [
      paragraphBlock_([
        richText_('All meetings today are routine. No special context needed.', { italic: true })
      ])
    ];
  }

  var blocks = [];

  for (var i = 0; i < cardMeetings.length; i++) {
    var mtg = cardMeetings[i];
    var richTextParts = [];

    // Time (bold)
    richTextParts.push(richText_(mtg.time || '—', { bold: true }));
    richTextParts.push(richText_(' '));

    // Name
    richTextParts.push(richText_(mtg.name || 'Unknown'));

    // Org (italic, in parentheses)
    if (mtg.org) {
      richTextParts.push(richText_(' ('));
      richTextParts.push(richText_(mtg.org, { italic: true }));
      richTextParts.push(richText_(')'));
    }

    // Context
    if (mtg.context) {
      richTextParts.push(richText_(' — ' + mtg.context));
    }

    blocks.push(paragraphBlock_(richTextParts));
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Commitments
// ---------------------------------------------------------------------------

/**
 * Queries the Commitments database and formats the top 3-5 commitments
 * with severity indicators.
 *
 * Severity:
 *   🔴 overdue — past due date
 *   🟡 aging — >7 days old, no due date or approaching due date
 *   ⚪ due today or connected to today's meetings
 *
 * @param {Array} [todayMeetingNames] - Names of people in today's meetings
 *   (used to elevate connected commitments)
 * @returns {Array} Array of Notion blocks for the commitments section
 */
function formatCommitments(todayMeetingNames) {
  var today = new Date();
  var todayStr = Utilities.formatDate(today, 'America/New_York', 'yyyy-MM-dd');
  todayMeetingNames = todayMeetingNames || [];

  // Normalize meeting names to lowercase for matching
  var meetingNamesLower = todayMeetingNames.map(function(n) {
    return (n || '').toLowerCase();
  });

  var commitments;
  try {
    commitments = queryOpenCommitments_();
  } catch (e) {
    Logger.log('Failed to query commitments database: ' + e.message);
    return [
      paragraphBlock_([
        richText_('Unable to load commitments.', { italic: true })
      ])
    ];
  }

  if (!commitments || commitments.length === 0) {
    return [
      paragraphBlock_([
        richText_('No open commitments.', { italic: true })
      ])
    ];
  }

  // Score and sort commitments
  var scored = commitments.map(function(c) {
    var item = parseCommitment_(c);
    item.severity = computeSeverity_(item, todayStr, meetingNamesLower);
    item.sortScore = severitySortScore_(item.severity, item.ageDays);
    return item;
  });

  scored.sort(function(a, b) { return b.sortScore - a.sortScore; });

  // Take top 5
  var top = scored.slice(0, 5);

  // Build blocks
  var blocks = [];
  for (var i = 0; i < top.length; i++) {
    var c = top[i];
    var indicator = c.severity;
    var richTextParts = [
      richText_(indicator + ' '),
      richText_(c.person, { bold: true }),
      richText_(' — ' + c.promise),
      richText_(' (' + c.ageDays + 'd)', { italic: true, color: 'gray' })
    ];
    blocks.push(paragraphBlock_(richTextParts));
  }

  return blocks;
}

/**
 * Queries the Commitments database for open commitments.
 * @returns {Array} Raw Notion database rows
 */
function queryOpenCommitments_() {
  var filter = {
    'property': 'Status',
    'status': {
      'does_not_equal': 'Done'
    }
  };

  var sorts = [
    { 'property': 'Due Date', 'direction': 'ascending' }
  ];

  return queryDatabase_(COMMITMENTS_DB_ID, filter, sorts);
}

/**
 * Parses a raw Notion commitment row into a usable object.
 *
 * @param {Object} row - Notion database row
 * @returns {Object} Parsed commitment: { person, promise, dueDate, createdDate, ageDays }
 */
function parseCommitment_(row) {
  var props = row.properties || {};

  // Extract person name — try common property name patterns
  var person = extractPropertyText_(props, ['Person', 'Who', 'Name', 'Contact']) || 'Unknown';

  // Extract promise/commitment text
  var promise = extractPropertyText_(props, ['Commitment', 'Promise', 'Title', 'Name', 'Description']) || 'No description';

  // If "Name" was used for person, try to get promise from Title
  if (person === promise) {
    promise = extractPropertyText_(props, ['Commitment', 'Promise', 'Description']) || person;
  }

  // Extract due date
  var dueDate = extractPropertyDate_(props, ['Due Date', 'Due', 'Deadline']);

  // Created date
  var createdDate = row.created_time ? new Date(row.created_time) : new Date();

  // Age in days
  var now = new Date();
  var ageDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));

  return {
    person: person,
    promise: promise,
    dueDate: dueDate,
    createdDate: createdDate,
    ageDays: ageDays
  };
}

/**
 * Extracts text from a Notion property, trying multiple possible property names.
 *
 * @param {Object} props - Notion properties object
 * @param {Array<string>} names - Property names to try in order
 * @returns {string|null}
 */
function extractPropertyText_(props, names) {
  for (var i = 0; i < names.length; i++) {
    var prop = props[names[i]];
    if (!prop) continue;

    // Title type
    if (prop.type === 'title' && prop.title && prop.title.length > 0) {
      return prop.title.map(function(t) { return t.plain_text; }).join('');
    }

    // Rich text type
    if (prop.type === 'rich_text' && prop.rich_text && prop.rich_text.length > 0) {
      return prop.rich_text.map(function(t) { return t.plain_text; }).join('');
    }

    // Select type
    if (prop.type === 'select' && prop.select) {
      return prop.select.name;
    }

    // Relation type — would need a separate lookup; return placeholder
    if (prop.type === 'relation' && prop.relation && prop.relation.length > 0) {
      return '[Related: ' + prop.relation[0].id.substring(0, 8) + ']';
    }

    // People type
    if (prop.type === 'people' && prop.people && prop.people.length > 0) {
      return prop.people.map(function(p) { return p.name || 'Unknown'; }).join(', ');
    }
  }
  return null;
}

/**
 * Extracts a date from a Notion property, trying multiple property names.
 *
 * @param {Object} props - Notion properties object
 * @param {Array<string>} names - Property names to try
 * @returns {Date|null}
 */
function extractPropertyDate_(props, names) {
  for (var i = 0; i < names.length; i++) {
    var prop = props[names[i]];
    if (!prop) continue;

    if (prop.type === 'date' && prop.date && prop.date.start) {
      return new Date(prop.date.start);
    }
  }
  return null;
}

/**
 * Computes severity indicator for a commitment.
 *
 * @param {Object} item - Parsed commitment
 * @param {string} todayStr - Today's date as yyyy-MM-dd
 * @param {Array<string>} meetingNamesLower - Lowercase names from today's meetings
 * @returns {string} Severity emoji
 */
function computeSeverity_(item, todayStr, meetingNamesLower) {
  // Check if overdue
  if (item.dueDate) {
    var dueStr = Utilities.formatDate(item.dueDate, 'America/New_York', 'yyyy-MM-dd');

    if (dueStr < todayStr) {
      return SEVERITY.OVERDUE;  // 🔴 overdue
    }

    if (dueStr === todayStr) {
      return SEVERITY.TODAY;  // ⚪ due today
    }
  }

  // Check if connected to today's meetings
  var personLower = (item.person || '').toLowerCase();
  for (var i = 0; i < meetingNamesLower.length; i++) {
    if (personLower.indexOf(meetingNamesLower[i]) !== -1 ||
        meetingNamesLower[i].indexOf(personLower) !== -1) {
      return SEVERITY.TODAY;  // ⚪ connected to today's meeting
    }
  }

  // Check if aging (>7 days old)
  if (item.ageDays > 7) {
    return SEVERITY.AGING;  // 🟡 aging
  }

  return SEVERITY.TODAY;  // ⚪ default
}

/**
 * Returns a numeric sort score for severity ranking.
 * Higher score = should appear first.
 *
 * @param {string} severity - Severity emoji
 * @param {number} ageDays - Age in days
 * @returns {number}
 */
function severitySortScore_(severity, ageDays) {
  var base = 0;
  if (severity === SEVERITY.OVERDUE) base = 1000;
  else if (severity === SEVERITY.AGING) base = 500;
  else base = 100;

  return base + ageDays;
}

// ---------------------------------------------------------------------------
// Nanci Says
// ---------------------------------------------------------------------------

/**
 * Formats the Nanci Says synthesis as Notion blocks.
 * Handles the empty state gracefully.
 *
 * @param {string|Array} synthesis - Overnight intelligence text or array of items
 * @returns {Array} Array of Notion blocks for the Nanci Says section
 */
function formatNanciSays(synthesis) {
  // Handle empty state
  if (!synthesis ||
      (typeof synthesis === 'string' && synthesis.trim().length === 0) ||
      (Array.isArray(synthesis) && synthesis.length === 0)) {
    return [
      paragraphBlock_([
        richText_('No overnight signals. Quiet night.', { italic: true })
      ])
    ];
  }

  // If it's a string, split into paragraphs
  if (typeof synthesis === 'string') {
    var lines = synthesis.split('\n').filter(function(line) {
      return line.trim().length > 0;
    });

    if (lines.length === 0) {
      return [
        paragraphBlock_([
          richText_('No overnight signals. Quiet night.', { italic: true })
        ])
      ];
    }

    return lines.map(function(line) {
      return bulletBlock_(line.trim());
    });
  }

  // If it's an array of intelligence items
  if (Array.isArray(synthesis)) {
    return synthesis.map(function(item) {
      if (typeof item === 'string') {
        return bulletBlock_(item);
      }
      // If items have structure (e.g., { signal, detail })
      if (item.signal) {
        var parts = [
          richText_(item.signal, { bold: true })
        ];
        if (item.detail) {
          parts.push(richText_(' — ' + item.detail));
        }
        return bulletBlock_(parts);
      }
      return bulletBlock_(JSON.stringify(item));
    });
  }

  // Fallback
  return [paragraphBlock_(String(synthesis))];
}
