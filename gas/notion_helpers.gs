/**
 * notion_helpers.gs
 *
 * Low-level Notion API helper functions for Google Apps Script.
 * Used by the Command Center pipeline and other automations.
 *
 * SAFETY RULE: NEVER pass "archived", "in_trash", or any deletion-related
 * parameters in Notion API calls. Three incidents of accidental page deletion
 * have been documented. See Agent Operating Posture rule #9.
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

var NOTION_API_VERSION = '2022-06-28';

/**
 * Returns Notion API key from Script Properties.
 * @returns {string}
 */
function getNotionApiKey_() {
  var key = PropertiesService.getScriptProperties().getProperty('NOTION_API_KEY');
  if (!key) {
    throw new Error('NOTION_API_KEY not found in Script Properties');
  }
  return key;
}

/**
 * Builds standard headers for Notion API requests.
 * @returns {Object}
 */
function notionHeaders_() {
  return {
    'Authorization': 'Bearer ' + getNotionApiKey_(),
    'Notion-Version': NOTION_API_VERSION,
    'Content-Type': 'application/json'
  };
}

// ---------------------------------------------------------------------------
// Core API Wrappers
// ---------------------------------------------------------------------------

/**
 * Makes a GET request to the Notion API with retry logic.
 * @param {string} endpoint - API endpoint path (e.g., '/blocks/abc123/children')
 * @param {Object} [queryParams] - Optional query parameters
 * @returns {Object} Parsed JSON response
 */
function notionGet_(endpoint, queryParams) {
  var url = 'https://api.notion.com/v1' + endpoint;

  if (queryParams) {
    var params = [];
    for (var key in queryParams) {
      params.push(encodeURIComponent(key) + '=' + encodeURIComponent(queryParams[key]));
    }
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
  }

  var options = {
    'method': 'get',
    'headers': notionHeaders_(),
    'muteHttpExceptions': true
  };

  return notionRequestWithRetry_(url, options);
}

/**
 * Makes a POST request to the Notion API with retry logic.
 *
 * SAFETY: This function validates payloads to prevent accidental
 * archive/trash operations. It will throw if forbidden keys are detected.
 *
 * @param {string} endpoint - API endpoint path
 * @param {Object} payload - Request body
 * @returns {Object} Parsed JSON response
 */
function notionPost_(endpoint, payload) {
  // SAFETY CHECK: reject payloads containing archive/trash parameters
  validateNotionPayload_(payload);

  var url = 'https://api.notion.com/v1' + endpoint;
  var options = {
    'method': 'post',
    'headers': notionHeaders_(),
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true
  };

  return notionRequestWithRetry_(url, options);
}

/**
 * Makes a PATCH request to the Notion API with retry logic.
 *
 * SAFETY: This function validates payloads to prevent accidental
 * archive/trash operations.
 *
 * @param {string} endpoint - API endpoint path
 * @param {Object} payload - Request body
 * @returns {Object} Parsed JSON response
 */
function notionPatch_(endpoint, payload) {
  // SAFETY CHECK: reject payloads containing archive/trash parameters
  validateNotionPayload_(payload);

  var url = 'https://api.notion.com/v1' + endpoint;
  var options = {
    'method': 'patch',
    'headers': notionHeaders_(),
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true
  };

  return notionRequestWithRetry_(url, options);
}

/**
 * Makes a DELETE request to the Notion API with retry logic.
 * Used ONLY for deleting blocks (not pages). The Notion "delete block"
 * endpoint is the standard way to remove content blocks before replacing them.
 *
 * @param {string} endpoint - API endpoint path (e.g., '/blocks/abc123')
 * @returns {Object} Parsed JSON response
 */
function notionDelete_(endpoint) {
  var url = 'https://api.notion.com/v1' + endpoint;
  var options = {
    'method': 'delete',
    'headers': notionHeaders_(),
    'muteHttpExceptions': true
  };

  return notionRequestWithRetry_(url, options);
}

// ---------------------------------------------------------------------------
// Safety Validation
// ---------------------------------------------------------------------------

/**
 * Validates a Notion API payload to prevent accidental archive/trash operations.
 * Throws an error if forbidden keys are found at any level of the payload.
 *
 * @param {Object} payload - The payload to validate
 * @throws {Error} If forbidden keys are detected
 */
