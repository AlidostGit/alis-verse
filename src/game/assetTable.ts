/**
 * Runtime model addresses. The GLB files live in public/models/ and are served as static files.
 */
export const MODEL_URLS = {
  retro: './models/retro_computers.glb',
  terminal: './models/data_terminal.glb',
  truck: './models/waste_truck.glb',
  laptop: './models/laptop.glb',
  bookshelf: './models/bookshelf.glb',
  gamepad: './models/gamepad.glb',
} as const
export type ModelKey = keyof typeof MODEL_URLS
