const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { emailQueue, fileQueue, notificationQueue } = require('./config');

// Create Express adapter for Bull Board
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

// Create Bull Board
const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(fileQueue),
    new BullMQAdapter(notificationQueue),
  ],
  serverAdapter: serverAdapter,
});

module.exports = {
  bullBoardRouter: serverAdapter.getRouter(),
  addQueue,
  removeQueue,
  setQueues,
  replaceQueues,
};
