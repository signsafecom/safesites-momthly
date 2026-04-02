import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../services/api', () => ({
  documentsApi: { list: jest.fn() },
  subscriptionApi: { status: jest.fn() },
}));

jest.mock('../components/common/Layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import DashboardPage from './DashboardPage';
import { documentsApi, subscriptionApi } from '../services/api';
import { useAuthStore } from '../utils/store';

const mockDocumentsList = documentsApi.list as jest.Mock;
const mockSubscriptionStatus = subscriptionApi.status as jest.Mock;

const testUser = {
  id: 'user-1',
  firstName: 'Alice',
  lastName: 'Smith',
  email: 'alice@example.com',
  role: 'CONSUMER',
  subscriptionStatus: 'ACTIVE',
  trialEndsAt: null,
};

function renderPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ user: testUser, token: 'test-token', refreshToken: 'test-refresh' });
});

afterEach(() => {
  useAuthStore.setState({ user: null, token: null, refreshToken: null });
});

describe('DashboardPage', () => {
  it('shows a loading spinner before data is fetched', () => {
    mockDocumentsList.mockReturnValue(new Promise(() => {}));
    mockSubscriptionStatus.mockReturnValue(new Promise(() => {}));

    renderPage();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows the welcome message with the user first name', async () => {
    mockDocumentsList.mockResolvedValue({ data: { documents: [] } });
    mockSubscriptionStatus.mockResolvedValue({
      data: { status: 'ACTIVE', isTrialing: false, trialEndsAt: null, documentsThisMonth: 0 },
    });

    renderPage();

    await waitFor(() => {
      const welcomeHeading = screen.getByText(/welcome back/i);
      expect(welcomeHeading.textContent).toContain('Alice');
    });
  });

  it('shows "No documents yet" when the user has no documents', async () => {
    mockDocumentsList.mockResolvedValue({ data: { documents: [] } });
    mockSubscriptionStatus.mockResolvedValue({
      data: { status: 'ACTIVE', isTrialing: false, trialEndsAt: null, documentsThisMonth: 0 },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/no documents yet/i)).toBeInTheDocument();
    });
  });

  it('lists recent documents when they exist', async () => {
    const docs = [
      {
        id: 'doc-1',
        originalName: 'contract.pdf',
        status: 'ANALYZED',
        fileSize: 2048,
        createdAt: new Date().toISOString(),
        analysis: { riskScore: 25 },
      },
    ];
    mockDocumentsList.mockResolvedValue({ data: { documents: docs } });
    mockSubscriptionStatus.mockResolvedValue({
      data: { status: 'ACTIVE', isTrialing: false, trialEndsAt: null, documentsThisMonth: 1 },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('contract.pdf')).toBeInTheDocument();
    });
  });

  it('shows a trial banner when the user is in the trial period', async () => {
    const trialEndsAt = new Date(Date.now() + 86400000).toISOString();
    mockDocumentsList.mockResolvedValue({ data: { documents: [] } });
    mockSubscriptionStatus.mockResolvedValue({
      data: { status: 'TRIALING', isTrialing: true, trialEndsAt, documentsThisMonth: 0 },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/you're on a free trial/i)).toBeInTheDocument();
    });
  });

  it('does not show a trial banner for an active subscriber', async () => {
    mockDocumentsList.mockResolvedValue({ data: { documents: [] } });
    mockSubscriptionStatus.mockResolvedValue({
      data: { status: 'ACTIVE', isTrialing: false, trialEndsAt: null, documentsThisMonth: 5 },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/no documents yet/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/you're on a free trial/i)).not.toBeInTheDocument();
  });
});
