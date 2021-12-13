import 'bootstrap';
import axios from 'axios';
import * as yup from 'yup';
import _ from 'lodash';
import { setLocale } from 'yup';
import i18next from 'i18next';
import initView from './view.js';
import parse from './rss.js';
import translation from './translation.js';

const updateInterval = 5000;

const addProxy = (url) => {
  const proxy = 'https://hexlet-allorigins.herokuapp.com/';
  const urlWithProxy = new URL('get', proxy);
  urlWithProxy.searchParams.append('disableCache', true);
  urlWithProxy.searchParams.append('url', url);
  return urlWithProxy.toString();
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

  const existedFeeds = model.feeds.map((feed) => feed.url);

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
  .then((response) => response.data.contents);

const updatePosts = (model, interval) => {
  const rssData = model.feeds
    .map((feed) => sendRequest(feed.url)
      .then(parse)
      .then(({ posts }) => {
        const newPosts = _.differenceBy(posts, model.posts, 'link');
        const newPostsWithId = newPosts.map((post) => {
          const postId = _.uniqueId('');
          return { postId, feedId: feed.url, ...post };
        });
        model.posts = [...newPostsWithId, ...model.posts];
      }));
  return Promise.all(rssData)
    .finally(() => setTimeout(() => updatePosts(model, interval), interval));
};

const loadRss = (url, rssData, state) => {
  const { title, description, posts } = rssData;
  state.feeds = [{ url, title, description }, ...state.feeds];
  const postsWithId = posts.map((post) => {
    const postId = _.uniqueId('');
    return { postId, feedId: url, ...post };
  });
  state.posts = [...postsWithId, ...state.posts];
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
    messageContainer: document.querySelector('.message'),
  };
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
    },
    ui: {
      seenPosts: new Set(),
    },
  };
  const watched = initView(state, elements, translator);

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const value = formData.get('url');
    const error = validate(value, watched, translator);

    if (error) {
      watched.form.error = error;
      watched.form.status = 'failed';
      return;
    }

    watched.form.error = null;
    watched.form.status = 'read-only';
    watched.loadingProcess.status = 'loading';

    sendRequest(value)
      .then(parse)
      .then((data) => {
        loadRss(value, data, watched);
        watched.loadingProcess.error = null;
        watched.form.status = 'filling';
        watched.loadingProcess.status = 'idle';
      })
      .catch((err) => {
        if (err.isParsingError) {
          watched.loadingProcess.error = translator('errors.noRss');
        } else {
          watched.loadingProcess.error = translator('errors.network');
        }
        watched.form.status = 'filling';
        watched.loadingProcess.status = 'failed';
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

  setTimeout(() => updatePosts(watched, updateInterval), updateInterval);
};

const init = () => {
  const newInstance = i18next.createInstance();
  return newInstance.init({
    lng: 'ru',
    debug: false,
    resources: translation(),
  }, (err, t) => app(t));
};

export default init;
