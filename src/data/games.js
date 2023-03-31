import { get, post } from './api.js';
import { addOwner } from './pointers.js';

const endpoints = {
  catalog: '/classes/Game',
  byId: '/classes/Game/',
};

export async function getGames() {
  return (await get(endpoints.catalog)).results;
}

export async function createGame(game) {
  addOwner(game);
  return await post(endpoints.catalog, game);
}
