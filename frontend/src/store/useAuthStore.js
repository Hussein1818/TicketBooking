import { create } from 'zustand';

const parseJwtPayload = (token) => {
  if (!token) return null;
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized);
    let payload;
    try {
      payload = JSON.parse(decodeURIComponent(escape(decoded)));
    } catch {
      payload = JSON.parse(decoded);
    }
    return payload;
  } catch (err) {
    return null;
  }
};

const hasAdminRole = (source) => {
  if (!source) return false;

  const roleCandidates = [
    source.role,
    source.roles,
    source.Role,
    source.Roles,
    source["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
  ];

  const normalizedRoles = roleCandidates
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(Boolean)
    .map((role) => String(role).toLowerCase());

  if (normalizedRoles.includes('admin')) return true;
  if (source.isAdmin === true || source.IsAdmin === true || String(source.isAdmin).toLowerCase() === 'true') return true;
  return false;
};

const getFromStorage = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

const useAuthStore = create((set) => ({
  token: getFromStorage('token'),
  refreshToken: getFromStorage('refreshToken'),
  user: getFromStorage('user'),
  isAdmin: (() => {
    const token = getFromStorage('token');
    const user = getFromStorage('user');
    return hasAdminRole(user) || hasAdminRole(parseJwtPayload(token));
  })(),

  login: (token, user, refreshToken) => {
    if (token) localStorage.setItem('token', JSON.stringify(token));
    if (refreshToken) localStorage.setItem('refreshToken', JSON.stringify(refreshToken));
    if (user) localStorage.setItem('user', JSON.stringify(user));

    const jwtPayload = parseJwtPayload(token);
    const isAdmin = hasAdminRole(user) || hasAdminRole(jwtPayload);
    set({ token, user, refreshToken, isAdmin });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ token: null, refreshToken: null, user: null, isAdmin: false });
  },

  refreshAdminState: () =>
    set((state) => ({
      isAdmin: hasAdminRole(state.user) || hasAdminRole(parseJwtPayload(state.token)),
    })),
}));

export default useAuthStore;
