import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import axios from 'axios';
import * as yup from 'yup';
import { setLocale } from 'yup';
import i18next from 'i18next';
import initView from './view.js';
import resources from './translation/translation.json';
import parse from './parse.js';

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
  modal: document.querySelector('.modal'),
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
  .then(response => response.data.contents);

const updatePosts = (model, interval) => {
  const feeds = model.getFeedsArray();
  const rssData = feeds.map((feed) => sendRequest(feed)
    .then(parse)
    .then(({ posts }) => posts.map((post) => ({ feedId: feed, ...post })))
    .then(posts => {
      const newPosts = _.differenceBy(posts, model.posts, 'link');
      model.posts = [...newPosts, ...model.posts];
    }));
  return Promise.all(rssData)
    .finally(() => setTimeout(() => updatePosts(model, interval), interval));
};

const app = () => {
  const updateInterval = 5000;
  const model = {
    feeds: [],
    posts: [],
    loadingProcess: {
      status: 'idle', // loading, failed
      error: null,
    },
    form: {
      status: 'filling', // read-only, failed
      error: null,
    },
    modal: {
      openedPost: null,
    },
    ui: {
      seenPosts: new Set(),
    },
    getFeedsArray() {
      return this.feeds.map((feed) => feed.id);
    },
  };
  const watched = initView(model, elements);

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const value = formData.get('name');
    const error = validate(value, watched);

    if (error) {
      watched.form.error = error;
      watched.form.status = 'failed';
      return;
    }

    watched.form.status = 'read-only';
    watched.loadingProcess.status = 'loading';

    sendRequest(value)
      .then((data) => {
        const { title, description, posts } = parse(data);
        watched.feeds = [{ id: value, title, description }, ...watched.feeds];
        const postsWithFeedId = posts.map((post) => ({ feedId: value, ...post }));
        watched.posts = [...postsWithFeedId, ...watched.posts];
        watched.loadingProcess.error = null;
        watched.form.error = null;
        watched.form.status = 'filling';
        watched.loadingProcess.status = 'idle';
      })
      .catch((err) => {
        if (err.message === 'parsingError') {
          watched.loadingProcess.error = i18next.t('errors.noRss');
        } else {
          watched.loadingProcess.error = i18next.t('errors.network');
        }
        watched.loadingProcess.status = 'failed';
        watched.form.status = 'failed';
      });
  });

  elements.postsBox.addEventListener('click', (e) => {
    const eventTarget = e.target;
    if (!eventTarget.dataset.id) return;
    const postId = eventTarget.dataset.id;
    if (eventTarget.tagName === 'BUTTON') {
      watched.modal.openedPost = postId;
    }
    watched.ui.seenPosts.add(postId);
  });

  updatePosts(watched, updateInterval);
};

i18next.init({
  lng: 'ru',
  debug: true,
  resources,
}, () => {
  document.getElementById('header').textContent = i18next.t('header');
  document.getElementById('description').textContent = i18next.t('description');
  document.getElementById('input-placeholder').setAttribute('placeholder', i18next.t('input-placeholder'));
  document.getElementById('add-button').textContent = i18next.t('buttons.add');
  document.getElementById('example').textContent = i18next.t('example');
  document.getElementById('feeds-title').textContent = i18next.t('feeds-title');
  document.getElementById('feeds-description').textContent = i18next.t('feeds-description');
  document.getElementById('posts-title').textContent = i18next.t('posts-title');
  document.getElementById('posts-description').textContent = i18next.t('posts-description');
  document.querySelector('.modal-full-post-link').textContent = i18next.t('modal-full-post-link');
  document.querySelector('.modal-close-btn').textContent = i18next.t('buttons.modal-close-btn');
}).then(app());
