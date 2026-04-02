export type GeoOption = { id: number; name: string; slug: string };

export type RegionOption = GeoOption;
export type CityOption = GeoOption & { regionId: number };
export type DistrictOption = GeoOption & { cityId: number };
