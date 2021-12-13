export default (rssString) => {
  const parser = new window.DOMParser();
  const doc = parser.parseFromString(rssString, 'application/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    const error = new Error(parseError.textContent);
    error.isParsingError = true;
    throw error;
  }
  const feedTitle = doc.querySelector('title').textContent;
  const description = doc.querySelector('description').textContent;
  const rssPosts = doc.querySelectorAll('item');
  const posts = [];
  rssPosts.forEach((node) => {
    const title = node.querySelector('title').textContent;
    const link = node.querySelector('link').textContent;
    const postDescription = node.querySelector('description').textContent;
    posts.push({
      title, link, description: postDescription,
    });
  });
  return { title: feedTitle, description, posts };
};
