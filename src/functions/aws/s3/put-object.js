const s3Service = require("../../../services/s3.service");
const { success, failure } = require("../../../helpers/response.utils");

module.exports.main = (event, context, callback) => {
  console.log("BODY ===>>>", event.body)
  context.callbackWaitsForEmptyEventLoop = false;
  const { id } = event.pathParameters;
  s3Service
    .putObject(JSON.parse(event.body), id)
    .then(data => callback(null, success(data)))
    .catch(err => callback(null, failure(err)));
};
