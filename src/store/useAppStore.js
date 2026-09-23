import { create } from 'zustand';

export const useAppStore = create((set) => ({
  isDark: false,
  toggleDark: () => set((state) => {
    const newDark = !state.isDark;
    if (newDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { isDark: newDark };
  }),
}));
