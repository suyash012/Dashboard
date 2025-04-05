import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FavoritesState {
  favoriteCities: string[];
  favoriteCryptos: string[];
}

const initialState: FavoritesState = {
  favoriteCities: [],
  favoriteCryptos: [],
};

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    toggleFavoriteCity: (state, action: PayloadAction<string>) => {
      const city = action.payload;
      const index = state.favoriteCities.indexOf(city);
      
      if (index === -1) {
        state.favoriteCities.push(city);
      } else {
        state.favoriteCities.splice(index, 1);
      }
    },
    
    toggleFavoriteCrypto: (state, action: PayloadAction<string>) => {
      const crypto = action.payload;
      const index = state.favoriteCryptos.indexOf(crypto);
      
      if (index === -1) {
        state.favoriteCryptos.push(crypto);
      } else {
        state.favoriteCryptos.splice(index, 1);
      }
    },
  },
});

export const { toggleFavoriteCity, toggleFavoriteCrypto } = favoritesSlice.actions;
export default favoritesSlice.reducer;
