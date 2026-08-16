export class ApiError extends Error {
  constructor(message, retryable = false) {
    super(message);
    this.retryable = retryable;
  }
}

const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(path, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  } catch {
    throw new ApiError('We could not reach our booking service. Please try again in a moment.', true);
  }

  const body = await response.text();
  let data = null;
  if (body) {
    try {
      data = JSON.parse(body);
    } catch {
      data = null;
    }
  }

  if (!response.ok) throw new ApiError(data?.error || 'We could not send your request. Please try again in a moment.', response.status === 429 || response.status >= 500);
  return data || {};
}

export async function retryRequest(request, { retries = 3, onRetry } = {}) {
  let attempt = 0;

  while (true) {
    try {
      return await request();
    } catch (error) {
      if (!error.retryable || attempt >= retries) throw error;
      attempt += 1;
      onRetry?.(attempt, retries);
      await wait(700 * (2 ** (attempt - 1)));
    }
  }
}
export const stateCode=location.pathname.split('/')[1]?.match(/^[a-z]{2}$/i)?location.pathname.split('/')[1].toLowerCase():'md';
