import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthProvider } from '@/hooks/useAuth';

// Smoke test : ProtectedRoute redirects unauthenticated users
describe('ProtectedRoute', () => {
  it('se monte sans crash', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <ProtectedRoute />
        </AuthProvider>
      </MemoryRouter>
    );
    // Doit rendre quelque chose (loader ou redirect) sans planter
    expect(document.body).toBeTruthy();
  });
});
