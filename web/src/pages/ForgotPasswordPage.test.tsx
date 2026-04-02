import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../services/api', () => ({
  authApi: { forgotPassword: jest.fn() },
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

import ForgotPasswordPage from './ForgotPasswordPage';
import { authApi } from '../services/api';

const mockForgotPassword = authApi.forgotPassword as jest.Mock;

function renderPage() {
  return render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ForgotPasswordPage', () => {
  it('renders the "Forgot Password" heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /forgot password/i })).toBeInTheDocument();
  });

  it('renders the email input', () => {
    const { container } = renderPage();
    expect(container.querySelector('input[type="email"]')).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('renders a back-to-login link', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument();
  });

  it('shows success message after a successful submission', async () => {
    mockForgotPassword.mockResolvedValue({});
    const { container } = renderPage();

    await userEvent.type(container.querySelector('input[type="email"]')!, 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/password reset link has been sent/i)).toBeInTheDocument();
    });
  });

  it('calls forgotPassword API with the entered email', async () => {
    mockForgotPassword.mockResolvedValue({});
    const { container } = renderPage();

    await userEvent.type(container.querySelector('input[type="email"]')!, 'me@test.com');
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith('me@test.com');
    });
  });

  it('shows a back-to-login link on the success screen', async () => {
    mockForgotPassword.mockResolvedValue({});
    const { container } = renderPage();

    await userEvent.type(container.querySelector('input[type="email"]')!, 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument();
    });
  });
});
