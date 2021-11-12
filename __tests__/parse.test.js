import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import parse from '../src/parse.js';

const fileName = fileURLToPath(import.meta.url);
const dirName = path.dirname(fileName);

const getFixturePath = (filename) => path.join(dirName, '..', '__fixtures__', filename);
const readFile = (name) => fs.readFileSync(name, 'utf-8');

const actual = parse(readFile(getFixturePath('rssdoc')));
const expected = { title: 'Новые уроки на Хекслете', description: 'Практические уроки по программированию' };

test('getFeedData', () => {
  expect(actual.title).toEqual(expected.title);
  expect(actual.description).toEqual(expected.description);
});