function validateNotionPayload_(payload) {
  var FORBIDDEN_KEYS = ['archived', 'in_trash'];
  var payloadStr = JSON.stringify(payload);

  for (var i = 0; i < FORBIDDEN_KEYS.length; i++) {
    // Check for the key appearing anywhere in the serialized payload
    var pattern = '"' + FORBIDDEN_KEYS[i] + '"';
    if (payloadStr.indexOf(pattern) !== -1) {
      throw new Error(
        'SAFETY VIOLATION: Notion API payload contains forbidden key "' +
        FORBIDDEN_KEYS[i] + '". This parameter is never allowed. ' +
        'See Agent Operating Posture rule #9.'
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Retry Logic
// ---------------------------------------------------------------------------

/**
 * Executes a Notion API request with exponential backoff retry.
 * Retries on 429 (rate limit) and 5xx errors.
 *
 * @param {string} url - Full request URL
 * @param {Object} options - UrlFetchApp options
 * @returns {Object} Parsed JSON response
 */
function notionRequestWithRetry_(url, options) {
  var MAX_RETRIES = 3;
  var BASE_DELAY_MS = 500;

  for (var attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();

    if (code >= 200 && code < 300) {
      var text = response.getContentText();
      return text ? JSON.parse(text) : {};
    }

    // Rate limited or server error — retry with backoff
    if ((code === 429 || code >= 500) && attempt < MAX_RETRIES) {
      var delay = BASE_DELAY_MS * Math.pow(2, attempt);
      Logger.log('Notion API ' + code + ' on attempt ' + (attempt + 1) +
                 ', retrying in ' + delay + 'ms: ' + url);
      Utilities.sleep(delay);
      continue;
    }

    // Non-retryable error or max retries exceeded
    var errorBody = response.getContentText();
    Logger.log('Notion API error ' + code + ': ' + errorBody);
    throw new Error('Notion API request failed (' + code + '): ' + errorBody);
  }
}

// ---------------------------------------------------------------------------
// Block Operations
// ---------------------------------------------------------------------------

/**
 * Fetches all child blocks of a given block/page, handling pagination.
 *
 * @param {string} blockId - The parent block or page ID
 * @returns {Array} Array of block objects
 */
function getChildBlocks_(blockId) {
  var allBlocks = [];
  var hasMore = true;
  var startCursor = null;

  while (hasMore) {
    var params = { 'page_size': '100' };
    if (startCursor) {
      params['start_cursor'] = startCursor;
    }

    var result = notionGet_('/blocks/' + blockId + '/children', params);

    if (result.results) {
      allBlocks = allBlocks.concat(result.results);
    }

    hasMore = result.has_more || false;
    startCursor = result.next_cursor || null;
  }

  return allBlocks;
}

/**
 * Appends child blocks to a parent block.
 *
 * @param {string} parentBlockId - The parent block ID to append to
 * @param {Array} children - Array of Notion block objects to append
 * @returns {Object} API response
 */
function appendBlocks_(parentBlockId, children) {
  if (!children || children.length === 0) {
    return { results: [] };
  }

  // Notion API limits to 100 blocks per append call
  var BATCH_SIZE = 100;
  var allResults = [];

  for (var i = 0; i < children.length; i += BATCH_SIZE) {
    var batch = children.slice(i, i + BATCH_SIZE);
    var result = notionPatch_('/blocks/' + parentBlockId + '/children', {
      'children': batch
    });
    if (result.results) {
      allResults = allResults.concat(result.results);
    }
    // Small delay between batches to respect rate limits
    if (i + BATCH_SIZE < children.length) {
      Utilities.sleep(350);
    }
  }

  return { results: allResults };
}

/**
 * Deletes a single block by ID.
 *
 * @param {string} blockId - The block ID to delete
 * @returns {Object} API response
 */
function deleteBlock_(blockId) {
  return notionDelete_('/blocks/' + blockId);
}

/**
 * Deletes all child blocks under a parent block.
 * Used to clear a section before writing fresh content.
 *
 * @param {string} parentBlockId - The parent block whose children to delete
 */
function deleteChildBlocks_(parentBlockId) {
  var children = getChildBlocks_(parentBlockId);

  for (var i = 0; i < children.length; i++) {
    deleteBlock_(children[i].id);
    // Rate limit protection: small delay between deletes
    if (i < children.length - 1) {
      Utilities.sleep(200);
    }
  }
}

// ---------------------------------------------------------------------------
// Database Queries
// ---------------------------------------------------------------------------

/**
 * Queries a Notion database with a filter and optional sorts.
 *
 * @param {string} databaseId - The database ID to query
 * @param {Object} [filter] - Notion filter object
 * @param {Array} [sorts] - Notion sorts array
 * @param {number} [pageSize] - Results per page (default 100)
 * @returns {Array} Array of page/row objects
 */
function queryDatabase_(databaseId, filter, sorts, pageSize) {
  var payload = {};
  if (filter) payload.filter = filter;
  if (sorts) payload.sorts = sorts;
  payload.page_size = pageSize || 100;

  var allResults = [];
  var hasMore = true;
  var startCursor = null;

  while (hasMore) {
    if (startCursor) {
      payload.start_cursor = startCursor;
    }

    var result = notionPost_('/databases/' + databaseId + '/query', payload);

    if (result.results) {
      allResults = allResults.concat(result.results);
    }

    hasMore = result.has_more || false;
    startCursor = result.next_cursor || null;
  }

  return allResults;
}

// ---------------------------------------------------------------------------
// Block Builders
// ---------------------------------------------------------------------------

/**
 * Creates a paragraph block.
 * @param {string|Array} content - Text string or array of rich text objects
 * @returns {Object} Notion paragraph block
 */
function paragraphBlock_(content) {
  var richText;
  if (typeof content === 'string') {
    richText = [{ 'type': 'text', 'text': { 'content': content } }];
  } else {
    richText = content;
  }

  return {
    'object': 'block',
    'type': 'paragraph',
    'paragraph': {
      'rich_text': richText
    }
  };
}

/**
 * Creates a rich text segment with optional annotations.
 * @param {string} text - The text content
 * @param {Object} [annotations] - Bold, italic, etc.
 * @returns {Object} Notion rich text object
 */
function richText_(text, annotations) {
  var rt = {
    'type': 'text',
    'text': { 'content': text }
  };
  if (annotations) {
    rt.annotations = annotations;
  }
  return rt;
}

/**
 * Creates a callout block.
 * @param {string} icon - Emoji for the callout icon
 * @param {string|Array} content - Text string or array of rich text objects
 * @returns {Object} Notion callout block
 */
function calloutBlock_(icon, content) {
  var richText;
  if (typeof content === 'string') {
    richText = [{ 'type': 'text', 'text': { 'content': content } }];
  } else {
    richText = content;
  }

  return {
    'object': 'block',
    'type': 'callout',
    'callout': {
      'icon': { 'type': 'emoji', 'emoji': icon },
      'rich_text': richText
    }
  };
}

/**
 * Creates a divider block.
 * @returns {Object} Notion divider block
 */
function dividerBlock_() {
  return {
    'object': 'block',
    'type': 'divider',
    'divider': {}
  };
}

/**
 * Creates a heading_3 block.
 * @param {string} text - Heading text
 * @returns {Object} Notion heading_3 block
 */
function heading3Block_(text) {
  return {
    'object': 'block',
    'type': 'heading_3',
    'heading_3': {
      'rich_text': [{ 'type': 'text', 'text': { 'content': text } }]
    }
  };
}

/**
 * Creates a bulleted list item block.
 * @param {string|Array} content - Text string or array of rich text objects
 * @returns {Object} Notion bulleted list item block
 */
function bulletBlock_(content) {
  var richText;
  if (typeof content === 'string') {
    richText = [{ 'type': 'text', 'text': { 'content': content } }];
  } else {
    richText = content;
  }

  return {
    'object': 'block',
    'type': 'bulleted_list_item',
    'bulleted_list_item': {
      'rich_text': richText
    }
  };
}

/**
 * Creates a toggle block with children.
 * @param {string|Array} content - Toggle header text
 * @param {Array} children - Child blocks inside the toggle
 * @returns {Object} Notion toggle block
 */
function toggleBlock_(content, children) {
  var richText;
  if (typeof content === 'string') {
    richText = [{ 'type': 'text', 'text': { 'content': content } }];
  } else {
    richText = content;
  }

  var block = {
    'object': 'block',
    'type': 'toggle',
    'toggle': {
      'rich_text': richText
    }
  };

  if (children && children.length > 0) {
    block.toggle.children = children;
  }

  return block;
}
