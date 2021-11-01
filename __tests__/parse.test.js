import reverse from '../src/fortest.js';

console.log("!!")
test('reverse', () => {
  expect(reverse('hello')).toEqual('olleh');
  expect(reverse('')).toEqual('');
});