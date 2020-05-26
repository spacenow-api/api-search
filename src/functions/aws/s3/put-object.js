const s3Service = require("../../../services/s3.service");
const { success, failure } = require("../../../helpers/response.utils");

module.exports.main = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  s3Service
    .putObject(JSON.parse(event.body))
    .then(data => callback(null, success(data)))
    .catch(err => callback(null, failure(err)));
};
