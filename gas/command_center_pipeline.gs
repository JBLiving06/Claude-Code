/**
 * command_center_pipeline.gs
 *
 * Main orchestration for updating the Notion Command Center page with
 * Morning Brief intelligence. This module finds the four target sections
 * on the page and replaces their content while preserving the page layout.
 *
 * Target sections:
 *   1. Nanci Context Line — callout block with 🕷️ icon
 *   2. Today's Meetings — heading + content blocks below it
 *   3. Commitments — heading + content blocks below it
 *   4. Nanci Says — heading + content blocks below it
 *
 * SAFETY: All Notion operations are wrapped in try/catch. Failure here
 * must NEVER prevent the Morning Brief email from sending.
 *
 * SAFETY: NEVER pass "archived", "in_trash", or deletion-related parameters.
 */

// ---------------------------------------------------------------------------
// Section Identification
// ---------------------------------------------------------------------------

/**
 * Fetches the Command Center page blocks and identifies the four target
 * sections by heading text or block type.
 *
 * The page uses a column layout. The function must traverse into column_list
 * and column blocks to find sections nested inside columns.
 *
 * @param {string} pageId - The Command Center page ID
 * @returns {Object} Section map: { nanciContext, todaysMeetings, commitments, nanciSays }
 *   Each entry: { headingBlockId, contentBlockIds, parentBlockId }
 */
function findCommandCenterSections(pageId) {
  var sections = {
    nanciContext: null,      // Callout block with 🕷️
    todaysMeetings: null,    // "Today's Meetings" heading
    commitments: null,       // "Commitments" heading
    nanciSays: null          // "Nanci Says" heading
  };

  var topBlocks = getChildBlocks_(pageId);
  scanBlocksForSections_(topBlocks, pageId, sections);

  return sections;
}

/**
 * Recursively scans blocks to find the four target sections.
 * Handles column_list > column nesting.
 *
 * @param {Array} blocks - Array of Notion block objects
 * @param {string} parentId - ID of the parent containing these blocks
 * @param {Object} sections - Section map to populate (mutated in place)
 */
function scanBlocksForSections_(blocks, parentId, sections) {
  for (var i = 0; i < blocks.length; i++) {
    var block = blocks[i];

    // Check for Nanci context callout (🕷️ icon)
    if (block.type === 'callout' && !sections.nanciContext) {
      var icon = block.callout && block.callout.icon;
      if (icon && icon.type === 'emoji' && icon.emoji === '\uD83D\uDD77\uFE0F') {
        sections.nanciContext = {
          blockId: block.id,
          parentBlockId: parentId,
          type: 'callout'
        };
      }
    }

    // Check for target headings
    if (isHeadingBlock_(block)) {
      var headingText = getHeadingText_(block).toLowerCase().trim();

      if (headingText.indexOf("today's meetings") !== -1 ||
          headingText.indexOf('todays meetings') !== -1 ||
          headingText.indexOf('today\u2019s meetings') !== -1) {
        sections.todaysMeetings = buildSectionInfo_(blocks, i, parentId);
      }

      if (headingText.indexOf('commitments') !== -1 && !sections.commitments) {
        sections.commitments = buildSectionInfo_(blocks, i, parentId);
      }

      if (headingText.indexOf('nanci says') !== -1) {
        sections.nanciSays = buildSectionInfo_(blocks, i, parentId);
      }
    }

    // Recurse into column_list and column blocks
    if (block.type === 'column_list' || block.type === 'column') {
      var childBlocks;
      try {
        childBlocks = getChildBlocks_(block.id);
      } catch (e) {
        Logger.log('Could not fetch children of ' + block.type + ' ' + block.id + ': ' + e.message);
        continue;
      }
      scanBlocksForSections_(childBlocks, block.id, sections);
    }
  }
}

/**
 * Builds section info for a heading-based section.
 * Identifies the heading block and all content blocks between it and the
 * next heading (or end of parent).
 *
 * @param {Array} blocks - Array of blocks at this level
 * @param {number} headingIndex - Index of the heading block
 * @param {string} parentId - Parent block ID
 * @returns {Object} { headingBlockId, contentBlockIds, parentBlockId }
 */
function buildSectionInfo_(blocks, headingIndex, parentId) {
  var headingBlock = blocks[headingIndex];
  var contentBlockIds = [];

  // Collect all blocks after the heading until the next heading or end
  for (var j = headingIndex + 1; j < blocks.length; j++) {
    if (isHeadingBlock_(blocks[j])) {
      break;  // Stop at next heading
    }
    contentBlockIds.push(blocks[j].id);
  }

  return {
    headingBlockId: headingBlock.id,
    contentBlockIds: contentBlockIds,
    parentBlockId: parentId,
    type: 'heading_section'
  };
}

