import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import axios from 'axios';
import * as yup from 'yup';
import initView from './view.js';

const parser = new DOMParser();
const makeCorrectLink = (link) => `https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(link)}`;

const validate = (value, model) => {
  const schema = yup
    .string().url().required();

  const check1 = (url) => schema.validate(url);
  const check2 = (url) => axios.get(makeCorrectLink(url))
    .then(response => {
      if (!response.data.contents.includes('<?xml')) {
        throw new Error('Ресурс не содержит валидный RSS');
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
  .catch(error => error.message);

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
            reject(new Error('Этот поток уже есть в ленте'));
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

app();
