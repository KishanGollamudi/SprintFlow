import React from 'react'
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { SidebarProvider } from './context/SidebarContext';
import { AttendanceProvider } from './context/AttendanceContext';
import { SprintProvider } from './context/SprintContext';
import { AppDataProvider } from './context/AppDataContext';
import { MessengerProvider } from './context/MessengerContext';
import { ToastProvider } from './context/ToastContext';

const App = () => {
  return (
    // ToastProvider wraps everything so any component can call useToast()
    <ToastProvider>
      <AuthProvider>
        <SidebarProvider>
          <AppDataProvider>
            <SprintProvider>
              <AttendanceProvider>
                <MessengerProvider>
                  <AppRoutes />
                </MessengerProvider>
              </AttendanceProvider>
            </SprintProvider>
          </AppDataProvider>
        </SidebarProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App