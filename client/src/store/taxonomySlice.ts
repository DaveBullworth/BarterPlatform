import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getTaxonomy } from '@/http/taxonomy';
import type { TaxonomyChapter } from '@/types/taxonomy';
import type { RootState } from '.';

type TaxonomyState = {
  items: TaxonomyChapter[];
  loaded: boolean;
  loading: boolean;
};

const initialState: TaxonomyState = {
  items: [],
  loaded: false,
  loading: false,
};

export const fetchTaxonomyIfNeeded = createAsyncThunk(
  'taxonomy/fetchTaxonomyIfNeeded',
  async (_, { getState }) => {
    const state = getState() as RootState;
    /* 
      Полный идиотизм, но поддерживая искусственно асинхронность
      CategoriesDrawer в своём useEffect успевает понять что есть загрузка
      И отображает Drawer мгновенно так как внутри его только Loader
      без него он не успевает счесть состояние pending
      и сразу пытается отрендерить всё дерево категорий
    */
    await new Promise((r) => setTimeout(r, 100));
    if (state.taxonomy.loaded) {
      return null;
    }

    return await getTaxonomy();
  },
);

const slice = createSlice({
  name: 'taxonomy',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTaxonomyIfNeeded.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTaxonomyIfNeeded.fulfilled, (state, action) => {
        state.loading = false;
        if (!action.payload) return;
        state.items = action.payload;
        state.loaded = true;
      })
      .addCase(fetchTaxonomyIfNeeded.rejected, (state) => {
        state.loading = false;
      });
  },
});

export default slice.reducer;

export const selectTaxonomy = (state: RootState) => state.taxonomy.items;
export const selectTaxonomyLoading = (state: RootState) =>
  state.taxonomy.loading;
