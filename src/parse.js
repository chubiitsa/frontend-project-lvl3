import _ from 'lodash';

const parser = new window.DOMParser();

const getFeedData = (rssString) => {
  const doc = parser.parseFromString(rssString, 'application/xml');
  const err = doc.querySelector('parsererror');
  if (err) {
    throw new Error('parsingError');
  } else {
    return doc;
  }
};

const parse = (rssData) => {
  const feedData = getFeedData(rssData);
  const feedTitle = feedData.querySelector('title').textContent;
  const description = feedData.querySelector('description').textContent;
  const rssPosts = feedData.querySelectorAll('item');
  const posts = [];
  rssPosts.forEach((node) => {
    const title = node.querySelector('title').textContent;
    const link = node.querySelector('link').textContent;
    const postId = _.uniqueId('');
    posts.push({
      title, link, postId,
    });
  });
  return { title: feedTitle, description, posts };
};

export default parse;
