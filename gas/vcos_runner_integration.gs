/**
 * vcos_runner_integration.gs
 *
 * Integration code for the existing vcos_runner.gs Morning Brief pipeline.
 *
 * HOW TO INTEGRATE:
 * This file contains the exact code to add to vcos_runner.gs to connect
 * the Morning Brief to the Command Center. The integration point is
 * AFTER the email send succeeds. The Notion write is fully isolated —
 * if it fails, the email has already been delivered.
 *
 * OPTION A: Add updateCommandCenter() call directly to the existing
 *           Morning Brief function in vcos_runner.gs (see below).
 *
 * OPTION B: If the Morning Brief already uses most of the 6-minute GAS
 *           execution limit, schedule a separate trigger that runs 1-2
 *           minutes after the email send. See scheduleDeferredUpdate_().
 *
 * -----------------------------------------------------------------------
 * INTEGRATION EXAMPLE (paste into vcos_runner.gs after email send):
 *
 *   // --- EXISTING CODE: email send ---
 *   sendEmail(briefHtml, subject, recipientEmail);
 *   Logger.log('Morning Brief email sent successfully.');
 *
 *   // --- NEW: Command Center update (added by Orchestrator Brief 11) ---
 *   try {
 *     var briefData = {
 *       contextLine: contextLine,        // from existing brief generation
 *       weatherCity: weatherCity,         // from weather fetch
 *       weatherTemp: weatherTemp,         // from weather fetch
 *       weatherConditions: weatherCond,   // from weather fetch
 *       meetings: meetingCards,           // from meeting intelligence
 *       nanciSays: nanciSynthesis,        // from overnight synthesis
 *       meetingNames: meetingContactNames // names for commitment matching
 *     };
 *     updateCommandCenter(briefData);
 *   } catch (e) {
 *     Logger.log('Command Center update failed (email already sent): ' + e.message);
 *   }
 *   // --- END Command Center integration ---
 *
 * -----------------------------------------------------------------------
 */

// ---------------------------------------------------------------------------
// Option B: Deferred execution (if 6-minute limit is a concern)
// ---------------------------------------------------------------------------

/**
 * Schedules a deferred Command Center update to run 2 minutes later.
 * Use this if the Morning Brief generation + email already consumes
 * most of the 6-minute execution window.
 *
 * Call this instead of updateCommandCenter() directly:
 *
 *   try {
 *     scheduleDeferredCommandCenterUpdate_(briefData);
 *   } catch (e) {
 *     Logger.log('Failed to schedule deferred update: ' + e.message);
 *   }
 */
function scheduleDeferredCommandCenterUpdate_(briefData) {
  // Store briefData in cache for the deferred function to pick up
  var cache = CacheService.getScriptCache();
  cache.put('PENDING_BRIEF_DATA', JSON.stringify(briefData), 600); // 10 min TTL

  // Create a one-time trigger to run in 2 minutes
  ScriptApp.newTrigger('runDeferredCommandCenterUpdate')
    .timeBased()
    .after(2 * 60 * 1000) // 2 minutes
    .create();

  Logger.log('Deferred Command Center update scheduled for ~2 minutes from now.');
}

/**
 * Executed by the deferred trigger. Retrieves cached briefData and
 * runs the Command Center update.
 */
function runDeferredCommandCenterUpdate() {
  Logger.log('Deferred Command Center update starting...');

  // Clean up the trigger
  cleanupDeferredTrigger_();

  // Retrieve cached briefData
  var cache = CacheService.getScriptCache();
  var cachedData = cache.get('PENDING_BRIEF_DATA');

  if (!cachedData) {
    Logger.log('No cached briefData found. Deferred update aborted.');
    return;
  }

  try {
    var briefData = JSON.parse(cachedData);
    updateCommandCenter(briefData);
    Logger.log('Deferred Command Center update completed successfully.');
  } catch (e) {
    Logger.log('Deferred Command Center update failed: ' + e.message);
  } finally {
    // Clear the cache
    cache.remove('PENDING_BRIEF_DATA');
  }
}

/**
 * Cleans up one-time triggers for deferred updates.
 */
function cleanupDeferredTrigger_() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'runDeferredCommandCenterUpdate') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

// ---------------------------------------------------------------------------
// Brief Data Adapter
// ---------------------------------------------------------------------------

/**
 * Adapts existing Morning Brief variables into the briefData structure
 * expected by updateCommandCenter().
 *
 * Use this if the Morning Brief stores data in different variable names.
 * Customize the mapping to match the actual variable names in vcos_runner.gs.
 *
 * @param {Object} morningBriefVars - Object containing the Morning Brief variables
 * @returns {Object} Standardized briefData object
 *
 * Example usage:
 *   var briefData = adaptMorningBriefData({
 *     context: generatedContext,
 *     city: 'Atlanta',
 *     temp: currentTemp,
 *     conditions: currentConditions,
 *     meetingIntel: processedMeetings,
 *     synthesis: overnightSynthesis,
 *     contactNames: meetingContactList
 *   });
 */
function adaptMorningBriefData(morningBriefVars) {
  return {
    contextLine: morningBriefVars.context || morningBriefVars.contextLine || '',
    weatherCity: morningBriefVars.city || morningBriefVars.weatherCity || 'Atlanta',
    weatherTemp: morningBriefVars.temp || morningBriefVars.weatherTemp || '',
    weatherConditions: morningBriefVars.conditions || morningBriefVars.weatherConditions || '',
    meetings: morningBriefVars.meetingIntel || morningBriefVars.meetings || [],
    nanciSays: morningBriefVars.synthesis || morningBriefVars.nanciSays || '',
    meetingNames: morningBriefVars.contactNames || morningBriefVars.meetingNames || []
  };
}

// ---------------------------------------------------------------------------
// Travel Detection Safeguard
// ---------------------------------------------------------------------------

/**
 * TRAVEL DETECTION RULE:
 *
 * Hotel bookings and flights on Jeff's calendar are NOT necessarily Jeff's
 * travel. Documented false positives:
 *   - Donovan Livingston's Delta flights (nephew's travel, not Jeff's)
 *   - Columbus hotel booked for a friend
 *
 * This function validates location assertions before they reach the
 * Command Center. If the location was derived solely from calendar
 * hotel/flight events, it reverts to the default (Atlanta).
 *
 * @param {string} assertedCity - The city the pipeline thinks Jeff is in
 * @param {string} locationSource - How the location was determined
 *   Acceptable values: 'default', 'manual_override', 'corroborated', 'calendar_only'
 * @returns {string} Validated city name
 */
function validateLocation(assertedCity, locationSource) {
  // Default to Atlanta unless there is overwhelming corroborating evidence
  var DEFAULT_CITY = 'Atlanta';

  if (!assertedCity || assertedCity.trim().length === 0) {
    return DEFAULT_CITY;
  }

  // If location was determined solely from calendar hotel/flight events,
  // do NOT use it. This is a documented failure mode.
  if (locationSource === 'calendar_only') {
    Logger.log('TRAVEL DETECTION: Rejecting calendar-only location "' +
               assertedCity + '". Defaulting to ' + DEFAULT_CITY + '.');
    return DEFAULT_CITY;
  }

  // Accepted sources: manual override, corroborated by multiple signals, default
  if (locationSource === 'manual_override' ||
      locationSource === 'corroborated' ||
      locationSource === 'default') {
    return assertedCity;
  }

  // Unknown source — default to safety
  Logger.log('TRAVEL DETECTION: Unknown location source "' +
             locationSource + '". Defaulting to ' + DEFAULT_CITY + '.');
  return DEFAULT_CITY;
}
