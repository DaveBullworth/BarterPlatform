import * as path from 'path';
import * as fs from 'fs/promises';
import { INestApplicationContext } from '@nestjs/common';
import { DataSource, In, Like } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Jimp, loadFont } from 'jimp';
import { SANS_32_WHITE, SANS_64_WHITE } from 'jimp/fonts';

import {
  UserEntity,
  UserRole,
  UserThemes,
  UserLanguage,
} from '../entities/user.entity';
import { LotEntity, LotVisibilityStatus } from '../entities/lot.entity';
import { OfferEntity } from '../entities/offer.entity';
import { NotificationEntity } from '../entities/notification.entity';
import { SessionEntity } from '../entities/session.entity';
import {
  MediaFileEntity,
  MediaFileType,
} from '../entities/mediafile.entity';
import {
  TaxonomyTargetType,
  UserTaxonomyPreferenceEntity,
} from '../entities/user-taxonomy-preference.entity';

import { LotsService } from '@/modules/lots/lots.service';
import { LotArchiveService } from '@/modules/lots/lot-archive.service';
import { OffersService } from '@/modules/offers/offers.service';
import { MediaService } from '@/modules/media/media.service';
import { UserPreferencesService } from '@/modules/user-preferences/user-preferences.service';
import { loadSeed } from '@/common/utils/load-seed.util';
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface';

/**
 * Дев-сидер: наполняет базу реалистичным набором пользователей, лотов
 * (с картинками), предпочтений и предложений во всех статусах — чтобы можно
 * было руками тестировать клиент, не создавая всё это по сто раз.
 *
 * Принципиально работает ЧЕРЕЗ РЕАЛЬНЫЕ СЕРВИСЫ (LotsService, OffersService,
 * MediaService, UserPreferencesService), а не голые INSERT'ы: валидация
 * таксономии/географии, гейт предпочтений, уведомления, Redis-версии кэша и
 * архивные даты отрабатывают так же, как при живом использовании приложения.
 *
 * Все сид-пользователи имеют email вида *@seed.local — по этому признаку
 * wipeDevData() полностью вычищает прошлый посев перед новым.
 */

const SEED_EMAIL_DOMAIN = 'seed.local';
const SEED_PASSWORD = 'test1234';

// ───────────────────────── детерминированный рандом ─────────────────────────
// Один и тот же посев на каждом запуске → воспроизводимые ручные тесты.

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260611);
const randInt = (min: number, max: number) =>
  min + Math.floor(rand() * (max - min + 1));
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const pickN = <T>(arr: T[], n: number): T[] =>
  [...arr].sort(() => rand() - 0.5).slice(0, n);
const chance = (p: number) => rand() < p;

// ───────────────────────── справочники (те же, что у сервисов) ─────────────────────────

type TaxonomyNode = {
  externalId: number;
  name: string;
  slug: string;
  chapterId?: number;
  categoryId?: number;
};
type GeoNode = {
  externalId: number;
  name: string;
  slug: string;
  regionId?: number;
  cityId?: number;
};

const subcategories = loadSeed<TaxonomyNode>(
  'src/database/seeds/subcategory.json',
);
const regions = loadSeed<GeoNode>('src/database/seeds/geography_region.json');
const cities = loadSeed<GeoNode>('src/database/seeds/geography_city.json');
const districts = loadSeed<GeoNode>(
  'src/database/seeds/geography_district.json',
);

/** Подбирает валидную подкатегорию: по slug, либо случайную, либо ничего. */
function resolveSubcategory(
  categoryId: number,
  preferredSlug?: string,
): number | undefined {
  const subs = subcategories.filter((s) => s.categoryId === categoryId);
  if (!subs.length) return undefined;
  const preferred = preferredSlug
    ? subs.find((s) => s.slug === preferredSlug)
    : undefined;
  return (preferred ?? pick(subs)).externalId;
}

