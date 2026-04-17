import { create } from 'zustand';

const useAuthStore = create((set) => ({
  session: null, 
  user: null,    
  loading: true,

  initializeAuth: async () => {
    try {
      const storedToken = localStorage.getItem('kime_token');
      const storedUser = localStorage.getItem('kime_user');

      if (storedToken && storedUser) {
        set({ 
          session: { token: storedToken }, 
          user: JSON.parse(storedUser), 
          loading: false 
        });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    
    const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка входа');
    }

    const data = await response.json();
    
    // Сохраняем в браузер
    localStorage.setItem('kime_token', data.token);
    localStorage.setItem('kime_user', JSON.stringify(data.user));

    set({ 
        session: { token: data.token }, 
        user: data.user 
    });

    return data;
  },

  signOut: async () => {
    localStorage.removeItem('kime_token');
    localStorage.removeItem('kime_user');
    set({ session: null, user: null });
  },

  checkAuthError: (error) => {
    if (error === 'Invalid token' || error === 'Access denied' || error?.includes('token')) {
      localStorage.removeItem('kime_token');
      localStorage.removeItem('kime_user');
      set({ session: null, user: null });
      return true;
    }
    return false;
  }
}));

export default useAuthStore;