/**
 * Checks if a block is any heading type.
 * @param {Object} block
 * @returns {boolean}
 */
function isHeadingBlock_(block) {
  return block.type === 'heading_1' ||
         block.type === 'heading_2' ||
         block.type === 'heading_3';
}

/**
 * Extracts plain text from a heading block.
 * @param {Object} block
 * @returns {string}
 */
function getHeadingText_(block) {
  var data = block[block.type];
  if (!data || !data.rich_text) return '';
  return data.rich_text.map(function(rt) { return rt.plain_text || ''; }).join('');
}

// ---------------------------------------------------------------------------
// Content Replacement
// ---------------------------------------------------------------------------

/**
 * Replaces the content blocks of a heading-based section.
 * Deletes existing content blocks (between this heading and the next),
 * then appends new blocks after the heading.
 *
 * @param {Object} sectionInfo - From findCommandCenterSections
 * @param {Array} newBlocks - Notion block objects to insert
 */
function replaceSectionContent(sectionInfo, newBlocks) {
  if (!sectionInfo) {
    Logger.log('Section not found — skipping replacement');
    return;
  }

  // Delete existing content blocks
  if (sectionInfo.contentBlockIds && sectionInfo.contentBlockIds.length > 0) {
    for (var i = 0; i < sectionInfo.contentBlockIds.length; i++) {
      try {
        deleteBlock_(sectionInfo.contentBlockIds[i]);
        // Rate limit protection
        if (i < sectionInfo.contentBlockIds.length - 1) {
          Utilities.sleep(200);
        }
      } catch (e) {
        Logger.log('Failed to delete block ' + sectionInfo.contentBlockIds[i] + ': ' + e.message);
      }
    }
  }

  // Append new blocks after the heading
  // For heading-based sections, the new blocks go under the parent
  // They'll appear after the heading because existing content was removed
  if (newBlocks && newBlocks.length > 0) {
    // We need to append to the parent that contains the heading.
    // The Notion API appends blocks at the END of the parent's children.
    // Since we deleted the content between headings, the new blocks
    // will appear after the heading.
    //
    // HOWEVER: If there are blocks AFTER this section (e.g., next heading),
    // appending to the parent would put our new content at the very end.
    //
    // Strategy: Use the heading's parent and the "after" parameter if available.
    // The Notion API v2022-06-28 supports appending after a specific block.
    appendBlocksAfter_(sectionInfo.headingBlockId, sectionInfo.parentBlockId, newBlocks);
  }
}

/**
 * Appends blocks after a specific block within a parent.
 * Uses the "after" parameter in the Notion API.
 *
 * @param {string} afterBlockId - The block to insert after
 * @param {string} parentBlockId - The parent block ID
 * @param {Array} newBlocks - Blocks to append
 */
function appendBlocksAfter_(afterBlockId, parentBlockId, newBlocks) {
  if (!newBlocks || newBlocks.length === 0) return;

  // The Notion API append endpoint supports "after" parameter
  var BATCH_SIZE = 100;

  for (var i = 0; i < newBlocks.length; i += BATCH_SIZE) {
    var batch = newBlocks.slice(i, i + BATCH_SIZE);
    var payload = {
      'children': batch,
      'after': afterBlockId
    };

    var result = notionPatch_('/blocks/' + parentBlockId + '/children', payload);

    // Update afterBlockId to the last inserted block for correct ordering
    if (result.results && result.results.length > 0) {
      afterBlockId = result.results[result.results.length - 1].id;
    }

    if (i + BATCH_SIZE < newBlocks.length) {
      Utilities.sleep(350);
    }
  }
}

/**
 * Updates the Nanci context line callout block.
 * Instead of deleting and recreating, we update the existing callout's text.
 *
 * @param {Object} sectionInfo - From findCommandCenterSections (nanciContext)
 * @param {Array} richTextContent - Rich text array for the callout
 */
function updateCalloutBlock(sectionInfo, richTextContent) {
  if (!sectionInfo || !sectionInfo.blockId) {
    Logger.log('Nanci context callout not found — skipping');
    return;
  }

  var payload = {
    'callout': {
      'rich_text': richTextContent,
      'icon': { 'type': 'emoji', 'emoji': '\uD83D\uDD77\uFE0F' }  // 🕷️
    }
  };

  notionPatch_('/blocks/' + sectionInfo.blockId, payload);
}