function randomGeo() {
  const region = pick(regions);
  const regionCities = cities.filter((c) => c.regionId === region.externalId);
  const city = pick(regionCities);
  const cityDistricts = districts.filter(
    (d) => d.cityId === city.externalId,
  );
  const district =
    cityDistricts.length && chance(0.5) ? pick(cityDistricts) : undefined;
  return {
    regionId: region.externalId,
    cityId: city.externalId,
    districtId: district?.externalId,
  };
}

// ───────────────────────── персонажи ─────────────────────────

// Логины ≥8 символов — ограничение MinLength в auth DTO.
const PERSONAS = [
  { login: 'anna_koval', name: 'Анна Ковальчук' },
  { login: 'boris_mih', name: 'Борис Михалевич' },
  { login: 'viktor_sanko', name: 'Виктор Санько' },
  { login: 'galina_pet', name: 'Галина Петровская' },
  { login: 'dmitry_luk', name: 'Дмитрий Лукашевич' },
  { login: 'elena_voyt', name: 'Елена Войтович' },
  { login: 'ivan_tretyak', name: 'Иван Третьяк' },
  { login: 'ksenia_rog', name: 'Ксения Рогова' },
  { login: 'maksim_gon', name: 'Максим Гончар' },
  { login: 'olga_berezko', name: 'Ольга Берёзко' },
];

// ───────────────────────── каталог вещей ─────────────────────────
// tag — латинская подпись для генерируемой картинки (битмап-шрифты Jimp без кириллицы).
// subSlug — необязательная привязка к конкретной подкатегории, иначе случайная валидная.

type CatalogItem = {
  chapterId: number;
  categoryId: number;
  subSlug?: string;
  title: string;
  details: string;
  tag: string;
};

