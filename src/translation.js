export default () => ({
  en: {
    translation: {
      header: 'RSS reader',
      description: 'All that you want in one place',
      placeholder: 'Put URL here',
      example: 'Example: https://ru.hexlet.io/lessons.rss',
      feedsTitle: 'Feeds',
      feedsDescription: 'List of feeds',
      postsTitle: 'Posts',
      postsDescription: 'List of related posts',
      modalLink: 'Read full story',
      buttons: {
        add: 'Add',
        preview: 'Quick view',
        modalCloseBtn: 'Close',
      },
      errors: {
        noRss: 'There is no RSS-feed at this URL',
        existedRss: 'This feed is already here (please find it below)',
        required: 'Please fill in this field',
        invalidUrl: 'The value is not URL',
        network: 'Network error. Try again later',
      },
      messages: {
        success: 'Feed was successfully added',
        progress: 'Loading ...',
      },
    },
  },
  ru: {
    translation: {
      header: 'RSS агрегатор',
      description: 'Всё интересное в одном месте',
      placeholder: 'ссылка RSS',
      example: 'Пример: https://ru.hexlet.io/lessons.rss',
      feedsTitle: 'Фиды',
      feedsDescription: 'Здесь появится список ваших потоков',
      postsTitle: 'Посты',
      postsDescription: 'Здесь появятся свежие новости с добавленных потоков',
      modalLink: 'Читать полностью',
      buttons: {
        add: 'Добавить',
        preview: 'Просмотр',
        modalCloseBtn: 'Закрыть',
      },
      errors: {
        noRss: 'Ресурс не содержит валидный RSS',
        existedRss: 'RSS уже существует',
        required: 'Не должно быть пустым',
        invalidUrl: 'Ссылка должна быть валидным URL',
        network: 'Ошибка сети',
      },
      messages: {
        success: 'RSS успешно загружен',
        progress: 'Идет загрузка ...',
      },
    },
  },
});
