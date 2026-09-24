export class ApiError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.status = status;
    this.fields = fields || {};
  }
}

async function request(method, url, body) {
  const isForm = body instanceof FormData;
  const res = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: {
      'X-Requested-With': 'chosen-cms',
      ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  const data = res.headers.get('content-type')?.includes('application/json') ? await res.json() : null;
  if (res.status === 401 && url.startsWith('/api/admin/') && !url.startsWith('/api/admin/auth/')) {
    window.dispatchEvent(new Event('admin:unauthorized'));
  }
  if (!res.ok) throw new ApiError(data?.error || `Request failed (${res.status})`, res.status, data?.fields);
  return data;
}

export const api = {
  get: (url) => request('GET', url),
  post: (url, body) => request('POST', url, body ?? {}),
  put: (url, body) => request('PUT', url, body),
  patch: (url, body) => request('PATCH', url, body),
  del: (url) => request('DELETE', url),
  upload: (url, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return request('POST', url, fd);
  },
};