const CATALOG: CatalogItem[] = [
  // Компьютерная техника (4)
  { chapterId: 4, categoryId: 29, title: 'Ноутбук MacBook Pro 14" M1 Pro', details: '16GB RAM, 512GB SSD, состояние отличное, комплект: коробка, зарядка. Циклов батареи ~120.', tag: 'MacBook Pro 14' },
  { chapterId: 4, categoryId: 29, title: 'Ноутбук Lenovo ThinkPad X1 Carbon Gen 9', details: 'i7-1165G7, 16GB, 1TB SSD, матовый IPS. Корпус с мелкими потёртостями, клавиатура идеальная.', tag: 'ThinkPad X1' },
  { chapterId: 4, categoryId: 31, title: 'Монитор Dell U2720Q 27" 4K', details: 'IPS, USB-C 90W, без битых пикселей. Подставка и кабели в комплекте.', tag: 'Dell U2720Q' },
  { chapterId: 4, categoryId: 32, title: 'Видеокарта RTX 3070 Palit GamingPro', details: 'Не майнилась (честно). Гарантийная пломба на месте, коробка есть.', tag: 'RTX 3070' },
  { chapterId: 4, categoryId: 34, title: 'Механическая клавиатура Keychron K2', details: 'Gateron Brown, подсветка RGB, Bluetooth + провод. Кейкапы PBT в подарок.', tag: 'Keychron K2' },
  // Телефоны и планшеты (5)
  { chapterId: 5, categoryId: 37, title: 'iPhone 13 128GB Midnight', details: 'АКБ 87%, Face ID работает, ни разу не вскрывался. Стекло и чехол с покупки.', tag: 'iPhone 13' },
  { chapterId: 5, categoryId: 37, title: 'Samsung Galaxy S21 256GB', details: 'Phantom Gray, экран без царапин, полный комплект. Две сим-карты.', tag: 'Galaxy S21' },
  { chapterId: 5, categoryId: 37, title: 'Xiaomi Redmi Note 12 Pro', details: '8/256, глобальная версия. Пользовались полгода, причина обмена — подарили новый.', tag: 'Redmi Note 12' },
  { chapterId: 5, categoryId: 41, title: 'Планшет iPad Air 4 64GB Wi-Fi', details: 'Зелёный, с чехлом Smart Folio. Экран под плёнкой с первого дня.', tag: 'iPad Air 4' },
  { chapterId: 5, categoryId: 45, title: 'Часы Apple Watch Series 7 45mm', details: 'GPS, алюминий, два ремешка. АКБ 91%, без замечаний.', tag: 'Apple Watch 7' },
  { chapterId: 5, categoryId: 47, title: 'Наушники AirPods Pro 2', details: 'Полный комплект, все амбушюры. Куплены в официальной рознице, чек есть.', tag: 'AirPods Pro 2' },
  // Электроника (6)
  { chapterId: 6, categoryId: 52, subSlug: 'pristavki', title: 'PlayStation 4 Pro 1TB + 2 геймпада', details: 'Прошивка стоковая, тихая, не разбиралась. Отдам с тремя дисками.', tag: 'PS4 Pro' },
  { chapterId: 6, categoryId: 52, subSlug: 'geympady', title: 'Геймпад Xbox Series контроллер', details: 'Carbon Black, без люфтов и дрифта стиков. Bluetooth, подходит к ПК.', tag: 'Xbox Gamepad' },
  { chapterId: 6, categoryId: 51, title: 'Фотоаппарат Canon EOS 600D + 18-55', details: 'Пробег ~15к кадров, две батареи, сумка, карта 32GB. Идеален для старта.', tag: 'Canon 600D' },
  { chapterId: 6, categoryId: 48, title: 'Колонка JBL Charge 5', details: 'Звук бомба, держит заряд сутки. Небольшая царапина на сетке, на звук не влияет.', tag: 'JBL Charge 5' },
  { chapterId: 6, categoryId: 50, title: 'Телевизор LG 43" 4K Smart TV', details: 'webOS, пульт-указка, крепление на стену в комплекте. 2022 год.', tag: 'LG 43 4K' },
  // Бытовая техника (3)
  { chapterId: 3, categoryId: 23, subSlug: 'multivarki', title: 'Мультиварка Redmond RMC-M90', details: '45 программ, чаша без царапин. Книга рецептов и пароварка в комплекте.', tag: 'Redmond M90' },
  { chapterId: 3, categoryId: 23, subSlug: 'kofevarki-i-kofemashiny', title: 'Кофемашина DeLonghi Magnifica S', details: 'Декальцинация по регламенту, варит эспрессо и капучино. Меняю — перешли на зерно у бариста.', tag: 'DeLonghi' },
  { chapterId: 3, categoryId: 23, subSlug: 'mikrovolnovye-pechi', title: 'Микроволновка Samsung 23л', details: 'Соло-режим, гриль. Работает тихо, внутри как новая.', tag: 'Samsung MW' },
  { chapterId: 3, categoryId: 25, title: 'Робот-пылесос Roborock S7', details: 'С влажной уборкой, станция, два контейнера. Картой квартиры поделюсь :)', tag: 'Roborock S7' },
  { chapterId: 3, categoryId: 27, title: 'Обогреватель Ballu 2кВт', details: 'Конвектор, термостат, использовался один сезон на даче.', tag: 'Ballu 2kW' },
  // Авто и запчасти (2)
  { chapterId: 2, categoryId: 15, title: 'Зимние шины Nokian Nordman 7 R16', details: '205/55 R16, комплект 4 шт., остаток протектора 6мм. Хранились в гараже.', tag: 'Nordman 7 R16' },
  { chapterId: 2, categoryId: 12, subSlug: 'zapchasti-legkovye', title: 'Фары передние VW Passat B8', details: 'LED, оригинал, сняты с целого авто. Без трещин и запотевания.', tag: 'Passat B8 LED' },
  { chapterId: 2, categoryId: 16, title: 'Видеорегистратор 70mai Pro Plus', details: 'GPS, парковочный режим, карта 64GB. Снят при продаже машины.', tag: '70mai Pro+' },
  // Мебель (11)
  { chapterId: 11, categoryId: 90, subSlug: 'mattresses', title: 'Матрас Vegas 160×200', details: 'Средняя жёсткость, независимые пружины. В чехле с момента покупки, состояние нового.', tag: 'Vegas 160x200' },
  { chapterId: 11, categoryId: 98, title: 'Кресло компьютерное Markus IKEA', details: 'Сетчатая спинка, подголовник. Газлифт держит, механизмы все рабочие.', tag: 'IKEA Markus' },
  { chapterId: 11, categoryId: 97, title: 'Стол обеденный дуб 140×80', details: 'Массив дуба, покрыт маслом. Пара царапин снизу столешницы, сверху идеален.', tag: 'Oak Table 140' },
  // Всё для дома (12)
  { chapterId: 12, categoryId: 106, title: 'Торшер лофт с диммером', details: 'Чёрный металл, лампа Эдисона в комплекте. Высота 165 см.', tag: 'Loft Lamp' },
  { chapterId: 12, categoryId: 108, title: 'Набор кастрюль Rondell 6 предметов', details: 'Нержавейка, индукция. Пользовались аккуратно, без сколов.', tag: 'Rondell Set' },
  // Гардероб (7/8)
  { chapterId: 7, categoryId: 54, title: 'Пальто шерстяное Zara, размер M', details: 'Бежевое, прямой крой, носилось один сезон. После химчистки.', tag: 'Zara Coat M' },
  { chapterId: 7, categoryId: 55, title: 'Ботинки Dr. Martens 1460, 38', details: 'Чёрные, гладкая кожа. Разношены, но состояние отличное.', tag: 'Dr Martens 38' },
  { chapterId: 8, categoryId: 57, title: 'Куртка зимняя Columbia, размер L', details: 'Omni-Heat, капюшон, тёмно-синяя. Тёплая до -25.', tag: 'Columbia L' },
  { chapterId: 8, categoryId: 58, title: 'Кроссовки New Balance 574, 43', details: 'Серые, замша, ношены пару месяцев. Подошва целая.', tag: 'NB 574 43' },
  // Дети (10)
  { chapterId: 10, categoryId: 81, title: 'Конструктор LEGO City 60198 Поезд', details: 'Все детали на месте, инструкция, моторизованный. Собран один раз.', tag: 'LEGO 60198' },
  { chapterId: 10, categoryId: 76, title: 'Коляска Anex Sport 2-в-1', details: 'Люлька + прогулочный блок, дождевик, москитка. После одного ребёнка.', tag: 'Anex Sport' },
  { chapterId: 10, categoryId: 77, title: 'Автокресло Britax Romer 9-36 кг', details: 'Isofix, не было в ДТП. Чехол стирался, поролон целый.', tag: 'Britax Romer' },
  // Хобби, спорт (15)
  { chapterId: 15, categoryId: 144, subSlug: 'bicycles', title: 'Велосипед Trek Marlin 5 29"', details: 'Рама M, 2022 год, обслужен в этом сезоне. Тормоза гидравлика.', tag: 'Trek Marlin 5' },
  { chapterId: 15, categoryId: 143, subSlug: 'weights-dumbbells', title: 'Гантели разборные 2×20 кг', details: 'Блины обрезиненные, замки надёжные. Самовывоз — тяжёлые :)', tag: 'Dumbbells 2x20' },
  { chapterId: 15, categoryId: 143, subSlug: 'skates', title: 'Коньки хоккейные Bauer X-LS, 42', details: 'Катались один сезон, лезвия точены недавно.', tag: 'Bauer X-LS' },
  { chapterId: 15, categoryId: 137, title: 'Гитара акустическая Yamaha F310', details: 'Струны новые, чехол и каподастр в подарок. Звук для своих денег супер.', tag: 'Yamaha F310' },
  { chapterId: 15, categoryId: 135, subSlug: 'fiction', title: 'Собрание Стругацких, 10 томов', details: 'Издание 2015, состояние отличное, не читались (стояли красиво).', tag: 'Strugatsky x10' },
  { chapterId: 15, categoryId: 140, title: 'Палатка трекинговая 3-местная', details: 'Два слоя, водостойкость 3000мм, вес 3.2кг. Использовалась 4 похода.', tag: 'Tent 3p' },
  // Сад (14), животные (17), прочее (19)
  { chapterId: 14, categoryId: 125, title: 'Газонокосилка электрическая Bosch ARM 34', details: '1300Вт, травосборник 40л. Нож наточен, кабель целый.', tag: 'Bosch ARM 34' },
  { chapterId: 17, categoryId: 155, title: 'Клетка для грызунов двухэтажная', details: 'С колесом, поилкой и домиком. После одного очень воспитанного хомяка.', tag: 'Pet Cage' },
  { chapterId: 19, categoryId: 159, title: 'Набор художника: мольберт + краски', details: 'Мольберт-тренога, акрил 24 цвета, кисти. Хобби не зашло — пусть творит другой.', tag: 'Art Set' },
];

