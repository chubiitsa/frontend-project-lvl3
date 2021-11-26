import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import axios from 'axios';
import * as yup from 'yup';
import {setLocale} from 'yup';
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

const app = (translator) => {
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
  const watched = initView(model, elements, translator);

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
  const newInstance = i18next.createInstance()
  return newInstance.init({
    lng: 'ru',
    debug: false,
    resources,
  },(err, t) => {
    document.getElementById('header').textContent = t('header');
    document.getElementById('description').textContent = t('description');
    document.getElementById('input-placeholder').setAttribute('placeholder', t('input-placeholder'));
    document.getElementById('add-button').textContent = t('buttons.add');
    document.getElementById('example').textContent = t('example');
    document.getElementById('feeds-title').textContent = t('feeds-title');
    document.getElementById('feeds-description').textContent = t('feeds-description');
    document.getElementById('posts-title').textContent = t('posts-title');
    document.getElementById('posts-description').textContent = t('posts-description');
    document.querySelector('.modal-full-post-link').textContent = t('modal-full-post-link');
    document.querySelector('.modal-close-btn').textContent = t('buttons.modal-close-btn');
  }).then((t) => app(t));
}

export default init;
