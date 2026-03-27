/**
 * generateMorningBriefV3.gs
 * Morning Brief generation - runs daily at 6:45 AM.
 *
 * This file adds the Commitments section that shows what Jeff owes
 * people before he meets them.
 */

var COMMITMENTS_IN_BRIEF_ENABLED = PropertiesService.getScriptProperties().getProperty('COMMITMENTS_IN_BRIEF_ENABLED') || 'false';

/**
 * Main Morning Brief generator. Called by daily trigger at 6:45 AM.
 * Add buildCommitmentsSection() into the existing brief assembly.
 */
function generateMorningBriefV3() {
  var html = '';

  // --- Existing sections (calendar, weather, priorities, etc.) ---
  html += buildCalendarSection_();
  // html += buildWeatherSection_();
  // html += buildPrioritiesSection_();

  // --- NEW: Commitments before meetings ---
  if (COMMITMENTS_IN_BRIEF_ENABLED === 'true') {
    var todayMeetings = getTodayMeetingAttendees_();
    var commitmentsHtml = buildCommitmentsSection(todayMeetings);
    if (commitmentsHtml) {
      html += commitmentsHtml;
    }
  }

  // --- Send the brief ---
  // sendMorningBrief_(html);
  Logger.log('Morning Brief generated. Commitments enabled: ' + COMMITMENTS_IN_BRIEF_ENABLED);
  return html;
}

/**
 * Extracts unique attendee names from today's calendar events.
 * @return {string[]} Array of person names meeting with Jeff today
 * @private
 */
function getTodayMeetingAttendees_() {
  var today = new Date();
  var startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
  var endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  var calendar = CalendarApp.getDefaultCalendar();
  var events = calendar.getEvents(startOfDay, endOfDay);
  var myEmail = Session.getActiveUser().getEmail();

  var attendeeNames = {};

  events.forEach(function(event) {
    var guests = event.getGuestList(false);
    guests.forEach(function(guest) {
      var email = guest.getEmail();
      if (email !== myEmail) {
        var name = guest.getName() || email.split('@')[0];
        // Normalize: use first + last name, trim whitespace
        name = name.trim();
        if (name && !attendeeNames[name]) {
          attendeeNames[name] = true;
        }
      }
    });
  });

  return Object.keys(attendeeNames);
}

/**
 * Builds the HTML commitments section for the Morning Brief.
 * Shows what Jeff owes each person he's meeting today.
 *
 * @param {string[]} attendeeNames - Names of people in today's meetings
 * @return {string|null} HTML string or null if no commitments
 */
function buildCommitmentsSection(attendeeNames) {
  if (!attendeeNames || attendeeNames.length === 0) return null;

  var commitmentsByPerson = getCommitmentsForPeople(attendeeNames);
  var personNames = Object.keys(commitmentsByPerson);

  if (personNames.length === 0) return null;

  var html = '';
  html += '<div style="margin-top: 24px; padding: 16px; background-color: #FFF8E1; border-left: 4px solid #FF8F00; border-radius: 4px;">';
  html += '<h2 style="margin: 0 0 12px 0; color: #E65100; font-size: 18px;">&#9888; Commitments Before Meetings</h2>';

  personNames.forEach(function(person) {
    var commitments = commitmentsByPerson[person];
    var hasAging = commitments.some(function(c) { return c.isAging; });

    html += '<div style="margin-bottom: 16px;">';
    html += '<p style="margin: 0 0 6px 0; font-size: 15px;">';
    html += 'Before your meeting with <strong style="color: #1a1a1a;">' + escapeHtml_(person) + '</strong>:';
    html += '</p>';

    html += '<ul style="margin: 0; padding-left: 20px; list-style-type: disc;">';

    commitments.forEach(function(c) {
      var ageLabel = c.ageDays + ' day' + (c.ageDays !== 1 ? 's' : '') + ' old';

      if (c.isAging) {
        html += '<li style="margin-bottom: 6px; color: #C62828;">';
        html += '<strong style="color: #C62828;">&#128680; AGING:</strong> ';
        html += escapeHtml_(c.title);
        html += ' <span style="font-size: 12px; color: #C62828;">(' + ageLabel + ')</span>';
      } else {
        html += '<li style="margin-bottom: 6px; color: #333;">';
        html += 'You owe: ' + escapeHtml_(c.title);
        html += ' <span style="font-size: 12px; color: #888;">(' + ageLabel + ')</span>';
      }

      if (c.ownershipDirection === 'Mutual') {
        html += ' <span style="font-size: 11px; background: #E3F2FD; padding: 1px 6px; border-radius: 3px;">mutual</span>';
      }

      html += '</li>';
    });

    html += '</ul>';
    html += '</div>';
  });

  html += '</div>';
  return html;
}

/**
 * Stub for existing calendar section builder.
 * Replace with actual implementation.
 * @private
 */
function buildCalendarSection_() {
  return '';
}

/**
 * HTML-escapes a string to prevent injection in email HTML.
 * @private
 */
function escapeHtml_(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Test: Generate the commitments section with mock data for preview.
 */
function testCommitmentsInBrief() {
  // Override with real attendee names for testing
  var testAttendees = ['Sarah Johnson', 'Mike Chen'];
  var html = buildCommitmentsSection(testAttendees);
  Logger.log(html || 'No commitments found for test attendees.');
}

/**
 * Test: Full Morning Brief generation including commitments.
 */
function testFullMorningBrief() {
  var html = generateMorningBriefV3();
  Logger.log(html);
}
