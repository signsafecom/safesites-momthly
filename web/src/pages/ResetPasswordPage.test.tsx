import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../services/api', () => ({
  authApi: { resetPassword: jest.fn() },
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

import ResetPasswordPage from './ResetPasswordPage';

function renderPage(token?: string) {
  const url = token ? `/?token=${token}` : '/';
  return render(
    <MemoryRouter initialEntries={[url]}>
      <ResetPasswordPage />
    </MemoryRouter>,
  );
}

describe('ResetPasswordPage', () => {
  it('renders the "Reset Password" heading', () => {
    renderPage('some-token');
    expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
  });

  it('renders new password and confirm password inputs', () => {
    const { container } = renderPage('some-token');
    const passwordInputs = container.querySelectorAll('input[type="password"]');
    expect(passwordInputs.length).toBeGreaterThanOrEqual(2);
  });

  it('renders a submit button', () => {
    renderPage('some-token');
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });
});
