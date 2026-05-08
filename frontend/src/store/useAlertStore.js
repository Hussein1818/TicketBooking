import { create } from 'zustand';

const useAlertStore = create((set) => ({
  isOpen: false,
  message: '',
  title: '',
  type: 'info', // 'success', 'error', 'info', 'warning'
  
  isPrompt: false,
  promptValue: '',
  resolvePromise: null,
  
  showAlert: (title, message, type = 'info') => 
    set({ isOpen: true, title, message, type, isPrompt: false }),

  showPrompt: (title, message, type = 'info') => {
    return new Promise((resolve) => {
      set({
        isOpen: true,
        title,
        message,
        type,
        isPrompt: true,
        promptValue: '',
        resolvePromise: resolve
      });
    });
  },

  setPromptValue: (value) => set({ promptValue: value }),

  submitPrompt: () => {
    set((state) => {
      if (state.resolvePromise) state.resolvePromise(state.promptValue);
      return { isOpen: false, resolvePromise: null };
    });
  },
    
  hideAlert: () => 
    set((state) => {
      if (state.isPrompt && state.resolvePromise) {
        state.resolvePromise(null);
      }
      return { isOpen: false, resolvePromise: null };
    }),
}));

export default useAlertStore;
