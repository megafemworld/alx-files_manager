import { MongoClient } from 'mongodb';

/**
 * Class representing a MongoDB client
 */
class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;

    this.client = new MongoClient(url, { useUnifiedTopology: true });

    this.client.connect((err) => {
      if (err) {
        console.error(`Error connecting to MongoDB: ${err.message}`);
      } else {
        console.log('Connected to MongoDB');
      }
    });

    this.db = this.client.db(database);
  }

  /**
     * Checks if connection to MongoDB is alive
     * @returns {boolean} - True if connected, false otherwise
     */
  isAlive() {
    return this.client.isConnected();
  }

  /**
     * Gets number of documents in users collection
     * @returns {Promise<number>} - Number of users
     */
  async nbUsers() {
    const usersCollection = this.db.collection('users');
    return usersCollection.countDocuments();
  }

  /**
     * Gets number of documents in files collection
     * @returns {Promise<number>} - Number of files
     */
  async nbFiles() {
    const filesCollection = this.db.collection('files');
    return filesCollection.countDocuments();
  }
}

// Create and export MongoDB client instance
const dbClient = new DBClient();
export default dbClient;