// ---------------------------------------------------------------------------
// Main Orchestrator
// ---------------------------------------------------------------------------

/**
 * Updates the Command Center page with fresh Morning Brief intelligence.
 *
 * This is the main entry point called after the Morning Brief email is sent.
 * It writes to four sections: Nanci context line, Today's Meetings,
 * Commitments, and Nanci Says.
 *
 * SAFETY: This entire function is wrapped in try/catch at the call site
 * (in the Morning Brief flow). Additionally, each section update is
 * independently wrapped to allow partial success.
 *
 * @param {Object} briefData - The Morning Brief data object containing:
 *   @param {string} briefData.contextLine - Nanci context sentence
 *   @param {string} briefData.weatherCity - City name
 *   @param {string} briefData.weatherTemp - Temperature
 *   @param {string} briefData.weatherConditions - Weather conditions
 *   @param {Array} briefData.meetings - Meeting intelligence array
 *   @param {string|Array} briefData.nanciSays - Overnight intelligence synthesis
 *   @param {Array<string>} [briefData.meetingNames] - Names of today's meeting contacts
 */
function updateCommandCenter(briefData) {
  Logger.log('Command Center update starting...');
  var startTime = new Date().getTime();

  if (!briefData) {
    Logger.log('No briefData provided — aborting Command Center update');
    return;
  }

  // Step 1: Find the four target sections on the page
  Logger.log('Finding Command Center sections...');
  var sections;
  try {
    sections = findCommandCenterSections(COMMAND_CENTER_PAGE_ID);
  } catch (e) {
    Logger.log('FATAL: Could not read Command Center page structure: ' + e.message);
    return;
  }

  logSectionsFound_(sections);

  // Step 2: Update Nanci Context Line (callout block — in-place update)
  try {
    Logger.log('Updating Nanci context line...');
    var contextBlocks = formatNanciContextLine(briefData);
    if (sections.nanciContext) {
      // Extract the rich text from the formatted callout block
      var calloutRichText = contextBlocks[0].callout.rich_text;
      updateCalloutBlock(sections.nanciContext, calloutRichText);
      Logger.log('Nanci context line updated.');
    } else {
      Logger.log('WARNING: Nanci context callout (🕷️) not found on page.');
    }
  } catch (e) {
    Logger.log('ERROR updating Nanci context line: ' + e.message);
  }

  // Step 3: Update Today's Meetings
  try {
    Logger.log('Updating Today\'s Meetings...');
    var meetingBlocks = formatMeetingCards(briefData.meetings || []);
    replaceSectionContent(sections.todaysMeetings, meetingBlocks);
    Logger.log('Today\'s Meetings updated (' + meetingBlocks.length + ' blocks).');
  } catch (e) {
    Logger.log('ERROR updating Today\'s Meetings: ' + e.message);
  }

  // Step 4: Update Commitments
  try {
    Logger.log('Updating Commitments...');
    var commitmentBlocks = formatCommitments(briefData.meetingNames || []);
    replaceSectionContent(sections.commitments, commitmentBlocks);
    Logger.log('Commitments updated (' + commitmentBlocks.length + ' blocks).');
  } catch (e) {
    Logger.log('ERROR updating Commitments: ' + e.message);
  }

  // Step 5: Update Nanci Says
  try {
    Logger.log('Updating Nanci Says...');
    var nanciBlocks = formatNanciSays(briefData.nanciSays);
    replaceSectionContent(sections.nanciSays, nanciBlocks);
    Logger.log('Nanci Says updated (' + nanciBlocks.length + ' blocks).');
  } catch (e) {
    Logger.log('ERROR updating Nanci Says: ' + e.message);
  }

  var elapsed = new Date().getTime() - startTime;
  Logger.log('Command Center update complete in ' + elapsed + 'ms.');
}

/**
 * Logs which sections were found during page scan.
 * @param {Object} sections
 */
function logSectionsFound_(sections) {
  var found = [];
  var missing = [];

  if (sections.nanciContext) found.push('Nanci Context'); else missing.push('Nanci Context');
  if (sections.todaysMeetings) found.push("Today's Meetings"); else missing.push("Today's Meetings");
  if (sections.commitments) found.push('Commitments'); else missing.push('Commitments');
  if (sections.nanciSays) found.push('Nanci Says'); else missing.push('Nanci Says');

  Logger.log('Sections found: ' + found.join(', '));
  if (missing.length > 0) {
    Logger.log('WARNING — Sections NOT found: ' + missing.join(', '));
  }
}
