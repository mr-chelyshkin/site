function handler(event) {
  const request = event.request;
  const uri = request.uri.replace(/\/+$/, '');
  if (uri.startsWith('/works/') && !uri.slice(uri.lastIndexOf('/')).includes('.')) {
    request.uri = uri + '.html';
  }
  return request;
}
