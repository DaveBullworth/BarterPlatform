import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getTaxonomy } from '@/http/taxonomy';
import type { TaxonomyChapter } from '@/types/taxonomy';
import type { RootState } from '.';

type TaxonomyState = {
  items: TaxonomyChapter[];
  status: 'idle' | 'loading' | 'success' | 'error';
};

const initialState: TaxonomyState = {
  items: [],
  status: 'idle',
};

export const fetchTaxonomyIfNeeded = createAsyncThunk(
  'taxonomy/fetchTaxonomyIfNeeded',
  async () => {
    return await getTaxonomy();
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as RootState;

      // не запускаем если уже грузится или уже загружено
      if (
        state.taxonomy.status === 'loading' ||
        state.taxonomy.status === 'success'
      ) {
        return false;
      }

      return true;
    },
  },
);

const slice = createSlice({
  name: 'taxonomy',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTaxonomyIfNeeded.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTaxonomyIfNeeded.fulfilled, (state, action) => {
        if (action.payload) {
          state.items = action.payload;
        }
        state.status = 'success';
      })
      .addCase(fetchTaxonomyIfNeeded.rejected, (state) => {
        state.status = 'error';
      });
  },
});

export default slice.reducer;

export const selectTaxonomy = (state: RootState) => state.taxonomy.items;
export const selectTaxonomyStatus = (state: RootState) => state.taxonomy.status;
