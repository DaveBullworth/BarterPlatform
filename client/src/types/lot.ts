export const LOT_VISIBILITY_STATUS = {
  HIDDEN: 'hidden',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const;

export type LotVisibilityStatus =
  (typeof LOT_VISIBILITY_STATUS)[keyof typeof LOT_VISIBILITY_STATUS];

export type CreateLotDto = {
  chapterId: number;
  categoryId: number;
  subcategoryId?: number;
  generalDescription: string;
  characteristicsDescription: string;
  quantity: number;
  visibilityStatus:
    | typeof LOT_VISIBILITY_STATUS.HIDDEN
    | typeof LOT_VISIBILITY_STATUS.ACTIVE;
};

export type UpdateLotDto = Partial<CreateLotDto>;

export type LotDto = {
  id: string;
  userId: string;
  chapterId: number;
  categoryId: number;
  subcategoryId: number | null;
  generalDescription: string;
  characteristicsDescription: string;
  quantity: number;
  visibilityStatus: LotVisibilityStatus;
  createdAt: string;
  updatedAt: string;
  imageLinks: string[];
};
