import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../services/api', () => ({
  authApi: { register: jest.fn() },
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

import RegisterPage from './RegisterPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  );
}

describe('RegisterPage', () => {
  it('renders the "Create Account" heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('renders the SafeSite brand name', () => {
    renderPage();
    expect(screen.getByText('SafeSite')).toBeInTheDocument();
  });

  it('renders first name and last name labels', () => {
    renderPage();
    expect(screen.getByText('First Name')).toBeInTheDocument();
    expect(screen.getByText('Last Name')).toBeInTheDocument();
  });

  it('renders email and password inputs by name attribute', () => {
    const { container } = renderPage();
    expect(container.querySelector('input[name="email"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="password"]')).toBeInTheDocument();
  });

  it('renders first name and last name inputs by name attribute', () => {
    const { container } = renderPage();
    expect(container.querySelector('input[name="firstName"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="lastName"]')).toBeInTheDocument();
  });

  it('renders account type selector', () => {
    const { container } = renderPage();
    expect(container.querySelector('select[name="role"]')).toBeInTheDocument();
  });

  it('renders a submit button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('renders a link to the sign-in page', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows the pricing note', () => {
    renderPage();
    expect(screen.getByText(/\$49\/month/i)).toBeInTheDocument();
  });
});
