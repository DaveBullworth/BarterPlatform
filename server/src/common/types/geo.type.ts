export type Region = { externalId: number; name: string; slug: string };

export type City = {
  externalId: number;
  regionId: number;
  name: string;
  slug: string;
};

export type District = {
  externalId: number;
  cityId: number;
  name: string;
  slug: string;
};
