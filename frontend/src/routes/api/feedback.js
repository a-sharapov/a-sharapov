export const post = (request) => {
  const success = false
  const responseMessages = {
    success: 'Сообщение успешно отправлено! Спасибо.',
    error: 'Ошибка отправки сообщения! Попробуйте связаться по данным в CV.',
  }
  //console.log(request.body);

 if (success) {
    return {
      status: 200,
      body: {
        message: responseMessages.success,
      },
    }
  } else {
    return {
      status: 503,
      body: {
        message: responseMessages.error,
      },
    }
  }
  
}