// ───────────────────────── генерация картинок ─────────────────────────

const PALETTE = [
  0x4f6d8fff, 0x8f4f6dff, 0x6d8f4fff, 0x8f6d4fff, 0x4f8f8aff,
  0x7a4f8fff, 0x8f8a4fff, 0x4f5f8fff, 0x8f4f4fff, 0x4f8f5fff,
];

type SeedFonts = { big: any; small: any };

async function makeLotImageBuffer(
  tag: string,
  photoIndex: number,
  paletteIndex: number,
  fonts: SeedFonts,
): Promise<Buffer> {
  const image = new Jimp({
    width: 800,
    height: 600,
    color: PALETTE[(paletteIndex + photoIndex) % PALETTE.length],
  });

  // полупрозрачная плашка снизу, чтобы фото не выглядело голым прямоугольником
  const band = new Jimp({ width: 800, height: 140, color: 0x00000055 });
  image.composite(band, 0, 460);

  image.print({ font: fonts.big, x: 40, y: 200, text: tag, maxWidth: 720 });
  image.print({
    font: fonts.small,
    x: 40,
    y: 500,
    text: `photo ${photoIndex + 1} / dev seed`,
    maxWidth: 720,
  });

  return image.getBuffer('image/png');
}

// ───────────────────────── очистка прошлого посева ─────────────────────────

