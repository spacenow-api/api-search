"use strict";

const { Op } = require("sequelize");
const crypto = require("crypto");

const { getInstance: mysqlInstance } = require("./../helpers/mysql.server");
const { getInstance: redisInstance } = require("./../helpers/redis.server");
const { filterOnlyFree } = require("./availability.service");

const { Listing, ListingData, ListSettingsParent, ListSettings, ListingPhotos, User, UserProfile, SubcategorySpecifications, SubcategoryBookingPeriod, Location } = require("./../models");

const sequelize = mysqlInstance();
const redis = redisInstance();

const RADIUS_DEFAULT = 50;
const MINIMUM_RESULT_SIZE = 10;
const PAGINATION_LIMIT_DEFAULT = 12;
const PERIODS = ["monthly", "weekly", "daily", "hourly"];

/**
 * Based on https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
 * @param {Array of Integer} elements
 */
function shuffle(elements) {
  let m = elements.length,
    t,
    i;
  while (m) {
    i = Math.floor(Math.random() * m--);
    t = elements[m];
    elements[m] = elements[i];
    elements[i] = t;
  }
  return elements;
}

function getRedisKey(value) {
  return crypto
    .createHash("sha256")
    .update(value, "utf8")
    .digest("hex");
}

async function cacheStore(latlng, salt, listings) {
  const hashKey = getRedisKey(`${latlng}-${salt}`);
  await redis.set(hashKey, JSON.stringify(listings), "EX", 86400); // to expire key after 24 hours
  return hashKey;
}

function getLatLngObj(latlng) {
  const latAndLng = latlng && latlng.split(",");
  if (!latlng || !latAndLng || latAndLng.length <= 0) throw new Error("Latitude or longitude are missing to call Google Maps API.");
  return {
    lat: latAndLng[0],
    lng: latAndLng[1]
  };
}

async function getCloseLocations(latlng, byRadius) {
  const latlngObj = getLatLngObj(latlng);
  const queryResults = await sequelize.query(`
    SELECT 
      id, country, address1, buildingName, city, state, zipcode, lat, lng 
    FROM Location 
    WHERE (1=1) 
      AND ACOS(SIN(RADIANS(lat)) * SIN(RADIANS(${latlngObj.lat})) + COS(RADIANS(lat)) * COS(RADIANS(${latlngObj.lat})) * COS(RADIANS(lng) - RADIANS(${latlngObj.lng}))) * 6380 ${byRadius}
    ORDER BY ACOS(SIN(RADIANS(lat)) * SIN(RADIANS(${latlngObj.lat})) + COS(RADIANS(lat)) * COS(RADIANS(${latlngObj.lat})) * COS(RADIANS(lng) - RADIANS(${latlngObj.lng}))) * 6380
  `);
  let locations = [];
  let locationIds = [];
  if (queryResults) {
    locations = queryResults[0];
    locationIds = locations.map(o => o.id);
  }
  return { locations, locationIds };
}

async function getListingsByLocations(locationIds, limit = 0) {
  const whereCondition = {
    raw: true,
    attributes: ["id", "title", "userId", "locationId", "bookingPeriod", "listSettingsParentId"],
    where: {
      locationId: { [Op.in]: locationIds },
      isReady: true,
      isPublished: true,
      status: "active"
    },
    order: sequelize.literal(`FIELD(locationId, ${locationIds.join(",")})`)
  };
  if (limit > 0) {
    whereCondition.limit = limit;
  }
  return Listing.findAll(whereCondition);
}

async function getListingsByLocationsCategory(locationIds, categoryId, limit = 0) {
  const whereCondition = {
    raw: true,
    attributes: ["id", "title", "userId", "locationId", "bookingPeriod", "listSettingsParentId"],
    where: {
      locationId: { [Op.in]: locationIds },
      listSettingsParentId: categoryId,
      isReady: true,
      isPublished: true,
      status: "active"
    },
    order: sequelize.literal(`FIELD(locationId, ${locationIds.join(",")})`)
  };
  if (limit > 0) {
    whereCondition.limit = limit;
  }
  return Listing.findAll(whereCondition);
}

