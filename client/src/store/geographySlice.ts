import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getCities, getDistricts, getRegions } from '@/http/geography';
import type { CityOption, DistrictOption, RegionOption } from '@/types/geo.dto';
import type { RootState } from '.';

type GeographyState = {
  regions: RegionOption[];
  cities: CityOption[];
  districts: DistrictOption[];
  regionsLoaded: boolean;
  citiesLoaded: boolean;
  districtsLoaded: boolean;
  regionsLoading: boolean;
  citiesLoading: boolean;
  districtsLoading: boolean;
};

const initialState: GeographyState = {
  regions: [],
  cities: [],
  districts: [],
  regionsLoaded: false,
  citiesLoaded: false,
  districtsLoaded: false,
  regionsLoading: false,
  citiesLoading: false,
  districtsLoading: false,
};

export const fetchRegionsIfNeeded = createAsyncThunk(
  'geography/fetchRegionsIfNeeded',
  async (_, { getState }) => {
    const state = getState() as RootState;

    if (state.geography.regionsLoaded) {
      return null;
    }

    return getRegions();
  },
);

export const fetchCitiesIfNeeded = createAsyncThunk(
  'geography/fetchCitiesIfNeeded',
  async (_, { getState }) => {
    const state = getState() as RootState;
    if (state.geography.citiesLoaded) {
      return null;
    }

    return getCities();
  },
);

export const fetchDistrictsIfNeeded = createAsyncThunk(
  'geography/fetchDistrictsIfNeeded',
  async (_, { getState }) => {
    const state = getState() as RootState;
    if (state.geography.districtsLoaded) {
      return null;
    }

    return getDistricts();
  },
);

const slice = createSlice({
  name: 'geography',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRegionsIfNeeded.pending, (state) => {
        state.regionsLoading = true;
      })
      .addCase(fetchRegionsIfNeeded.fulfilled, (state, action) => {
        state.regionsLoading = false;
        if (!action.payload) return;
        state.regions = action.payload;
        state.regionsLoaded = true;
      })
      .addCase(fetchRegionsIfNeeded.rejected, (state) => {
        state.regionsLoading = false;
      })
      .addCase(fetchCitiesIfNeeded.pending, (state) => {
        state.citiesLoading = true;
      })
      .addCase(fetchCitiesIfNeeded.fulfilled, (state, action) => {
        state.citiesLoading = false;
        if (!action.payload) return;
        state.cities = action.payload;
        state.citiesLoaded = true;
      })
      .addCase(fetchCitiesIfNeeded.rejected, (state) => {
        state.citiesLoading = false;
      })
      .addCase(fetchDistrictsIfNeeded.pending, (state) => {
        state.districtsLoading = true;
      })
      .addCase(fetchDistrictsIfNeeded.fulfilled, (state, action) => {
        state.districtsLoading = false;
        if (!action.payload) return;
        state.districts = action.payload;
        state.districtsLoaded = true;
      })
      .addCase(fetchDistrictsIfNeeded.rejected, (state) => {
        state.districtsLoading = false;
      });
  },
});

export default slice.reducer;

export const selectRegions = (state: RootState) => state.geography.regions;
export const selectCities = (state: RootState) => state.geography.cities;
export const selectDistricts = (state: RootState) => state.geography.districts;
