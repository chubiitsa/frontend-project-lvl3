import _ from "lodash";

const parser = new window.DOMParser();

const parseRSS = (rssString) => parser.parseFromString(rssString, 'application/xml');

const getFeedData = (rssData) => {
  const title = rssData.querySelector('title').textContent;
  const description = rssData.querySelector('description').textContent;
  return {
    title, description,
  };
};

const getPostsData = (rssData, feedId) => {
  const rssPosts = rssData.querySelectorAll('item');
  const posts = [];
  rssPosts.forEach((node) => {
    const title = node.querySelector('title').textContent;
    const link = node.querySelector('link').textContent;
    const postId = _.uniqueId('post_');
    posts.push({
      title, link, postId, feedId,
    });
  });
  return posts;
};

export { getFeedData, getPostsData, parseRSS };