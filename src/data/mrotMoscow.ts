import { housingData, type HousingDataPoint } from './housingData';

// МРОТ в Москве (источник: clubtk.ru/tablitsa-znacheniy-mrot-v-rossii), дата начала действия → размер, ₽
export const mrotMoscowChanges: { from: string; value: number }[] = [
  { from: '2010-01', value: 9500 },
  { from: '2010-05', value: 10100 },
  { from: '2011-01', value: 10400 },
  { from: '2011-07', value: 11100 },
  { from: '2012-01', value: 11300 },
  { from: '2012-07', value: 11700 },
  { from: '2013-07', value: 12200 },
  { from: '2014-01', value: 12600 },
  { from: '2014-06', value: 14000 },
  { from: '2015-01', value: 14500 },
  { from: '2015-04', value: 15000 },
  { from: '2015-06', value: 16500 },
  { from: '2015-11', value: 17300 },
  { from: '2016-10', value: 17561 },
  { from: '2017-07', value: 17642 },
  { from: '2017-10', value: 18742 },
  { from: '2018-11', value: 18781 },
  { from: '2019-07', value: 19351 },
  { from: '2019-10', value: 20195 },
  { from: '2020-10', value: 20361 },
  { from: '2021-01', value: 20589 },
  { from: '2022-01', value: 21371 },
  { from: '2022-06', value: 23508 },
  { from: '2023-01', value: 24801 },
  { from: '2024-01', value: 29389 },
  { from: '2025-01', value: 32916 },
  { from: '2026-01', value: 39730 },
];

export function mrotForMonth(month: string): number | null {
  let v: number | null = null;
  for (const c of mrotMoscowChanges) if (c.from <= month) v = c.value;
  return v;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export const mrotData: HousingDataPoint[] = housingData
  .filter((d) => d.month >= '2010-01')
  .map((d) => {
    const w = mrotForMonth(d.month)!;
    return {
      ...d,
      salary: w,
      yearsToBuy: r1(d.apartmentCost54 / (w * 12)),
      rentShareOfSalary: r1((d.rent1room / w) * 100),
      sqmToSalary: r1(d.pricePerSqm / w),
    };
  });
