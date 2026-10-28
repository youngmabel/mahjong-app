import { describe, expect, it } from 'vitest';
import {
  DRAGON_OF_SUIT,
  FLOWER,
  GREEN,
  JOKER,
  NUM_KINDS,
  RED,
  SOAP,
  SUPPLY,
  TILE_COUNT,
  allTileIds,
  countsOf,
  kindCode,
  kindFromCode,
  kindName,
  kindNamePlural,
  kindOfTile,
  numKind,
  suitOfDragon,
  tileIdsOfKind,
  totalOf,
} from '../src/engine/tiles';

describe('tiles', () => {
  it('has 36 kinds and 152 tiles: 4 of each, 8 flowers, 8 jokers, no blanks', () => {
    expect(NUM_KINDS).toBe(36);
    expect(totalOf(SUPPLY)).toBe(152);
    expect(TILE_COUNT).toBe(152);
    expect(SUPPLY[FLOWER]).toBe(8);
    expect(SUPPLY[JOKER]).toBe(8);
    for (let k = 0; k < 34; k++) expect(SUPPLY[k]).toBe(4);
  });

  it('maps every physical tile id to a kind, matching the supply', () => {
    const counts = countsOf(allTileIds());
    expect(counts).toEqual([...SUPPLY]);
    for (let k = 0; k < NUM_KINDS; k++) {
      const ids = tileIdsOfKind(k);
      expect(ids.length).toBe(SUPPLY[k]);
      for (const id of ids) expect(kindOfTile(id)).toBe(k);
    }
  });

  it('round-trips tile codes and names them in plain English', () => {
    for (let k = 0; k < NUM_KINDS; k++) expect(kindFromCode(kindCode(k))).toBe(k);
    expect(kindCode(numKind(2, 5))).toBe('5D');
    expect(kindName(numKind(2, 5))).toBe('5 Dot');
    expect(kindName(numKind(0, 1))).toBe('1 Bam');
    expect(kindName(numKind(1, 9))).toBe('9 Crak');
    expect(kindName(SOAP)).toBe('Soap');
    expect(kindNamePlural(numKind(2, 5))).toBe('5 Dots');
    expect(kindNamePlural(RED)).toBe('Red Dragons');
  });

  it('links dragons to suits: Green-Bams, Red-Craks, Soap-Dots', () => {
    expect(DRAGON_OF_SUIT[0]).toBe(GREEN);
    expect(DRAGON_OF_SUIT[1]).toBe(RED);
    expect(DRAGON_OF_SUIT[2]).toBe(SOAP);
    expect(suitOfDragon(SOAP)).toBe(2);
  });
});