export async function wipeDevData(app: INestApplicationContext) {
  const ds = app.get(DataSource);
  const lotArchiveService = app.get(LotArchiveService);

  const usersRepo = ds.getRepository(UserEntity);
  const lotsRepo = ds.getRepository(LotEntity);
  const offersRepo = ds.getRepository(OfferEntity);
  const notifsRepo = ds.getRepository(NotificationEntity);
  const mediaRepo = ds.getRepository(MediaFileEntity);
  const sessionsRepo = ds.getRepository(SessionEntity);
  const prefsRepo = ds.getRepository(UserTaxonomyPreferenceEntity);

  const seedUsers = await usersRepo.find({
    where: { email: Like(`%@${SEED_EMAIL_DOMAIN}`) },
  });
  if (!seedUsers.length) {
    console.log('🧹 No previous dev seed data found');
    return;
  }

  const userIds = seedUsers.map((u) => u.id);
  const lots = await lotsRepo.find({ where: { userId: In(userIds) } });
  const lotIds = lots.map((l) => l.id);

  const offers = await offersRepo
    .createQueryBuilder('o')
    .where('o."proposerId" IN (:...ids) OR o."recipientId" IN (:...ids)', {
      ids: userIds,
    })
    .getMany();
  const offerIds = offers.map((o) => o.id);

  // Уведомления: адресованные сид-пользователям + ссылающиеся на их сущности
  // (например, жалобы у админа), чтобы не оставлять висячих ссылок.
  await notifsRepo
    .createQueryBuilder()
    .delete()
    .where('"userId" IN (:...ids)', { ids: userIds })
    .execute();
  const entityIds = [...offerIds, ...lotIds];
  if (entityIds.length) {
    await notifsRepo
      .createQueryBuilder()
      .delete()
      .where('"entityId" IN (:...entityIds)', { entityIds })
      .execute();
  }

  if (offerIds.length) await offersRepo.delete({ id: In(offerIds) });

  // Файлы картинок + строки media_files
  if (lotIds.length) {
    await mediaRepo.delete({ lotId: In(lotIds), type: MediaFileType.LOT_IMAGE });
    for (const lotId of lotIds) {
      await fs.rm(path.join(process.cwd(), 'media', 'lots', lotId), {
        recursive: true,
        force: true,
      });
    }
  }

  await prefsRepo.delete({ userId: In(userIds) });

  const sessions = await sessionsRepo.find({
    where: { user: { id: In(userIds) } },
  });
  if (sessions.length) await sessionsRepo.remove(sessions);

  // remove() (а не delete) — чтобы сработали подписчики и почистили
  // Redis-версии кэша; заодно снимаем архивные метки.
  for (const lot of lots) await lotArchiveService.remove(lot.id);
  if (lots.length) await lotsRepo.remove(lots, { chunk: 50 });
  await usersRepo.remove(seedUsers, { chunk: 50 });

  console.log(
    `🧹 Wiped previous dev seed: ${seedUsers.length} users, ${lots.length} lots, ${offers.length} offers`,
  );
}

