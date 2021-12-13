import onChange from 'on-change';

const renderError = (errorMessage, elements) => {
  elements.messageContainer.textContent = '';
  const errorEl = document.createElement('p');
  errorEl.classList.add('text-danger');
  errorEl.textContent = errorMessage;
  elements.messageContainer.append(errorEl);
  elements.input.classList.add('is-invalid', 'form-control');
  elements.input.select();
};

const renderProgressMessage = (state, elements, translator) => {
  elements.messageContainer.textContent = '';
  const messageEl = document.createElement('p');
  switch (state.loadingProcess.status) {
    case 'loading':
      messageEl.textContent = translator('messages.progress');
      messageEl.classList.add('text-info');
      elements.messageContainer.append(messageEl);
      break;
    case 'idle':
      messageEl.textContent = translator('messages.success');
      messageEl.classList.add('text-success');
      elements.messageContainer.append(messageEl);
      break;
    case 'failed':
      elements.input.readOnly = false;
      renderError(state.loadingProcess.error, elements);
      break;

    default:
      throw Error(`Unknown form status: ${state}`);
  }
};

const renderItem = (item, elements, state, translator) => {
  const titleElement = document.createElement('a');
  titleElement.href = item.link;
  titleElement.setAttribute('target', '_blank');
  titleElement.textContent = item.title;
  titleElement.setAttribute('data-id', item.postId);
  const fontWeight = state.ui.seenPosts.has(item.postId) ? 'fw-normal' : 'fw-bold';
  titleElement.classList.add(fontWeight);
  const previewButton = document.createElement('button');
  previewButton.classList.add('btn', 'btn-primary', 'btn-sm');
  previewButton.textContent = translator('buttons.preview');
  previewButton.dataset.id = item.postId;
  previewButton.dataset.bsToggle = 'modal';
  previewButton.dataset.bsTarget = '#modal';
  const postElement = document.createElement('li');
  postElement.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
  postElement.append(titleElement, previewButton);
  elements.postsBox.append(postElement);
};

const renderPosts = (state, elements, translator) => {
  elements.postsBox.textContent = '';
  state.posts.forEach((item) => renderItem(item, elements, state, translator));
};

const renderFeeds = (feeds, elements) => {
  elements.feedsBox.textContent = '';
  const feedNodes = feeds.map((feed) => {
    const feedItem = document.createElement('li');
    const title = document.createElement('h5');
    title.classList.add('feed-title');
    title.textContent = feed.title;
    const description = document.createElement('p');
    description.classList.add('feed-description');
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
      elements.input.classList.remove('is-invalid');
      elements.submitBtn.disabled = false;
      elements.input.readOnly = false;
      elements.input.value = '';
      break;

    case 'read-only':
      elements.input.classList.remove('is-invalid');
      elements.submitBtn.setAttribute('disabled', true);
      elements.input.readOnly = true;
      break;

    case 'failed':
      elements.input.classList.add('is-invalid');
      elements.submitBtn.disabled = false;
      elements.input.readOnly = false;
      elements.input.focus();
      renderError(state.form.error, elements);
      break;

    default:
      throw Error(`Unknown form status: ${state.form.status}`);
  }
};

const renderModal = (state, elements) => {
  const postData = state.posts.find((post) => post.postId === state.modal.openedPost);
  const { title, description, link } = postData;
  const modalTitle = elements.modal.querySelector('.modal-title');
  const modalDescription = elements.modal.querySelector('.modal-description');
  const linkButton = elements.modal.querySelector('.modal-full-post-link');
  modalTitle.textContent = title;
  modalDescription.textContent = description;
  linkButton.href = link;
};

const renderPage = (state, elements, translator) => {
  elements.header.textContent = translator('header');
  elements.description.textContent = translator('description');
  elements.input.placeholder = translator('placeholder');
  elements.addButton.textContent = translator('buttons.add');
  elements.exampleElement.textContent = translator('example');
  elements.feedsTitle.textContent = translator('feedsTitle');
  elements.feedsDescription.textContent = translator('feedsDescription');
  elements.postsTitle.textContent = translator('postsTitle');
  elements.postsDescription.textContent = translator('postsDescription');
  elements.modalLink.textContent = translator('modalLink');
  elements.modalClose.textContent = translator('buttons.modalCloseBtn');
};

const initView = (state, elements, translator) => {
  renderPage(state, elements, translator);

  const mapping = {
    'form.status': () => renderForm(state, elements, translator),
    'loadingProcess.status': () => renderProgressMessage(state, elements, translator),
    'modal.openedPost': () => renderModal(state, elements),
    'ui.seenPosts': () => renderPosts(state, elements, translator),
    feeds: () => renderFeeds(state.feeds, elements),
    posts: () => renderPosts(state, elements, translator),
  };

  return onChange(state, (path) => {
    if (mapping[path]) {
      mapping[path]();
    }
  });
};

export default initView;
