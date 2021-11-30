import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import axios from 'axios';
import * as yup from 'yup';
import _ from 'lodash';
import { setLocale } from 'yup';
import i18next from 'i18next';
import initView from './view.js';
import resources from './translation/translation.json';
import parse from './parse.js';

axios.defaults.adapter = require('axios/lib/adapters/http');

const addProxy = (url) => {
  const proxy = 'https://hexlet-allorigins.herokuapp.com/';
  const urlWithProxy = new URL('get', proxy);
  urlWithProxy.searchParams.append('disableCache', true);
  urlWithProxy.searchParams.append('url', url);
  return urlWithProxy;
};

const validate = (value, model, translator) => {
  setLocale({
    mixed: {
      required: translator('errors.required'),
      notOneOf: translator('errors.existedRss'),
    },
    string: {
      url: translator('errors.invalidUrl'),
    },
  });

  const existedFeeds = model.feeds.map((feed) => feed.id);

  const schema = yup
    .string().required().url().notOneOf(existedFeeds);

  try {
    schema.validateSync(value);
    return null;
  } catch (err) {
    return err.message;
  }
};

const sendRequest = (link) => axios.get(addProxy(link).toString())
  .then(response => response.data.contents);

const updatePosts = (model, interval) => {
  const feeds = model.feeds.map((feed) => feed.id);
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

const app = (translator) => {
  const elements = {
    header: document.getElementById('header'),
    description: document.getElementById('description'),
    inputPlaceholder: document.getElementById('input-placeholder'),
    addButton: document.getElementById('add-button'),
    exampleElement: document.getElementById('example'),
    feedsTitle: document.getElementById('feeds-title'),
    feedsDescription: document.getElementById('feeds-description'),
    postsTitle: document.getElementById('posts-title'),
    postsDescription: document.getElementById('posts-description'),
    modalLink: document.querySelector('.modal-full-post-link'),
    modalClose: document.querySelector('.modal-close-btn'),
    feedsBox: document.querySelector('.feeds-list'),
    postsBox: document.querySelector('.posts-list'),
    input: document.querySelector('.rss-link'),
    form: document.querySelector('.rss-form'),
    submitBtn: document.querySelector('.submit-button'),
    modal: document.querySelector('.modal'),
  };
  const updateInterval = 5000;
  const state = {
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
      isOpen: false,
    },
    ui: {
      seenPosts: new Set(),
    },
  };
  const watched = initView(state, elements, translator);

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const value = formData.get('name');
    const error = validate(value, watched, translator);

    if (error) {
      watched.form.error = error;
      watched.form.status = 'failed';
      return;
    }

    watched.form.status = 'read-only';
    watched.loadingProcess.status = 'loading';

    sendRequest(value)
      .then((response) => {
        const { title, description, posts } = parse(response);
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
          watched.loadingProcess.error = translator('errors.noRss');
        } else {
          watched.loadingProcess.error = translator('errors.network');
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

const init = () => {
  const newInstance = i18next.createInstance();
  return newInstance.init({
    lng: 'ru',
    debug: false,
    resources,
  }, (err, t) => app(t));
};

export default init;
