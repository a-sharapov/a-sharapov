(() => {
  const LATITUDE = 52;
  const RAD = Math.PI / 180;
  const read = () => {
    try {
      return localStorage.getItem('AS_theme');
    } catch {
      return null;
    }
  };
  const sun = (year, month, date) => {
    const day =
      Math.round((new Date(year, month, date) - new Date(year, 0, 1)) / 864e5) +
      1;
    const declination =
      -23.44 * RAD * Math.cos((2 * Math.PI * (day + 10)) / 365);
    const cos =
      (Math.sin(-0.833 * RAD) -
        Math.sin(LATITUDE * RAD) * Math.sin(declination)) /
      (Math.cos(LATITUDE * RAD) * Math.cos(declination));
    const half = (Math.acos(Math.min(1, Math.max(-1, cos))) / RAD) * 4;
    const standard = Math.max(
      new Date(year, 0, 1).getTimezoneOffset(),
      new Date(year, 6, 1).getTimezoneOffset()
    );
    const noon =
      720 + standard - new Date(year, month, date, 12).getTimezoneOffset();
    const at = (minutes) =>
      new Date(year, month, date, 0, Math.round(minutes)).getTime();
    return { rise: at(noon - half), set: at(noon + half) };
  };
  const daylight = (now) => {
    const day = new Date(now);
    const today = sun(day.getFullYear(), day.getMonth(), day.getDate());
    return now >= today.rise && now < today.set ? 'light' : 'dark';
  };
  const chosen = (now) => {
    const { 0: theme, 1: until } = (read() || '').split('@');
    return (theme === 'dark' || theme === 'light') && Number(until) > now
      ? theme
      : null;
  };
  const now = Date.now();
  document.documentElement.dataset.theme = chosen(now) || daylight(now);
})();
