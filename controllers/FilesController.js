import { ObjectID } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class FilesController {
  static async postUpload(req, res) {
    try {
      // Get user token
      const token = req.header('X-Token');
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get user based on token
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check user exists
      const user = await dbClient.db.collection('users').findOne({ _id: ObjectID(userId) });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get file info from request
      const { name, type, data } = req.body;
      let { parentId, isPublic } = req.body;

      // Set defaults
      if (parentId === undefined) parentId = 0;
      if (isPublic === undefined) isPublic = false;

      // Validate required fields
      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }

      const validTypes = ['folder', 'file', 'image'];
      if (!type || !validTypes.includes(type)) {
        return res.status(400).json({ error: 'Missing type' });
      }

      if (!data && type !== 'folder') {
        return res.status(400).json({ error: 'Missing data' });
      }

      // Check parent folder if specified
      if (parentId !== 0) {
        const parent = await dbClient.db.collection('files').findOne({ _id: ObjectID(parentId) });
        if (!parent) {
          return res.status(400).json({ error: 'Parent not found' });
        }
        if (parent.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      // Create file document
      const newFile = {
        userId: ObjectID(userId),
        name,
        type,
        isPublic,
        parentId: parentId === 0 ? '0' : ObjectID(parentId)
      };

      // Handle folder creation
      if (type === 'folder') {
        const result = await dbClient.db.collection('files').insertOne(newFile);
        return res.status(201).json({
          id: result.insertedId,
          userId: newFile.userId,
          name: newFile.name,
          type: newFile.type,
          isPublic: newFile.isPublic,
          parentId: newFile.parentId
        });
      }

      // Handle file/image creation
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      
      // Create storage folder if it doesn't exist
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Generate unique filename
      const filename = uuidv4();
      const localPath = path.join(folderPath, filename);

      // Write file to disk
      const fileContent = Buffer.from(data, 'base64');
      await fs.promises.writeFile(localPath, fileContent);

      // Save file document with local path
      newFile.localPath = localPath;
      const result = await dbClient.db.collection('files').insertOne(newFile);

      // Return response
      return res.status(201).json({
        id: result.insertedId,
        userId: newFile.userId,
        name: newFile.name,
        type: newFile.type,
        isPublic: newFile.isPublic,
        parentId: newFile.parentId
      });

    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default FilesController;
