/**
 * Integration test — SprintAttendance error banner
 * Mocks attendanceService.submit directly to avoid session-state interference.
 */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, seedTrainerSession, clearSession } from './testUtils';
import SprintAttendance from '@/features/sprint/pages/SprintAttendance';
import { MOCK_SPRINT } from '../mocks/handlers';
import { Route, Routes } from 'react-router-dom';

// Mock attendanceService so submit always rejects — no real HTTP call needed
vi.mock('@/services/attendanceService', async (importOriginal) => {
  const real = await importOriginal();
  return {
    default: {
      ...real.default,
      submit: vi.fn().mockRejectedValue(new Error('Submission failed')),
      getByDate: vi.fn().mockResolvedValue({ success: true, data: [], message: 'OK' }),
    },
  };
});

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (cb) => setTimeout(cb, 0));
  seedTrainerSession();
});
afterEach(() => {
  vi.unstubAllGlobals();
  clearSession();
});

it('shows an error banner when the submit API fails', async () => {
  const user = userEvent.setup();
  renderWithProviders(
    <Routes>
      <Route path="/sprints/:id/attendance" element={<SprintAttendance />} />
    </Routes>,
    { initialEntries: [`/sprints/${MOCK_SPRINT.id}/attendance`] },
  );

  await screen.findByText('Alice Kumar');

  await waitFor(() =>
    expect(screen.getByRole('button', { name: /submit attendance/i })).not.toBeDisabled(),
  );

  await user.click(screen.getByRole('button', { name: /submit attendance/i }));

  await waitFor(() =>
    expect(screen.getByText(/submission failed/i)).toBeInTheDocument(),
  );
});