async function searchListingIds(latlng, filters) {
  const instantSearchKey = getRedisKey("_search_" + latlng + JSON.stringify(filters));
  const freshResult = await redis.get(instantSearchKey);
  if (freshResult && freshResult.length > MINIMUM_RESULT_SIZE) {
    return JSON.parse(freshResult);
  }
  let byRadius = (filters && filters.radius) || RADIUS_DEFAULT;
  byRadius = byRadius <= 0 ? `` : `< ${byRadius}`;
  const { locations, locationIds } = await getCloseLocations(latlng, byRadius);
  const listings = await getListingsByLocations(locationIds, filters.limit);
  const listingsResult = await fillListings(listings, locations);
  const searchKey = await cacheStore(latlng, Date.now(), listingsResult);
  const queryResult = await searchQuery(searchKey, filters);
  await redis.set(instantSearchKey, JSON.stringify(queryResult), "EX", 21600); // to expire key after 6 hours
  return queryResult;
}

async function fillListings(listings, locations) {
  const TYPE_ID = "117";
  try {
    const searchResults = [];
    await Promise.all(
      listings.map(async listingObj => {
        // Getting listing data...
        const listingData = await ListingData.findOne({
          attributes: [
            "id",
            "basePrice",
            "currency",
            "minTerm",
            "capacity",
            "size",
            "meetingRooms",
            "isFurnished",
            "carSpace",
            "sizeOfVehicle",
            "maxEntranceHeight",
            "spaceType",
            "bookingType",
            "accessType"
          ],
          where: { listingId: listingObj.id }
        });

        // Specifications...
        const specificationsData = await SubcategorySpecifications.findAll({
          attributes: ["listSettingsSpecificationId"],
          where: { listSettingsParentId: listingObj.listSettingsParentId }
        });
        const specificationsArray = [];
        for (const item of specificationsData) {
          const settingsObj = await ListSettings.findOne({
            attributes: ["id", "typeId", "itemName", "otherItemName", "specData"],
            where: { id: item.listSettingsSpecificationId, isEnable: "1", typeId: TYPE_ID }
          });
          settingsObj && specificationsArray.push(settingsObj);
        }

        // Getting location data...
        const locationData = locations.find(o => o.id == listingObj.locationId);

        // Getting category & sub-category...
        const parentObj = await ListSettingsParent.findOne({
          attributes: ["listSettingsParentId", "listSettingsChildId"],
          where: { id: listingObj.listSettingsParentId }
        });
        const categoryObj = await ListSettings.findOne({
          attributes: ["id", "typeId", "itemName", "otherItemName"],
          where: { id: parentObj.listSettingsParentId }
        });
        const subCategoryObj = await ListSettings.findOne({
          attributes: ["id", "typeId", "itemName", "otherItemName"],
          where: { id: parentObj.listSettingsChildId }
        });

        // Getting photos...
        const photosArray = await ListingPhotos.findAll({
          attributes: ["id", "name", "isCover", "type"],
          where: { type: { [Op.like]: "image/%" }, listingId: listingObj.id }
        });

        // Getting user host details...
        const hostUser = await User.findOne({
          raw: true,
          attributes: ["id", "email"],
          where: { id: listingObj.userId }
        });
        const hostProfile = await UserProfile.findOne({
          attributes: ["profileId", "firstName", "lastName", "displayName", "picture"],
          where: { userId: listingObj.userId }
        });

        searchResults.push({
          ...listingObj,
          listingData: listingData,
          specifications: specificationsArray,
          location: locationData,
          category: categoryObj,
          subcategory: subCategoryObj,
          photos: photosArray,
          host: {
            ...hostUser,
            profile: hostProfile
          }
        });
      })
    );
    return searchResults;
  } catch (err) {
    throw new Error(err);
  }
}

function getPaginator(content, toPage, byLimit) {
  const items = content || [];
  const page = toPage || 1;
  const limit = byLimit || PAGINATION_LIMIT_DEFAULT;
  const offset = (page - 1) * limit;
  const paginatedItems = items.slice(offset).slice(0, limit);
  const totalPages = Math.ceil(items.length / limit);
  return {
    page: page,
    perPage: limit,
    prePage: page - 1 ? page - 1 : null,
    nextPage: totalPages > page ? page + 1 : null,
    total: items.length,
    totalPages: totalPages,
    result: paginatedItems
  };
}

