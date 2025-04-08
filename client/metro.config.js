/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add custom configuration
config.watchFolders = [path.resolve(__dirname)];

// Exclude all node_modules from watches except for critical ones
config.resolver.blockList = [
  /node_modules\/(?!react|@react|react-native|@react-native|expo|@expo).*/,
];

// Add additional options
config.maxWorkers = 2; // Reduce CPU usage
config.resetCache = false; // Set to true only when needed

module.exports = config; 