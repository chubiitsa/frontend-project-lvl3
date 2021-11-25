import onChange from 'on-change';
import i18next from 'i18next';
import { Modal } from 'bootstrap';

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

const renderItem = (item, elements, state) => {
  const titleElement = document.createElement('a');
  titleElement.setAttribute('href', item.link);
  titleElement.setAttribute('target', '_blank');
  titleElement.textContent = item.title;
  titleElement.setAttribute('data-id', item.postId);
  const fontWeight = state.ui.seenPosts.has(item.postId) ? 'fw-normal' : 'fw-bold';
  titleElement.classList.add(fontWeight);
  const previewElement = document.createElement('button');
  previewElement.classList.add('btn', 'btn-primary', 'btn-sm');
  previewElement.textContent = i18next.t('buttons.preview');
  previewElement.setAttribute('data-id', item.postId);
  const postElement = document.createElement('li');
  postElement.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
  postElement.append(titleElement, previewElement);
  elements.postsBox.append(postElement);
};

const renderPosts = (state, elements) => {
  elements.postsBox.textContent = '';
  state.posts.forEach((item) => renderItem(item, elements, state));
};

const renderFeeds = (feeds, elements) => {
  elements.feedsBox.textContent = '';
  const feedNodes = feeds.map((feed) => {
    const feedItem = document.createElement('li');
    const title = document.createElement('h5');
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

const renderModal = (state, elements) => {
  const postData = state.posts.filter((post) => post.postId === state.modal.openedPost);
  const [{ title, description, link }] = postData;
  const modalTitle = elements.modal.querySelector('.modal-title');
  const modalDescription = elements.modal.querySelector('.modal-description');
  const linkButton = elements.modal.querySelector('.modal-full-post-link');
  modalTitle.textContent = title;
  modalDescription.textContent = description;
  linkButton.setAttribute('href', link);
  const modalElement = new Modal(elements.modal);
  modalElement.show();
};

const view = (state, elements) => {
  const mapping = {
    'form.status': () => renderForm(state, elements),
    'form.error': () => renderError(state.form.error, elements),
    'loadingProcess.status': () => renderProgressMessage(state, elements),
    'modal.openedPost': () => renderModal(state, elements),
    'ui.seenPosts': () => renderPosts(state, elements),
    feeds: () => renderFeeds(state.feeds, elements),
    posts: () => renderPosts(state, elements),
  };

  return onChange(state, (path) => {
    if (mapping[path]) {
      mapping[path]();
    }
  });
};

export default view;
