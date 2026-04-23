import { Injectable, NotFoundException } from '@nestjs/common';
import { GeographyNodeDto } from '@/common/dtos/geo-node.dto';
import { UserErrorCode } from './errors/users-error-codes';
import { loadSeed } from '@/common/utils/load-seed.util';
import { City, District, Region } from '@/common/types/geo.type';

const regions = loadSeed<Region>('src/database/seeds/geography_region.json');
const cities = loadSeed<City>('src/database/seeds/geography_city.json');
const districts = loadSeed<District>(
  'src/database/seeds/geography_district.json',
);

@Injectable()
export class GeographyService {
  getRegions() {
    return regions.map((region) => ({
      id: region.externalId,
      name: region.name,
      slug: region.slug,
    }));
  }

  getCities(regionId?: number) {
    const regionCities = regionId
      ? cities.filter((city) => city.regionId === regionId)
      : cities;

    return regionCities.map((city) => ({
      id: city.externalId,
      regionId: city.regionId,
      name: city.name,
      slug: city.slug,
    }));
  }

  getDistricts(cityId?: number) {
    const cityDistricts = cityId
      ? districts.filter((district) => district.cityId === cityId)
      : districts;

    return cityDistricts.map((district) => ({
      id: district.externalId,
      cityId: district.cityId,
      name: district.name,
      slug: district.slug,
    }));
  }

  validate(regionId: number, cityId: number, districtId?: number | null) {
    const region = regions.find((r) => r.externalId === regionId);
    if (!region) {
      throw new NotFoundException({
        code: UserErrorCode.REGION_NOT_FOUND,
        message: 'Region not found',
      });
    }

    const city = cities.find((c) => c.externalId === cityId);
    if (!city || city.regionId !== regionId) {
      throw new NotFoundException({
        code: UserErrorCode.CITY_NOT_FOUND,
        message: 'City not found for selected region',
      });
    }

    if (districtId == null) return;

    const district = districts.find((d) => d.externalId === districtId);
    if (!district || district.cityId !== cityId) {
      throw new NotFoundException({
        code: UserErrorCode.DISTRICT_NOT_FOUND,
        message: 'District not found for selected city',
      });
    }
  }

  build(params: {
    regionId: number | null;
    cityId: number | null;
    districtId?: number | null;
  }) {
    const { regionId, cityId, districtId } = params;

    const region = regionId
      ? regions.find((r) => r.externalId === regionId)
      : undefined;

    const city = cityId
      ? cities.find((c) => c.externalId === cityId)
      : undefined;

    const district = districtId
      ? districts.find((d) => d.externalId === districtId)
      : undefined;

    const asNode = <T extends { externalId: number; name: string }>(
      item?: T,
    ): GeographyNodeDto | null => {
      return item ? { id: item.externalId, name: item.name } : null;
    };

    return {
      region: asNode(region),
      city: asNode(city),
      district: asNode(district),
    };
  }
}
