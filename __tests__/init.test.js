import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/dom';
import nock from 'nock';
import path from 'path';
import axios from 'axios';
import { readFileSync, createReadStream } from 'fs';
import run from '../src/init.js';

axios.defaults.adapter = require('axios/lib/adapters/http');

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
});

test('add feed', async () => {
  const scope = nock(nockBasePath)
    .get(`/get?disableCache=true&url=${link}`)
    .replyWithFile(200, pathToResponseFile);

  userEvent.paste(elements.input, link);
  userEvent.click(elements.submitButton);
  expect(await screen.findByText(/Идет загрузка .../i)).toBeInTheDocument();
  expect(await screen.findByText(/RSS успешно загружен/i)).toBeInTheDocument();

  scope.done();
});

test('validation: url', async () => {
  userEvent.paste(elements.input, brokenLink);
  userEvent.click(elements.submitButton);
  expect(await screen.findByText(/Ссылка должна быть валидным URL/i)).toBeInTheDocument();
});

test('validation: unique feed', async () => {
  const scope = nock(nockBasePath)
    .get(`/get?disableCache=true&url=${link}`)
    .replyWithFile(200, pathToResponseFile);

  userEvent.paste(elements.input, link);
  userEvent.click(elements.submitButton);

  expect(await screen.findByText(/Идет загрузка .../i)).toBeInTheDocument();
  expect(await screen.findByText(/RSS успешно загружен/i)).toBeInTheDocument();

  userEvent.paste(elements.input, link);
  userEvent.click(elements.submitButton);
  expect(await screen.findByText(/RSS уже существует/i)).toBeInTheDocument();

  scope.done();
});

test('validation: no RSS', async () => {
  const scope = nock(nockBasePath)
    .get(`/get?disableCache=true&url=${linkWithoutRss}`)
    .replyWithFile(200, pathToWrongResponseFile);

  userEvent.paste(elements.input, linkWithoutRss);
  userEvent.click(elements.submitButton);

  expect(await screen.findByText(/Ресурс не содержит валидный RSS/i)).toBeInTheDocument();

  scope.done();
});

test('render feed & posts', async () => {
  const scope = nock(nockBasePath)
    .get(`/get?disableCache=true&url=${link}`)
    .replyWithFile(200, pathToResponseFile);

  userEvent.paste(elements.input, link);
  userEvent.click(elements.submitButton);

  expect(await screen.findByText(/RSS успешно загружен/i)).toBeInTheDocument();
  expect(screen.getByText(/Новые уроки на Хекслете/i)).toBeInTheDocument();
  expect(screen.getByText(/Практические уроки по программированию/i)).toBeInTheDocument();
  expect(await screen.findByRole('link', { name: /Фильтрация \/ Java: Корпоративные приложения на Spring Boot/i })).toBeInTheDocument();
  expect(await screen.findByRole('link', { name: /Open API \/ Java: Корпоративные приложения на Spring Boot/i })).toBeInTheDocument();

  scope.done();
});

test('modal opening', async () => {
  const scope = nock(nockBasePath)
    .get(`/get?disableCache=true&url=${link}`)
    .replyWithFile(200, pathToResponseFile);

  userEvent.paste(elements.input, link);
  userEvent.click(elements.submitButton);

  expect(await screen.findByText(/RSS успешно загружен/i)).toBeInTheDocument();
  const buttons = screen.getAllByRole('button', { name: /Просмотр/i });
  userEvent.click(buttons[0]);
  expect(await waitFor(() => screen.findByRole('document'))).toBeInTheDocument();
  expect(screen.getByText(/Цель: Научиться использовать фильтрацию данных по определённым критериям/i)).toBeInTheDocument();

  scope.done();
});

test('disabled while loading', async () => {
  const scope = nock(nockBasePath)
    .get(`/get?disableCache=true&url=${link}`)
    .replyWithFile(200, pathToResponseFile);

  userEvent.paste(elements.input, link);
  expect(elements.submitButton).toBeEnabled();
  userEvent.click(elements.submitButton);
  expect(elements.submitButton).toBeDisabled();
  expect(await screen.findByText(/Идет загрузка .../i)).toBeInTheDocument();
  expect(await screen.findByText(/RSS успешно загружен/i)).toBeInTheDocument();
  await expect(elements.submitButton).toBeEnabled();

  scope.done();
});

test('network error', async () => {
  const scope = nock(nockBasePath)
    .get(`/get?disableCache=true&url=${link}`)
    .reply(404);

  userEvent.paste(elements.input, link);
  userEvent.click(elements.submitButton);

  expect(await screen.findByText(/Ошибка сети/i)).toBeInTheDocument();

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

  expect(await screen.findByText(/RSS успешно загружен/i)).toBeInTheDocument();
  expect(await screen.findAllByRole('link')).toHaveLength(2);

  await waitFor(async () => {
    const posts = await screen.findAllByRole('link');
    expect(posts).toHaveLength(3);
  }, { timeout: 6000 });

  scope.done();
});
