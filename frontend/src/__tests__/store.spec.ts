import { describe, it, expect, beforeEach } from 'vitest';

const mockStorage: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const key in mockStorage) delete mockStorage[key];
  },
  length: 0,
  key: () => null,
};

globalThis.document = {
  documentElement: {
    classList: {
      add: () => {},
      remove: () => {},
    },
  },
} as any;

import authReducer, { setCredentials, updateBalance, logout } from '../store/slices/authSlice';
import uiReducer, { toggleTheme, addToast, removeToast } from '../store/slices/uiSlice';

describe('Redux Auth Slice', () => {
  it('should initialize with null user when storage is empty', () => {
    const state = authReducer(undefined, { type: 'unknown' });
    expect(state.isLoading).toBe(false);
  });

  it('should set credentials on login', () => {
    const fakeUser = {
      id: 'usr_1',
      email: 'creator@test.com',
      name: 'Creator Test',
      role: 'USER' as const,
      wallet: { balance: 50, lifetimeGranted: 50, lifetimeSpent: 0 },
    };
    const state = authReducer(
      undefined,
      setCredentials({ user: fakeUser, accessToken: 'jwt_abc' }),
    );
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('creator@test.com');
  });

  it('should update credit balance dynamically', () => {
    const initialState = {
      user: {
        id: 'usr_1',
        email: 'test@test.com',
        name: 'Test',
        role: 'USER' as const,
        wallet: { balance: 50, lifetimeGranted: 50, lifetimeSpent: 0 },
      },
      accessToken: 'token',
      isAuthenticated: true,
      isLoading: false,
    };
    const state = authReducer(initialState, updateBalance(48));
    expect(state.user?.wallet?.balance).toBe(48);
  });

  it('should clear tokens on logout', () => {
    const initialState = {
      user: { id: 'usr_1', email: 'test@test.com', name: 'Test', role: 'USER' as const },
      accessToken: 'token',
      isAuthenticated: true,
      isLoading: false,
    };
    const state = authReducer(initialState, logout());
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });
});

describe('Redux UI Slice', () => {
  it('should toggle theme', () => {
    const state1 = uiReducer(undefined, toggleTheme());
    expect(state1.theme).toBeDefined();
  });

  it('should manage toasts', () => {
    const stateWithToast = uiReducer(
      undefined,
      addToast({ type: 'success', message: 'Operation completed' }),
    );
    expect(stateWithToast.toasts.length).toBe(1);
    expect(stateWithToast.toasts[0].message).toBe('Operation completed');

    const toastId = stateWithToast.toasts[0].id;
    const stateAfterRemoval = uiReducer(stateWithToast, removeToast(toastId));
    expect(stateAfterRemoval.toasts.length).toBe(0);
  });
});
