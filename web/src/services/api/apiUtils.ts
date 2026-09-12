export const getAuthToken = (): string | null => {
  let token = localStorage.getItem('access_token') || localStorage.getItem('token');
  if (!token) {
    const sessionStr = localStorage.getItem('zom2.auth.session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        token = session.token;
      } catch(e) {}
    }
  }
  return token;
};
