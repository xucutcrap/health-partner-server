
const feedbackModel = require('./model')

/**
 * 提交反馈
 * @param {Object} data
 * @param {string} data.content
 * @param {string} data.contact
 * @param {number} data.userId (optional)
 */
async function submitFeedback(data) {
  return await feedbackModel.createFeedback(data)
}

module.exports = {
  submitFeedback
}
