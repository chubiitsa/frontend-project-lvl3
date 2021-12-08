import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/dom';
import nock from 'nock';
import path from 'path';
import { readFileSync, createReadStream } from 'fs';
import run from '../src/init.js';

const pathToIndex = path.join('.', 'index.html');
const data = readFileSync(pathToIndex, 'utf-8');
const nockBasePath = 'https://hexlet-allorigins.herokuapp.com';

const link = 'https://ru.hexlet.io/lessons.rss';
const brokenLink = 'it is not a valid url';
const linkWithoutRss = 'https://ru.hexlet.io/';

const pathToResponseFile = '__fixtures__/response.json';
const pathToFileWithUpdates = '__fixtures__/response_with_new_posts.json';
const pathToWrongResponseFile = '__fixtures__/response.xml';
const elements = {};

beforeAll(() => {
  nock.disableNetConnect();
});

beforeEach(async () => {
  await nock.cleanAll();
  document.body.innerHTML = data;
  await run();
  elements.input = screen.getByRole('textbox');
  elements.submitButton = screen.getByRole('button');
  elements.feedsBox = screen.getByRole('list', { name: 'feedsBox' });
  elements.postsList = screen.getByRole('list', { name: 'postsBox' });
});

test('add feed', async () => {
  const scope = nock(nockBasePath)
    .get(`/get?disableCache=true&url=${link}`)
    .replyWithFile(200, pathToResponseFile);

  userEvent.paste(elements.input, link);
  userEvent.click(elements.submitButton);
  await waitFor(() => screen.findByText('Идет загрузка ...'));
  await waitFor(() => screen.findByText('RSS успешно загружен'));

  scope.done();
});

test('validation: url', async () => {
  userEvent.paste(elements.input, brokenLink);
  userEvent.click(elements.submitButton);
  await waitFor(() => screen.findByText('Ссылка должна быть валидным URL'));
});

test('validation: unique feed', async () => {
  const scope = nock(nockBasePath)
    .get(`/get?disableCache=true&url=${link}`)
    .replyWithFile(200, pathToResponseFile);

  userEvent.paste(elements.input, link);
  userEvent.click(elements.submitButton);

  await waitFor(() => screen.findByText('Идет загрузка ...'));
  await waitFor(() => screen.findByText('RSS успешно загружен'));

  userEvent.paste(elements.input, 'https://ru.hexlet.io/lessons.rss');
  userEvent.click(elements.submitButton);
  await waitFor(() => screen.findByText('RSS уже существует'));

  scope.done();
});

test('validation: no RSS', async () => {
  const scope = nock(nockBasePath)
    .get(`/get?disableCache=true&url=${linkWithoutRss}`)
    .replyWithFile(200, pathToWrongResponseFile);

  userEvent.paste(elements.input, linkWithoutRss);
  userEvent.click(elements.submitButton);

  await waitFor(() => screen.findByText('Ресурс не содержит валидный RSS'));

  scope.done();
});

test('render feed & posts', async () => {
  const scope = nock(nockBasePath)
    .get(`/get?disableCache=true&url=${link}`)
    .replyWithFile(200, pathToResponseFile);

  userEvent.paste(elements.input, link);
  userEvent.click(elements.submitButton);

  await waitFor(() => screen.findByText('RSS успешно загружен'));
  expect(elements.feedsBox.children).toHaveLength(1);
  screen.getByText('Новые уроки на Хекслете');
  screen.getByText('Практические уроки по программированию');
  expect(elements.postsList.children).toHaveLength(2);
  scope.done();
});

test('modal opening', async () => {
  const scope = nock(nockBasePath)
    .get(`/get?disableCache=true&url=${link}`)
    .replyWithFile(200, pathToResponseFile);

  userEvent.paste(elements.input, link);
  userEvent.click(elements.submitButton);

  await waitFor(() => screen.findByText('RSS успешно загружен'));
  const buttons = screen.getAllByRole('button', { name: 'preview-button' });
  userEvent.click(buttons[0]);
  await waitFor(() => screen.findByRole('document'));
  screen.getByText('Цель: Научиться использовать фильтрацию данных по определённым критериям');
  scope.done();
});

test('disabled while loading', async () => {
  const scope = nock(nockBasePath)
    .get(`/get?disableCache=true&url=${link}`)
    .replyWithFile(200, pathToResponseFile);

  userEvent.paste(elements.input, link);
  expect(elements.submitButton).not.toBeDisabled();
  userEvent.click(elements.submitButton);
  expect(elements.submitButton).toBeDisabled();
  await waitFor(() => screen.findByText('Идет загрузка ...'));
  await waitFor(() => screen.findByText('RSS успешно загружен'));

  scope.done();
});

test('network error', async () => {
  const scope = nock(nockBasePath)
    .get(`/get?disableCache=true&url=${link}`)
    .reply(404);

  userEvent.paste(elements.input, link);
  userEvent.click(elements.submitButton);

  await waitFor(() => screen.findByText('Ошибка сети'));
  scope.done();
});

test('updating posts', async () => {
  jest.setTimeout(10000);
  const scope = nock(nockBasePath)
    .persist()
    .get(`/get?disableCache=true&url=${link}`)
    .reply(200, (() => {
      let count = 0;
      return () => {
        if (count === 0) {
          count += 1;
          return createReadStream(pathToResponseFile);
        }
        return createReadStream(pathToFileWithUpdates);
      };
    })());

  userEvent.paste(elements.input, link);
  userEvent.click(elements.submitButton);

  await waitFor(() => screen.findByText('RSS успешно загружен'));
  expect(elements.postsList.children).toHaveLength(2);
  await waitFor(() => expect(elements.postsList.children).toHaveLength(3), { timeout: 6000 });
  scope.done();
});