async function searchQuery(searchKey, filters) {
  const listingData = await redis.get(searchKey);
  if (!listingData) return { status: "EMPTY" };
  let filteredResult = JSON.parse(listingData);
  let frequencies = PERIODS;
  if (filters) {
    // Check categories...
    if (filters.categories) {
      const categoryIds = filters.categories.split(",").map(o => parseInt(o, 10));
      if (categoryIds.length > 0) {
        filteredResult = filteredResult.filter(o => categoryIds.includes(o.category.id));
        // Removing frequency options based on Category...
        const parentArray = await ListSettingsParent.findAll({
          raw: true,
          attributes: ["id"],
          where: { listSettingsParentId: { [Op.in]: categoryIds } }
        });
        const parentIds = parentArray.map(o => o.id);
        const subBookingsPeriod = await SubcategoryBookingPeriod.findAll({
          where: { listSettingsParentId: { [Op.in]: parentIds } }
        });
        frequencies = subBookingsPeriod.map(i => PERIODS.filter(p => i[p] == 1));
        frequencies = frequencies.reduce((a, b) => {
          return a.concat(b);
        }, []);
        frequencies = frequencies.filter((value, index, self) => self.indexOf(value) === index);
        filteredResult = filteredResult.filter(o => frequencies.includes(o.bookingPeriod));
      }
    }
    // Check duration...
    if (filters.duration) {
      const durationTypes = filters.duration.split(",");
      if (durationTypes.length > 0) {
        filteredResult = filteredResult.filter(o => durationTypes.includes(o.bookingPeriod));
      }
    }
    // Check minimum price...
    if (filters.priceMin && filters.priceMin > 0) {
      filteredResult = filteredResult.filter(o => o.listingData.basePrice >= filters.priceMin);
    }
    // Check maximun price...
    if (filters.priceMax && filters.priceMax > 0) {
      filteredResult = filteredResult.filter(o => o.listingData.basePrice <= filters.priceMax);
    }
    // Check minimum capacity...
    if (filters.capacityMin && filters.capacityMin > 0) {
      filteredResult = filteredResult.filter(o => o.listingData.capacity >= filters.capacityMin);
    }
    // Check maximun capacity...
    if (filters.capacityMax && filters.capacityMax > 0) {
      filteredResult = filteredResult.filter(o => o.listingData.capacity <= filters.capacityMax);
    }
    // Check instant booking...
    if (filters.instant) {
      const boolValue = /true/i.test(filters.instant);
      filteredResult = filteredResult.filter(o => (o.listingData.bookingType === "instant") === boolValue);
    }
    // Check availability...
    if (filters.availability && filters.availability.length > 0) {
      filteredResult = await filterOnlyFree(filteredResult, filters.availability);
    }
  }
  // Temporary cleaning for few specific data...
  filteredResult = _cleaning(filteredResult);
  const dataPaginated = getPaginator(filteredResult, filters.page, filters.limit);
  return { status: "OK", searchKey, frequencies, ...dataPaginated };
}

/**
 * Temporary.
 * @todo Remove.
 */
function _cleaning(searchResults) {
  let cleanedResults = JSON.parse(JSON.stringify(searchResults));
  try {
    // Removing Creative Spaces...
    cleanedResults = cleanedResults.filter(o => o.subcategory.otherItemName !== "creative");
  } catch (_) {}
  return cleanedResults;
}

async function searchSimilar(listingId) {
  // const similarCacheKey = getRedisKey(`_similar_listing_${listingId}`);
  // const cacheContent = await redis.get(similarCacheKey);
  // if (cacheContent) {
  // return JSON.parse(cacheContent);
  // }
  const listingObj = await Listing.findOne({
    attributes: ["locationId", "listSettingsParentId"],
    where: { id: listingId }
  });
  const locationObj = await Location.findOne({
    where: { id: listingObj.locationId }
  });
  const latlng = `${locationObj.lat},${locationObj.lng}`;
  const { locations, locationIds } = await getCloseLocations(latlng, `< 50`);
  // Shuffling locations to show different results for each load time...
  const listings = await getListingsByLocationsCategory(shuffle(locationIds), listingObj.listSettingsParentId, 3);
  const listingsResult = await fillListings(listings, locations);
  // await redis.set(similarCacheKey, JSON.stringify({ result: listingsResult }), "EX", 21600);
  return { result: listingsResult };
}

module.exports = { searchListingIds, searchQuery, searchSimilar };
