import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface WeatherData {
  city: string;
  country: string;
  temp: number;
  humidity: number;
  condition: string;
  icon: string;
  timestamp: number;
}

export interface WeatherHistoryData {
  time: string;
  temperature: number;
}

export interface WeatherDetailData extends WeatherData {
  windSpeed: number;
  pressure: number;
  visibility: number;
  feelsLike: number;
  history: WeatherHistoryData[];
}

interface WeatherState {
  cities: WeatherData[];
  cityDetails: Record<string, WeatherDetailData>;
  loading: boolean;
  error: string | null;
}

const initialState: WeatherState = {
  cities: [],
  cityDetails: {},
  loading: false,
  error: null,
};

export const fetchWeatherData = createAsyncThunk(
  'weather/fetchWeatherData',
  async (cities: string[], { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/weather?cities=${cities.join(',')}`);
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchWeatherDetailData = createAsyncThunk(
  'weather/fetchWeatherDetailData',
  async (city: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/weather/${encodeURIComponent(city)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch city weather details');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const weatherSlice = createSlice({
  name: 'weather',
  initialState,
  reducers: {
    addWeatherAlert: (state, action: PayloadAction<WeatherData>) => {
      // This action can be used to add simulated weather alerts
      const cityIndex = state.cities.findIndex(city => city.city === action.payload.city);
      if (cityIndex >= 0) {
        state.cities[cityIndex] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWeatherData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWeatherData.fulfilled, (state, action) => {
        state.loading = false;
        state.cities = action.payload;
      })
      .addCase(fetchWeatherData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchWeatherDetailData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWeatherDetailData.fulfilled, (state, action) => {
        state.loading = false;
        state.cityDetails[action.payload.city] = action.payload;
      })
      .addCase(fetchWeatherDetailData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { addWeatherAlert } = weatherSlice.actions;
export default weatherSlice.reducer;
