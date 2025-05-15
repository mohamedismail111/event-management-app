// Importing required modules 
const NodeCache = require("node-cache");
const nodeCache = new NodeCache({ stdTTL: 0 });

// Cache utility functions
const getCachedData = (key) => {
    const cachedData = nodeCache.get(key);
    // console.log(`Cache GET for key: ${key} - ${cachedData ? 'HIT' : 'MISS'}`);
    if (cachedData === undefined) {
        return null; 
    }
    return cachedData;
};

const setCachedData = (key, data) => {
    nodeCache.set(key, data);
    console.log(`Cache SET for key: ${key}`);
};

const deleteCachedData = (key) => {
    console.log("Deleting key:", key);
    nodeCache.del(key);
};

const hasCachedData = (key) => {
    console.log("key ==>", key);
    return nodeCache.has(key);
};

const clearAllCache = async () => {
    if (nodeCache && nodeCache.keys) {
        const keys = nodeCache.keys();
        for (const key of keys) {
            console.log("Deleting key:", key);
            nodeCache.del(key);
        }
    } else {
        console.error("Cache is not initialized or empty.");
    }
};

module.exports = {
    getCachedData,
    setCachedData,
    deleteCachedData,
    hasCachedData,
    clearAllCache
};
