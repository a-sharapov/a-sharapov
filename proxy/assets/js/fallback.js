var _check = () =>
  fetch(window.location.href, { cache: 'no-store' }).then(
    (response) => void (response.status < 500 && window.location.reload()),
    () => undefined
  );

void (window.location.pathname !== '/fallback' && setInterval(_check, 5000));
