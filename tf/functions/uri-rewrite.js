const canonicalHost = CANONICAL_HOST;

function handler(event) {
  const request = event.request;
  if (request.headers.host.value.toLowerCase() === 'www.' + canonicalHost) {
    const query = [];
    Object.keys(request.querystring).forEach(function (name) {
      const parameter = request.querystring[name];
      (parameter.multiValue || [parameter]).forEach(function (value) {
        query.push(name + '=' + value.value);
      });
    });
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: {
        location: {
          value: 'https://' + canonicalHost + request.uri + (query.length ? '?' + query.join('&') : ''),
        },
      },
    };
  }
  const uri = request.uri.replace(/\/+$/, '');
  if (uri.startsWith('/works/') && !uri.slice(uri.lastIndexOf('/')).includes('.')) {
    request.uri = uri + '.html';
  }
  return request;
}
