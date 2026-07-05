const request = require('request');

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 300;

const transientErrorCodes = new Set([
    'ECONNRESET',
    'ETIMEDOUT',
    'ESOCKETTIMEDOUT',
    'ECONNREFUSED',
    'EAI_AGAIN',
    'EHOSTUNREACH',
    'ENOTFOUND',
    'EPROTO',
    'EPIPE',
]);

const isTransientError = (error) => {
    if (!error) return false;
    return transientErrorCodes.has(error.code)
        || /socket hang up|network|reset|timed out/i.test(error.message || '');
};

const isTransientStatus = (response) => {
    if (!response) return true;
    return response.statusCode === 429 || response.statusCode >= 500;
};

const requestWithRetry = (url, options, callback) => {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    const settings = options || {};
    const maxAttempts = settings.maxAttempts || DEFAULT_MAX_ATTEMPTS;
    const timeout = settings.timeout || DEFAULT_TIMEOUT_MS;
    const retryDelayMs = settings.retryDelayMs || DEFAULT_RETRY_DELAY_MS;

    const attemptRequest = (attemptNumber) => {
        const requestOptions = { timeout, ...settings };
        delete requestOptions.maxAttempts;
        delete requestOptions.retryDelayMs;

        request(url, requestOptions, (error, response, body) => {
            const shouldRetry = attemptNumber < maxAttempts
                && (isTransientError(error) || isTransientStatus(response));

            if (shouldRetry) {
                setTimeout(() => attemptRequest(attemptNumber + 1), retryDelayMs * attemptNumber);
                return;
            }

            callback(error, response, body);
        });
    };

    attemptRequest(1);
};

module.exports = requestWithRetry;