// ───────────────────────── посев ─────────────────────────

type SeededLot = { id: string; chapterId: number; categoryId: number; subcategoryId: number | null; visibilityStatus: LotVisibilityStatus; title: string };

export async function seedDevData(
  app: INestApplicationContext,
  opts: { withImages: boolean },
) {
  const ds = app.get(DataSource);
  const lotsService = app.get(LotsService);
  const offersService = app.get(OffersService);
  const mediaService = app.get(MediaService);
  const prefsService = app.get(UserPreferencesService);

  const usersRepo = ds.getRepository(UserEntity);

  // 1. Пользователи — напрямую через репозиторий (минуя email-подтверждение),
  //    как это уже делает admin.seed.
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const users: UserEntity[] = [];

  for (const persona of PERSONAS) {
    const geo = randomGeo();
    const user = await usersRepo.save(
      usersRepo.create({
        email: `${persona.login}@${SEED_EMAIL_DOMAIN}`,
        login: persona.login,
        name: persona.name,
        password: passwordHash,
        role: UserRole.USER,
        status: true,
        statusEmail: true,
        phone: `29${randInt(1000000, 9999999)}`,
        regionId: geo.regionId,
        cityId: geo.cityId,
        districtId: geo.districtId ?? null,
        language: UserLanguage.RU,
        theme: UserThemes.LIGHT,
      }),
    );
    users.push(user);
  }
  console.log(`👥 Created ${users.length} users (password: ${SEED_PASSWORD})`);

  // 2. Лоты — через LotsService (валидация + Redis-версии), архивные через
  //    update, чтобы в Redis появилась дата архивации.
  const fonts: SeedFonts | null = opts.withImages
    ? { big: await loadFont(SANS_64_WHITE), small: await loadFont(SANS_32_WHITE) }
    : null;

  const lotsByUser = new Map<string, SeededLot[]>();
  let lotCount = 0;
  let imageCount = 0;

  for (const user of users) {
    const payload: JwtPayload = {
      sub: user.id,
      sid: 'dev-seed',
      login: user.login,
      role: user.role,
    };

    const items = pickN(CATALOG, randInt(6, 9));
    const userLots: SeededLot[] = [];

    for (const [index, item] of items.entries()) {
      // Иногда лот публикуется не из домашнего города пользователя
      const geo = chance(0.85)
        ? {
            regionId: user.regionId!,
            cityId: user.cityId!,
            districtId: user.districtId ?? undefined,
          }
        : randomGeo();

      // ~70% активных, ~15% скрытых, ~15% архивных
      const roll = rand();
      const finalStatus =
        roll < 0.7
          ? LotVisibilityStatus.ACTIVE
          : roll < 0.85
            ? LotVisibilityStatus.HIDDEN
            : LotVisibilityStatus.ARCHIVED;

      const created = await lotsService.create(
        {
          chapterId: item.chapterId,
          categoryId: item.categoryId,
          subcategoryId: resolveSubcategory(item.categoryId, item.subSlug),
          generalDescription: item.title,
          characteristicsDescription: item.details,
          quantity: chance(0.9) ? 1 : randInt(2, 4),
          visibilityStatus:
            finalStatus === LotVisibilityStatus.HIDDEN
              ? LotVisibilityStatus.HIDDEN
              : LotVisibilityStatus.ACTIVE,
          regionId: geo.regionId,
          cityId: geo.cityId,
          districtId: geo.districtId,
        },
        payload,
      );

      if (fonts) {
        const photos = randInt(1, 3);
        for (let i = 0; i < photos; i++) {
          const buffer = await makeLotImageBuffer(item.tag, i, lotCount, fonts);
          await mediaService.uploadLotImage(
            created.id,
            {
              buffer,
              mimetype: 'image/png',
              size: buffer.length,
              originalname: `${item.tag.replace(/\s+/g, '-')}-${i + 1}.png`,
            },
            payload,
          );
          imageCount++;
        }
      }

      if (finalStatus === LotVisibilityStatus.ARCHIVED) {
        await lotsService.update(
          created.id,
          { visibilityStatus: LotVisibilityStatus.ARCHIVED },
          payload,
        );
      }

      userLots.push({
        id: created.id,
        chapterId: created.chapterId,
        categoryId: created.categoryId,
        subcategoryId: created.subcategoryId,
        visibilityStatus: finalStatus,
        title: item.title,
      });
      lotCount++;
      void index;
    }

    lotsByUser.set(user.id, userLots);
  }
  console.log(`📦 Created ${lotCount} lots, ${imageCount} images`);

  // 3. Предпочтения — через сервис. Каждому юзеру даём разделы, в которых
  //    реально есть лоты у «соседей», чтобы гейт предложений был проходим.
  for (const [index, user] of users.entries()) {
    const neighbourChapters = new Set<number>();
    for (let step = 1; step <= 3; step++) {
      const neighbour = users[(index + step) % users.length];
      for (const lot of lotsByUser.get(neighbour.id) ?? []) {
        neighbourChapters.add(lot.chapterId);
      }
    }

    const items = [...neighbourChapters]
      .slice(0, randInt(3, 5))
      .map((chapterId) => ({
        targetType: TaxonomyTargetType.CHAPTER,
        targetId: chapterId,
        weight: randInt(1, 3) as 1 | 2 | 3,
      }));

    // немного точечных интересов для разнообразия выдачи рекомендаций
    const foreignLot = pick(
      lotsByUser.get(users[(index + 4) % users.length].id) ?? [],
    );
    if (foreignLot && !neighbourChapters.has(foreignLot.chapterId)) {
      items.push({
        targetType: TaxonomyTargetType.CATEGORY,
        targetId: foreignLot.categoryId,
        weight: randInt(1, 3) as 1 | 2 | 3,
      });
    }

    await prefsService.replaceAll(user.id, items);
  }
  console.log('🎯 Preferences set for all users');

  // 4. Предложения — через OffersService со всеми переходами статусов
  //    (уведомления и таймстампы создаются самими сервисами).
  type Scenario =
    | 'pending'
    | 'accepted'
    | 'half_confirmed'
    | 'completed'
    | 'rejected'
    | 'accepted_then_rejected';

  const SCENARIOS: Array<[number, number, Scenario]> = [
    [0, 1, 'pending'],
    [1, 0, 'accepted'],
    [2, 0, 'completed'],
    [0, 3, 'rejected'],
    [4, 0, 'half_confirmed'],
    [5, 0, 'pending'],
    [0, 6, 'accepted_then_rejected'],
    [1, 2, 'completed'],
    [3, 4, 'pending'],
    [5, 6, 'accepted'],
    [7, 8, 'half_confirmed'],
    [8, 9, 'rejected'],
    [9, 7, 'completed'],
    [6, 2, 'pending'],
    [2, 9, 'accepted'],
    [4, 7, 'pending'],
    [8, 1, 'accepted_then_rejected'],
    [9, 0, 'pending'],
  ];

  const usedTargets = new Set<string>();
  let offerCount = 0;
  let skipped = 0;

  for (const [proposerIdx, recipientIdx, scenario] of SCENARIOS) {
    const proposer = users[proposerIdx];
    const recipient = users[recipientIdx];

    const targets = (lotsByUser.get(recipient.id) ?? []).filter(
      (lot) =>
        lot.visibilityStatus === LotVisibilityStatus.ACTIVE &&
        !usedTargets.has(`${proposer.id}:${lot.id}`),
    );

    const availability = await prefsService.getAvailabilityForUser(
      recipient.id,
    );
    const chapters = new Set(availability.chapterIds);
    const categories = new Set(availability.categoryIds);
    const subs = new Set(availability.subcategoryIds);

    const offerable = (lotsByUser.get(proposer.id) ?? []).filter(
      (lot) =>
        lot.visibilityStatus !== LotVisibilityStatus.ARCHIVED &&
        (chapters.has(lot.chapterId) ||
          categories.has(lot.categoryId) ||
          (lot.subcategoryId != null && subs.has(lot.subcategoryId))),
    );

    if (!targets.length || !offerable.length) {
      skipped++;
      continue;
    }

    const target = pick(targets);
    usedTargets.add(`${proposer.id}:${target.id}`);

    const offered = pickN(offerable, randInt(1, Math.min(3, offerable.length)));
    const offer = await offersService.create(proposer.id, {
      lotId: target.id,
      offeredLotIds: offered.map((lot) => lot.id),
    });

    switch (scenario) {
      case 'accepted':
        await offersService.accept(offer.id, recipient.id);
        break;
      case 'half_confirmed':
        await offersService.accept(offer.id, recipient.id);
        await offersService.confirmCompletion(offer.id, proposer.id);
        break;
      case 'completed':
        await offersService.accept(offer.id, recipient.id);
        await offersService.confirmCompletion(offer.id, proposer.id);
        await offersService.confirmCompletion(offer.id, recipient.id);
        break;
      case 'rejected':
        await offersService.reject(offer.id, recipient.id);
        break;
      case 'accepted_then_rejected':
        await offersService.accept(offer.id, recipient.id);
        await offersService.reject(offer.id, proposer.id);
        break;
      case 'pending':
        break;
    }
    offerCount++;
  }
  console.log(
    `🤝 Created ${offerCount} offers in mixed statuses${skipped ? ` (${skipped} scenarios skipped)` : ''}`,
  );

  // Уведомления создаются fire-and-forget — даём им долететь до закрытия app.
  await new Promise((resolve) => setTimeout(resolve, 1500));

  console.log('');
  console.log('────────────────────────────────────────────');
  console.log(`  Dev users (password for all: ${SEED_PASSWORD})`);
  for (const user of users) {
    console.log(`  ${user.login.padEnd(10)} ${user.email}`);
  }
  console.log('────────────────────────────────────────────');
}
