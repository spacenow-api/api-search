"use strict";

const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const axios = require("axios")

const { ListingPhotos } = require('./../models')

const putObject = async ({ body, bucket, key, listingId }) => {

  const headers = {
    responseType: 'arraybuffer'
  }
  const keyS = key || new Date().valueOf().toString()
  const resp = await axios.get(body, headers)
  const buffer = await Buffer.from(resp.data, 'base64');

  var params = {
    //Body: new Buffer(body.replace(/^data:image\/\w+;base64,/, ""), "base64"),
    Body: new Buffer(buffer),
    Bucket: `${bucket || process.env.S3_BUCKET}/space-images/${listingId}`,
    Key: `${keyS}.jpg`,
    ContentEncoding: "base64",
    ContentType: "image/webp",
  };

  return new Promise((resolve, reject) => {
    s3.putObject(params, async (error, resp) => {
      if (error) reject(error);
      const lPhoto = await ListingPhotos.create({
        listingId,
        name: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/space-images/${listingId}/${keyS.replace(/ /g, "+")}.jpg`
      })
      resolve(lPhoto);
    });
  });

  // await ListingPhotos.create({})
};

module.exports = {
  putObject
};
