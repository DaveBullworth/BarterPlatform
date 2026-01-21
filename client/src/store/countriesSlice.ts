import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Country } from '@/types/country';

interface CountriesState {
  data: Country[];
}

const initialState: CountriesState = {
  data: [],
};

export const countriesSlice = createSlice({
  name: 'countries',
  initialState,
  reducers: {
    setCountries: (state, action: PayloadAction<Country[]>) => {
      state.data = action.payload;
    },
  },
});

export const { setCountries } = countriesSlice.actions;

export default countriesSlice.reducer;
