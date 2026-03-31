export type TextOperator =
  | 'contains'
  | 'equals'
  | 'not_contains'
  | 'not_equals';

export type TextFilter = {
  type: 'text';
  operator: TextOperator;
  value: string;
};

export type BooleanFilter = {
  type: 'boolean';
  value: boolean | null;
};

export type MultiTextFilter = {
  type: 'multi_text';
  operator: TextOperator;
  values: string[];
};

export type DateRangeFilter = {
  type: 'date_range';
  values: [Date | null, Date | null];
};

export type UserFilters = {
  login?: TextFilter;
  name?: TextFilter;
  email?: TextFilter;
  phone?: TextFilter;
  role?: BooleanFilter;
  status?: BooleanFilter;
  region?: MultiTextFilter;
  city?: MultiTextFilter;
  district?: MultiTextFilter;
  createdAt?: DateRangeFilter;
};
