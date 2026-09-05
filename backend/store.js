// Stand-in for a real database. Swap this for Postgres/Mongo/etc. before
// shipping to real users — and NEVER store access_tokens in plaintext in
// production; encrypt them at rest.
//
// Shape: { [userId]: { itemId, accessToken, institutionName }[] }

const items = {};

function addItem(userId, item) {
  if (!items[userId]) items[userId] = [];
  items[userId].push(item);
}

function getItems(userId) {
  return items[userId] || [];
}

function removeItem(userId, itemId) {
  if (!items[userId]) return;
  items[userId] = items[userId].filter((i) => i.itemId !== itemId);
}

module.exports = { addItem, getItems, removeItem };
