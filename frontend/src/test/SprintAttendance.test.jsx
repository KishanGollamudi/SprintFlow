/**
 * Integration tests — SprintAttendance page
 * Route: /sprints/:id/attendance
 */
import { screen, waitFor, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, seedTrainerSession, clearSession } from './testUtils';
import SprintAttendance from '@/features/sprint/pages/SprintAttendance';
import { MOCK_SPRINT, MOCK_EMPLOYEES } from '../mocks/handlers';
import { Route, Routes } from 'react-router-dom';

function renderPage(sprintId = MOCK_SPRINT.id) {
  return renderWithProviders(
    <Routes>
      <Route path="/sprints/:id/attendance" element={<SprintAttendance />} />
    </Routes>,
    { initialEntries: [`/sprints/${sprintId}/attendance`] },
  );
}

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (cb) => setTimeout(cb, 0));
  seedTrainerSession();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  clearSession();
});

describe('SprintAttendance page', () => {
  it('shows "Sprint not found" for an unknown sprint id', async () => {
    renderPage(9999);
    await waitFor(() =>
      expect(screen.getByText(/sprint not found/i)).toBeInTheDocument(),
    );
  });

  it('renders the sprint title and employee rows after loading', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: MOCK_SPRINT.title })).toBeInTheDocument(),
    );
    for (const emp of MOCK_EMPLOYEES) {
      expect(await screen.findByText(emp.name)).toBeInTheDocument();
    }
  });

  it('clicking "Present" on a row updates that row\'s status badge', async () => {
    const user = userEvent.setup();
    renderPage();
    const aliceCell = await screen.findByText('Alice Kumar');
    const row = aliceCell.closest('tr');
    await user.click(within(row).getByRole('button', { name: /^present$/i }));
    await waitFor(() =>
      expect(within(row).getByText('Present')).toBeInTheDocument(),
    );
  });

  it('"Mark All Present" sets all visible rows to Present', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Alice Kumar');
    await user.click(screen.getByRole('button', { name: /mark all present/i }));
    const badges = await screen.findAllByText('Present');
    expect(badges.length).toBeGreaterThanOrEqual(MOCK_EMPLOYEES.length);
  });

  it('toggling "Notify absent employees" switch does not throw', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Alice Kumar');
    const label = screen.getByText(/notify absent employees/i);
    const toggle = label.previousElementSibling ?? label.closest('label')?.querySelector('div');
    expect(toggle).toBeTruthy();
    await user.click(toggle);
    expect(screen.getByText(/notify absent employees/i)).toBeInTheDocument();
  });

it('submitting attendance shows the success banner', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Alice Kumar');
    await user.click(screen.getByRole('button', { name: /submit attendance/i }));
    await waitFor(() =>
      expect(screen.getByText(/records are now locked/i)).toBeInTheDocument(),
    );
  });

  it('locks the table after a successful submission', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Alice Kumar');
    await user.click(screen.getByRole('button', { name: /submit attendance/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /submitted/i })).toBeDisabled(),
    );
  });
});
