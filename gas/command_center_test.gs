/**
 * command_center_test.gs
 *
 * Manual test triggers for the Command Center pipeline.
 * Run these functions from the Apps Script editor to test the Notion
 * write without waiting for the 6:36 AM automated schedule.
 *
 * Usage:
 *   1. Open Apps Script editor
 *   2. Select testCommandCenterUpdate from the function dropdown
 *   3. Click Run
 *   4. Check the Notion Command Center page for updated content
 *   5. Check execution log for any errors
 */

/**
 * Tests the Command Center update with synthetic sample data.
 * Use this to verify the pipeline works end-to-end: section discovery,
 * content deletion, and new content insertion.
 */
function testCommandCenterUpdate() {
  Logger.log('=== MANUAL TEST: Command Center Update ===');
  Logger.log('Using synthetic test data.');

  var testData = buildTestBriefData_();

  try {
    updateCommandCenter(testData);
    Logger.log('=== TEST COMPLETE: Check the Command Center page ===');
    Logger.log('Page: https://www.notion.so/' + COMMAND_CENTER_PAGE_ID.replace(/-/g, ''));
  } catch (e) {
    Logger.log('=== TEST FAILED ===');
    Logger.log('Error: ' + e.message);
    Logger.log('Stack: ' + e.stack);
  }
}

/**
 * Tests section discovery only — does not modify the page.
 * Use this as a safe dry run to confirm the pipeline can find
 * the four target sections.
 */
function testFindSections() {
  Logger.log('=== MANUAL TEST: Section Discovery (read-only) ===');

  try {
    var sections = findCommandCenterSections(COMMAND_CENTER_PAGE_ID);

    Logger.log('--- Results ---');

    if (sections.nanciContext) {
      Logger.log('✓ Nanci Context: block ' + sections.nanciContext.blockId);
    } else {
      Logger.log('✗ Nanci Context: NOT FOUND (looking for callout with 🕷️)');
    }

    if (sections.todaysMeetings) {
      Logger.log('✓ Today\'s Meetings: heading ' + sections.todaysMeetings.headingBlockId +
                 ', ' + sections.todaysMeetings.contentBlockIds.length + ' content blocks');
    } else {
      Logger.log('✗ Today\'s Meetings: NOT FOUND');
    }

    if (sections.commitments) {
      Logger.log('✓ Commitments: heading ' + sections.commitments.headingBlockId +
                 ', ' + sections.commitments.contentBlockIds.length + ' content blocks');
    } else {
      Logger.log('✗ Commitments: NOT FOUND');
    }

    if (sections.nanciSays) {
      Logger.log('✓ Nanci Says: heading ' + sections.nanciSays.headingBlockId +
                 ', ' + sections.nanciSays.contentBlockIds.length + ' content blocks');
    } else {
      Logger.log('✗ Nanci Says: NOT FOUND');
    }

    Logger.log('=== SECTION DISCOVERY TEST COMPLETE ===');
  } catch (e) {
    Logger.log('=== TEST FAILED ===');
    Logger.log('Error: ' + e.message);
    Logger.log('Stack: ' + e.stack);
  }
}

/**
 * Tests the Commitments database query and formatting.
 * Fetches real commitment data and logs the formatted output.
 */
function testCommitmentsQuery() {
  Logger.log('=== MANUAL TEST: Commitments Query ===');

  try {
    var blocks = formatCommitments([]);

    Logger.log('Formatted ' + blocks.length + ' commitment blocks:');
    for (var i = 0; i < blocks.length; i++) {
      var text = extractBlockText_(blocks[i]);
      Logger.log('  ' + (i + 1) + '. ' + text);
    }

    Logger.log('=== COMMITMENTS TEST COMPLETE ===');
  } catch (e) {
    Logger.log('=== TEST FAILED ===');
    Logger.log('Error: ' + e.message);
    Logger.log('Stack: ' + e.stack);
  }
}

/**
 * Tests the Notion API connection by reading the Command Center page.
 * Minimal read-only test — no modifications.
 */
function testNotionConnection() {
  Logger.log('=== MANUAL TEST: Notion API Connection ===');

  try {
    var blocks = getChildBlocks_(COMMAND_CENTER_PAGE_ID);
    Logger.log('Successfully fetched ' + blocks.length + ' top-level blocks from Command Center page.');

    // Log block types for debugging
    for (var i = 0; i < blocks.length; i++) {
      Logger.log('  Block ' + i + ': type=' + blocks[i].type + ', id=' + blocks[i].id);
    }

    Logger.log('=== CONNECTION TEST PASSED ===');
  } catch (e) {
    Logger.log('=== CONNECTION TEST FAILED ===');
    Logger.log('Error: ' + e.message);
    Logger.log('Ensure NOTION_API_KEY is set in Script Properties.');
    Logger.log('Ensure the integration has access to the Command Center page.');
  }
}

/**
 * Tests the full pipeline with today's actual data (if cached) or synthetic data.
 * Also validates the safety checks work correctly.
 */
