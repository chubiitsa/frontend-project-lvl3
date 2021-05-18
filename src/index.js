import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import axios from 'axios';
import * as yup from 'yup';
import { setLocale } from 'yup';
import i18next from 'i18next';
import initView from './view.js';
import resources from './translation/translation.json';

const parser = new DOMParser();
const makeCorrectLink = (link) => `https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(link)}`;

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

  const check1 = (url) => schema.validate(url);
  const check2 = (url) => axios.get(makeCorrectLink(url))
    .then(response => {
      if (!response.data.contents.includes('<?xml')) {
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

const sendRequest = (link) => axios.get(makeCorrectLink(link))
  .then(response => response.data.contents)
  .catch(error => error.message); // добавить обработку этих ошибок ( + перевод)

const parseRSS = (rssString) => parser.parseFromString(rssString, 'application/xml');

const elements = {
  feedsBox: document.querySelector('.feeds-list'),
  postsBox: document.querySelector('.posts-list'),
  input: document.querySelector('.rss-link'),
  form: document.querySelector('.rss-form'),
  submitBtn: document.querySelector('.submit-button'),
};

const app = () => { // controller
  const model = {
    feeds: [],
    error: null,
    form: {
      status: 'filling',
    },
    isFeedExist(url) {
      return new Promise((resolve = (v) => v, reject = (error) => error) => {
        this.feeds.forEach((feed) => {
          if (feed.link === url) {
            reject(new Error(i18next.t('errors.existedRss')));
          }
        });
        resolve(url);
      });
    },
  };

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const link = formData.get('name');
    const watched = initView(model, elements);

    validate(link, watched)
      .then((value) => {
        watched.form = {
          error: null,
        };
        return value;
      })
      .catch((err) => {
        watched.form.status = 'failed';
        watched.form = {
          error: err.message,
        };
        return err.message;
      })
      .then((value) => {
        if (watched.form.error) {
          return;
        }
        watched.form.status = 'loading';
        sendRequest(value)
          .then((data) => {
            watched.error = null;
            const rssData = parseRSS(data);
            watched.feeds.push({ link, data: rssData });
            watched.form.status = 'filling';
          })
          .catch((err) => {
            watched.form.status = 'failed';
            watched.error = err.message;
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
