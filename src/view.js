import onChange from 'on-change';
import i18next from 'i18next';

const renderError = (errorMessage, elements) => {
  const previousMessage = elements.form.nextSibling;
  if (previousMessage) {
    previousMessage.remove();
  }
  const errorContainer = document.createElement('div');
  errorContainer.classList.add('text-danger');
  errorContainer.textContent = errorMessage;
  elements.form.after(errorContainer);
  elements.input.classList.add('is-invalid', 'form-control');
  elements.input.select();
};

const renderProgressMessage = (state, elements) => {
  const previousMessage = elements.form.nextSibling;
  if (previousMessage) {
    previousMessage.remove();
  }
  const messageContainer = document.createElement('div');
  switch (state.loadingProcess.status) {
    case 'loading':
      messageContainer.textContent = i18next.t('messages.progress');
      messageContainer.classList.add('text-info');
      elements.form.after(messageContainer);
      break;
    case 'idle':
      messageContainer.textContent = i18next.t('messages.success');
      messageContainer.classList.add('text-success');
      elements.form.after(messageContainer);
      break;
    case 'failed':
      renderError(state.loadingProcess.error, elements);
      break;

    default:
      throw Error(`Unknown form status: ${state}`);
  }
};

const renderItem = (item, elements) => {
  const titleElement = document.createElement('p');
  titleElement.textContent = item.title;
  const previewElement = document.createElement('a');
  previewElement.classList.add('btn', 'btn-primary', 'btn-sm');
  previewElement.textContent = i18next.t('buttons.preview');
  previewElement.setAttribute('href', item.link);
  const postElement = document.createElement('li');
  postElement.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
  postElement.append(titleElement, previewElement);
  elements.postsBox.append(postElement);
};

const renderPosts = (posts, elements) => posts.forEach((item) => renderItem(item, elements));

const renderFeeds = (feeds, elements) => {
  elements.feedsBox.textContent = '';
  const feedNodes = feeds.map((feed) => {
    const feedItem = document.createElement('li');
    const title = document.createElement('h3');
    title.textContent = feed.title;
    const description = document.createElement('p');
    description.textContent = feed.description;
    feedItem.classList.add('list-group-item', 'text-body');
    feedItem.append(title, description);
    return feedItem;
  });
  elements.feedsBox.append(...feedNodes);
};

const renderForm = (state, elements) => {
  switch (state.form.status) {
    case 'filling':
      elements.submitBtn.removeAttribute('disabled');
      elements.input.removeAttribute('disabled');
      elements.input.classList.remove('is-invalid');
      elements.input.value = '';
      break;

    case 'read-only':
      elements.submitBtn.setAttribute('disabled', true);
      elements.input.classList.remove('is-invalid');
      elements.input.setAttribute('disabled', true);
      break;

    case 'failed':
      elements.input.classList.add('is-invalid');
      elements.submitBtn.removeAttribute('disabled');
      elements.input.removeAttribute('disabled');
      elements.input.focus();
      break;

    default:
      throw Error(`Unknown form status: ${state.form.status}`);
  }
};

const view = (state, elements) => {
  const mapping = {
    'form.status': () => renderForm(state, elements),
    'form.error': () => renderError(state.form.error, elements),
    'loadingProcess.status': () => renderProgressMessage(state, elements),
    feeds: () => renderFeeds(state.feeds, elements),
    posts: () => renderPosts(state.posts, elements),
  };

  return onChange(state, (path) => {
    if (mapping[path]) {
      mapping[path]();
    }
  });
};

export default view;
