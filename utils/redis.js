import redis from 'redis';
import { promisify } from 'util';

/**
 * Class representing a Redis client
 */
class RedisClient {
    constructor() {
        // Create Redis client
        this.client = redis.createClient();
        
        // Handle errors
        this.client.on('error', (error) => {
            console.error(`Redis client error: ${error}`);
        });

        // Promisify Redis methods we'll need
        this.getAsync = promisify(this.client.get).bind(this.client);
        this.setAsync = promisify(this.client.set).bind(this.client);
        this.delAsync = promisify(this.client.del).bind(this.client);
        this.expireAsync = promisify(this.client.expire).bind(this.client);
    }

    /**
     * Checks if connection to Redis is alive
     * @returns {boolean} - True if connected, false otherwise
     */
    isAlive() {
        return this.client.connected;
    }

    /**
     * Gets value from Redis for given key
     * @param {string} key - Key to get value for
     * @returns {Promise<string|null>} - Value from Redis
     */
    async get(key) {
        try {
            return await this.getAsync(key);
        } catch (error) {
            console.error(`Error getting key ${key}: ${error}`);
            return null;
        }
    }

    /**
     * Sets key/value pair in Redis with optional expiration
     * @param {string} key - Key to set
     * @param {*} value - Value to set
     * @param {number} duration - Expiration time in seconds
     * @returns {Promise<void>}
     */
    async set(key, value, duration) {
        try {
            await this.setAsync(key, value);
            if (duration) {
                await this.expireAsync(key, duration);
            }
        } catch (error) {
            console.error(`Error setting key ${key}: ${error}`);
        }
    }

    /**
     * Deletes key from Redis
     * @param {string} key - Key to delete
     * @returns {Promise<void>}
     */
    async del(key) {
        try {
            await this.delAsync(key);
        } catch (error) {
            console.error(`Error deleting key ${key}: ${error}`);
        }
    }
}

// Create and export Redis client instance
const redisClient = new RedisClient();
export default redisClient;