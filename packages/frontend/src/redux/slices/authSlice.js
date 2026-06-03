import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = !!user;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    updateUserVerification: (state, action) => {
      if (state.user) {
        state.user.isVerified = action.payload;
      }
    }
  }
});

export const { setCredentials, clearCredentials, updateUserVerification } = authSlice.actions;
export default authSlice.reducer;
