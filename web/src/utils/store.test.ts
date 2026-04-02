import { useAuthStore } from './store';

const testUser = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Alice',
  lastName: 'Smith',
  role: 'CONSUMER',
  subscriptionStatus: 'ACTIVE',
  trialEndsAt: null,
};

beforeEach(() => {
  useAuthStore.setState({ token: null, refreshToken: null, user: null });
});

describe('useAuthStore initial state', () => {
  it('has null token by default', () => {
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('has null refreshToken by default', () => {
    expect(useAuthStore.getState().refreshToken).toBeNull();
  });

  it('has null user by default', () => {
    expect(useAuthStore.getState().user).toBeNull();
  });
});

describe('useAuthStore.setToken', () => {
  it('updates the access token', () => {
    useAuthStore.getState().setToken('my-access-token');
    expect(useAuthStore.getState().token).toBe('my-access-token');
  });

  it('does not affect refreshToken or user', () => {
    useAuthStore.getState().setToken('access-only');
    const { refreshToken, user } = useAuthStore.getState();
    expect(refreshToken).toBeNull();
    expect(user).toBeNull();
  });
});

describe('useAuthStore.setAuth', () => {
  it('sets token, refreshToken, and user together', () => {
    useAuthStore.getState().setAuth('tok', 'ref', testUser);
    const state = useAuthStore.getState();
    expect(state.token).toBe('tok');
    expect(state.refreshToken).toBe('ref');
    expect(state.user).toEqual(testUser);
  });

  it('overwrites previously stored credentials', () => {
    useAuthStore.getState().setAuth('old-tok', 'old-ref', { ...testUser, firstName: 'Old' });
    useAuthStore.getState().setAuth('new-tok', 'new-ref', testUser);
    const state = useAuthStore.getState();
    expect(state.token).toBe('new-tok');
    expect(state.user?.firstName).toBe('Alice');
  });
});

describe('useAuthStore.setUser', () => {
  it('updates only the user field', () => {
    useAuthStore.getState().setAuth('tok', 'ref', testUser);
    const updatedUser = { ...testUser, firstName: 'Updated' };
    useAuthStore.getState().setUser(updatedUser);
    const state = useAuthStore.getState();
    expect(state.user?.firstName).toBe('Updated');
    expect(state.token).toBe('tok');
    expect(state.refreshToken).toBe('ref');
  });
});

describe('useAuthStore.logout', () => {
  it('clears token, refreshToken, and user', () => {
    useAuthStore.getState().setAuth('tok', 'ref', testUser);
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
  });
});
