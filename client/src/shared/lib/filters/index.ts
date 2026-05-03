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
  value: boolean;
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

export type IDFilter = {
  type: 'id';
  value: string;
};

// Union всех фильтров — удобно для generic функций
export type AnyFilter =
  | TextFilter
  | BooleanFilter
  | MultiTextFilter
  | DateRangeFilter
  | IDFilter;
