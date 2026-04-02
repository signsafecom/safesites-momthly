import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../services/api', () => ({
  authApi: { verifyEmail: jest.fn() },
}));

import VerifyEmailPage from './VerifyEmailPage';
import { authApi } from '../services/api';

const mockVerifyEmail = authApi.verifyEmail as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

function renderWithToken(token?: string) {
  const url = token ? `/?token=${token}` : '/';
  return render(
    <MemoryRouter initialEntries={[url]}>
      <VerifyEmailPage />
    </MemoryRouter>,
  );
}

describe('VerifyEmailPage', () => {
  it('shows loading state initially when a token is present', () => {
    mockVerifyEmail.mockReturnValue(new Promise(() => {})); // never resolves
    renderWithToken('valid-token');
    expect(screen.getByText(/verifying your email/i)).toBeInTheDocument();
  });

  it('shows success state after the API verifies the token', async () => {
    mockVerifyEmail.mockResolvedValue({});
    renderWithToken('valid-token');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /email verified/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/your email has been verified/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });

  it('calls verifyEmail with the token from the URL', async () => {
    mockVerifyEmail.mockResolvedValue({});
    renderWithToken('my-token-123');

    await waitFor(() => {
      expect(mockVerifyEmail).toHaveBeenCalledWith('my-token-123');
    });
  });

  it('shows error state when no token is in the URL', async () => {
    renderWithToken(); // no token

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /verification failed/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/invalid verification link/i)).toBeInTheDocument();
  });

  it('shows error state when the API rejects the token', async () => {
    mockVerifyEmail.mockRejectedValue({
      response: { data: { error: 'Token expired' } },
    });
    renderWithToken('expired-token');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /verification failed/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/token expired/i)).toBeInTheDocument();
  });

  it('shows a fallback error message when the API error has no body', async () => {
    mockVerifyEmail.mockRejectedValue(new Error('Network error'));
    renderWithToken('bad-token');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /verification failed/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/the link may have expired/i)).toBeInTheDocument();
  });
});
