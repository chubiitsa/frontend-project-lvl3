import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import axios from 'axios';
import * as yup from 'yup';
import { setLocale } from 'yup';
import i18next from 'i18next';
import initView from './view.js';
import resources from './translation/translation.json';
import { getFeedData, getPostsData, parseRSS } from "./parse.js";

const addProxy = (url) => {
  const proxy = 'https://hexlet-allorigins.herokuapp.com/';
  const urlWithProxy = new URL('get', proxy);
  urlWithProxy.searchParams.append('disableCache', true);
  urlWithProxy.searchParams.append('url', url);
  return urlWithProxy;
};

const elements = {
  feedsBox: document.querySelector('.feeds-list'),
  postsBox: document.querySelector('.posts-list'),
  input: document.querySelector('.rss-link'),
  form: document.querySelector('.rss-form'),
  submitBtn: document.querySelector('.submit-button'),
};

const validate = (value, model) => {
  setLocale({
    mixed: {
      required: i18next.t('errors.required'),
      notOneOf: i18next.t('errors.existedRss'),
    },
    string: {
      url: i18next.t('errors.invalidUrl'),
    },
  });

  const existedFeeds = model.getFeedsArray();

  const schema = yup
    .string().required().url().notOneOf(existedFeeds);

  try {
    schema.validateSync(value);
    return null;
  } catch (err) {
    return err.message;
  }
};

const sendRequest = (link) => axios.get(addProxy(link))
  .then(response => response.data.contents)
  .catch(error => error.message);

const app = () => {
  const model = {
    feeds: [],
    posts: [],
    error: null,
    loadingProcess : {
      status: 'idle', // loading, failed
      error: null,
    },
    form: {
      error: null,
      status: 'filling', // read-only
    },
    getFeedId: () => _.uniqueId('feed_'),
    getFeedsArray() {
      return this.feeds.map((feed) => feed.value);
    },
  };

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const value = formData.get('name');
    const watched = initView(model, elements);

    const error = validate(value, watched);

    if (error) {
      watched.form.error = error;
      return;
    }

    watched.form.status = 'read-only';
    watched.loadingProcess.status = 'loading';

    sendRequest(value)
      .then((data) => parseRSS(data))
      .then((rssData) => {
        watched.loadingProcess.error = null;
        const feed = getFeedData(rssData, watched);
        const feedId = watched.getFeedId();
        watched.feeds.push({ value, feedId, ...feed });
        return getPostsData(rssData, feedId);
      })
      .then((posts) => {
        watched.posts.push(...posts);
        watched.form.status = 'filling';
      })
      .catch((err) => {
        watched.form.status = 'filling';
        watched.loadingProcess.status = 'failed';
        watched.loadingProcess.error = err.message;
      });
  });
};

i18next.init({
  lng: 'ru',
  debug: true,
  resources,
}, () => {
  document.getElementById('header').textContent = i18next.t('header');
  document.getElementById('description').textContent = i18next.t('description');
  document.getElementById('input-placeholder').setAttribute('placeholder', i18next.t('input-placeholder'));
  document.getElementById('add-button').textContent = i18next.t('add-button');
  document.getElementById('example').textContent = i18next.t('example');
  document.getElementById('feeds-title').textContent = i18next.t('feeds-title');
  document.getElementById('feeds-description').textContent = i18next.t('feeds-description');
  document.getElementById('posts-title').textContent = i18next.t('posts-title');
  document.getElementById('posts-description').textContent = i18next.t('posts-description');
}).then(app());
