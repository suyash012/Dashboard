import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CryptoData {
  id: number;
  coinId: string;
  name: string;
  symbol: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  lastUpdated: string;
}

export interface CryptoDetailData extends CryptoData {
  high24h: number;
  low24h: number;
  ath: number;
  athChangePercentage: number;
  athDate: string;
  totalSupply: number;
  maxSupply: number | null;
  circulatingSupply: number;
  priceHistory: {
    timestamp: number;
    price: number;
  }[];
}

interface CryptoState {
  cryptos: CryptoData[];
  cryptoDetails: Record<string, CryptoDetailData>;
  loading: boolean;
  error: string | null;
}

const initialState: CryptoState = {
  cryptos: [],
  cryptoDetails: {},
  loading: false,
  error: null,
};

export const fetchCryptoData = createAsyncThunk(
  'crypto/fetchCryptoData',
  async (cryptoIds: string[], { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/crypto?ids=${cryptoIds.join(',')}`);
      if (!response.ok) {
        throw new Error('Failed to fetch crypto data');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchCryptoDetailData = createAsyncThunk(
  'crypto/fetchCryptoDetailData',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/crypto/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch crypto details');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const cryptoSlice = createSlice({
  name: 'crypto',
  initialState,
  reducers: {
    updateCryptoPrice: (state, action: PayloadAction<{ id: string; price: number }>) => {
      const { id, price } = action.payload;
      const cryptoIndex = state.cryptos.findIndex(crypto => crypto.coinId === id);
      
      if (cryptoIndex >= 0) {
        const oldPrice = state.cryptos[cryptoIndex].price;
        state.cryptos[cryptoIndex].price = price;
        
        // Calculate new 24h change percentage based on price difference
        if (oldPrice !== price) {
          const priceDiff = price - oldPrice;
          state.cryptos[cryptoIndex].priceChange24h = 
            (oldPrice > 0) ? (priceDiff / oldPrice) * 100 : 0;
        }
      }
      
      // Also update the crypto in details if it exists
      if (state.cryptoDetails[id]) {
        state.cryptoDetails[id].price = price;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCryptoData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCryptoData.fulfilled, (state, action) => {
        state.loading = false;
        state.cryptos = action.payload;
      })
      .addCase(fetchCryptoData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCryptoDetailData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCryptoDetailData.fulfilled, (state, action) => {
        state.loading = false;
        state.cryptoDetails[action.payload.coinId] = action.payload;
      })
      .addCase(fetchCryptoDetailData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { updateCryptoPrice } = cryptoSlice.actions;
export default cryptoSlice.reducer;