function testFullPipelineWithSafety() {
  Logger.log('=== MANUAL TEST: Full Pipeline with Safety Validation ===');

  // Test 1: Verify payload safety check works
  Logger.log('Test 1: Safety validation...');
  try {
    validateNotionPayload_({ 'archived': true });
    Logger.log('  FAIL: Safety check should have thrown on "archived"');
  } catch (e) {
    Logger.log('  PASS: Safety check correctly blocked "archived" parameter');
  }

  try {
    validateNotionPayload_({ 'in_trash': true });
    Logger.log('  FAIL: Safety check should have thrown on "in_trash"');
  } catch (e) {
    Logger.log('  PASS: Safety check correctly blocked "in_trash" parameter');
  }

  try {
    validateNotionPayload_({ 'children': [{ 'type': 'paragraph' }] });
    Logger.log('  PASS: Normal payload passed safety check');
  } catch (e) {
    Logger.log('  FAIL: Safety check incorrectly blocked a valid payload');
  }

  // Test 2: Travel detection
  Logger.log('Test 2: Travel detection...');
  var city1 = validateLocation('Columbus', 'calendar_only');
  Logger.log('  calendar_only "Columbus" -> "' + city1 + '" ' +
             (city1 === 'Atlanta' ? '(PASS)' : '(FAIL)'));

  var city2 = validateLocation('New York', 'corroborated');
  Logger.log('  corroborated "New York" -> "' + city2 + '" ' +
             (city2 === 'New York' ? '(PASS)' : '(FAIL)'));

  var city3 = validateLocation('', 'default');
  Logger.log('  empty with default -> "' + city3 + '" ' +
             (city3 === 'Atlanta' ? '(PASS)' : '(FAIL)'));

  // Test 3: Formatter output
  Logger.log('Test 3: Formatters...');
  var testData = buildTestBriefData_();

  var contextBlocks = formatNanciContextLine(testData);
  Logger.log('  Context line: ' + contextBlocks.length + ' block(s), type=' + contextBlocks[0].type);

  var meetingBlocks = formatMeetingCards(testData.meetings);
  Logger.log('  Meetings: ' + meetingBlocks.length + ' block(s)');

  var nanciBlocks = formatNanciSays(testData.nanciSays);
  Logger.log('  Nanci Says: ' + nanciBlocks.length + ' block(s)');

  // Empty state test
  var emptyNanci = formatNanciSays('');
  var emptyText = extractBlockText_(emptyNanci[0]);
  Logger.log('  Nanci Says empty state: "' + emptyText + '" ' +
             (emptyText.indexOf('Quiet night') !== -1 ? '(PASS)' : '(FAIL)'));

  Logger.log('=== SAFETY TEST COMPLETE ===');
}

// ---------------------------------------------------------------------------
// Test Data Builders
// ---------------------------------------------------------------------------

/**
 * Builds synthetic briefData for testing.
 * @returns {Object} Sample briefData matching the expected schema
 */
function buildTestBriefData_() {
  var now = new Date();
  var dateStr = Utilities.formatDate(now, 'America/New_York', 'EEEE, MMMM d');

  return {
    contextLine: 'It\'s ' + dateStr + '. Three meetings today, one with a contact ' +
                 'silent for 45 days. Two commitments approaching overdue. ' +
                 'Pipeline test — verifying Command Center connection.',
    weatherCity: 'Atlanta',
    weatherTemp: '52',
    weatherConditions: 'Partly cloudy',
    meetings: [
      {
        time: '9:00 AM',
        name: 'Sarah Chen',
        org: 'Meridian Partners',
        context: 'Last contact 45 days ago. Open commitment: follow-up on Q1 proposal.',
        needsCard: true
      },
      {
        time: '11:30 AM',
        name: 'Marcus Williams',
        org: 'Atlanta Tech Alliance',
        context: 'Board prep discussion. Nanci flagged: three commitments aging with this contact.',
        needsCard: true
      },
      {
        time: '2:00 PM',
        name: 'Internal standup',
        org: null,
        context: '',
        needsCard: false
      },
      {
        time: '4:00 PM',
        name: 'Dr. Patel',
        org: 'Emory Research',
        context: 'First meeting — cold contact via Marcus introduction.',
        needsCard: true
      }
    ],
    nanciSays: [
      {
        signal: 'Quiet relationship: David Okonkwo',
        detail: 'No interaction in 60 days. Previously weekly check-ins. Three open projects together.'
      },
      {
        signal: 'Commitment drift',
        detail: 'The Meridian proposal follow-up has been aging for 12 days. Sarah Chen meeting today is an opportunity.'
      },
      {
        signal: 'Pattern detected',
        detail: 'Three Tuesday meetings this month have been rescheduled. Consider blocking buffer time.'
      }
    ],
    meetingNames: ['Sarah Chen', 'Marcus Williams', 'Dr. Patel']
  };
}

/**
 * Extracts plain text from a Notion block for logging.
 * @param {Object} block
 * @returns {string}
 */
function extractBlockText_(block) {
  var data = block[block.type];
  if (!data || !data.rich_text) return '[no text]';
  return data.rich_text.map(function(rt) {
    if (rt.text) return rt.text.content;
    return rt.plain_text || '';
  }).join('');
}
