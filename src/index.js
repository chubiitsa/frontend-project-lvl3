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
    },
    string: {
      url: i18next.t('errors.invalidUrl'),
    },
  });

  const schema = yup
    .string().required().url();

  const check1 = (value) => schema.validate(value);
  const check2 = (value) => axios.get(addProxy(value))
    .then(response => {
      if (!response.data.contents.includes('<?xml')) {
        model.form = {
          status: 'failed',
        }
       throw new Error(i18next.t('errors.noRss'));
      } else {
        return value;
      }
    });
  const check3 = (url) => model.isFeedExist(url);

  return check1(value)
    .then(value2 => check2(value2))
    .then(value3 => check3(value3));
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
      status: 'filling', // validating, failed
      valid: false,
    },
    getFeedId: () => _.uniqueId('feed_'),
    isFeedExist(url) {
      return new Promise((resolve = (v) => v, reject = (error) => error) => {
        this.feeds.forEach((feed) => {
          if (feed.link === url) reject(new Error(i18next.t('errors.existedRss')));
        });
        resolve(url);
      });
    },
  };

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const value = formData.get('name');
    const watched = initView(model, elements);

    validate(value, watched)
      .then((link) => {
        watched.form = {
          error: null,
        };
        return link;
      })
      .catch((err) => {
        if (err.message === 'Network Error') {
          watched.loadingProcess = {
            error: i18next.t('errors.network'),
            status: 'failed',
          }
        }
        else {
          watched.form = {
            error: err.message,
          };
        }
        return err.message;
      })
      .then((link) => {
        if (watched.form.error || watched.loadingProcess.error) {
          return;
        }
        watched.loadingProcess.status = 'loading';
        sendRequest(link)
          .then((data) => parseRSS(data))
          .then((rssData) => {
            watched.loadingProcess.error = null;
            const feed = getFeedData(rssData, watched);
            const feedId = watched.getFeedId();
            watched.feeds.push({ link, feedId, ...feed });
            return getPostsData(rssData, feedId);
          })
          .then((posts) => {
            watched.posts.push(...posts);
            watched.form.status = 'filling';
          })
          .catch((err) => {
            watched.form.status = 'failed';
            watched.loadingProcess.error = err.message;
          });
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
