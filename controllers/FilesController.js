import { ObjectID } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class FilesController {
  static async postUpload(req, res) {
    try {
      // Get token and verify user
      const token = req.header('X-Token');
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const key = `auth_${token}`;
      const userId = await redisClient.get(key);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if user exists
      const user = await dbClient.db.collection('users').findOne({ _id: ObjectID(userId) });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validate request body
      const {
        name, type, parentId = 0, isPublic = false, data,
      } = req.body;

      // Validate name
      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }

      // Validate type
      const validTypes = ['folder', 'file', 'image'];
      if (!type || !validTypes.includes(type)) {
        return res.status(400).json({ error: 'Missing type' });
      }

      // Validate data for non-folder types
      if (!data && type !== 'folder') {
        return res.status(400).json({ error: 'Missing data' });
      }

      // Check parentId if provided
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
      const fileDoc = {
        userId: ObjectID(userId),
        name,
        type,
        isPublic,
        parentId: parentId === 0 ? '0' : ObjectID(parentId),
      };

      // If type is folder, save and return
      if (type === 'folder') {
        const result = await dbClient.db.collection('files').insertOne(fileDoc);
        const file = {
          id: result.insertedId,
          userId: fileDoc.userId,
          name: fileDoc.name,
          type: fileDoc.type,
          isPublic: fileDoc.isPublic,
          parentId: fileDoc.parentId,
        };
        return res.status(201).json(file);
      }

      // Handle file storage
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Save file to disk
      const filename = uuidv4();
      const localPath = path.join(folderPath, filename);
      const fileContent = Buffer.from(data, 'base64');
      await fs.promises.writeFile(localPath, fileContent);

      // Add localPath to document
      fileDoc.localPath = localPath;

      // Save to database
      const result = await dbClient.db.collection('files').insertOne(fileDoc);

      // Prepare response
      const file = {
        id: result.insertedId,
        userId: fileDoc.userId,
        name: fileDoc.name,
        type: fileDoc.type,
        isPublic: fileDoc.isPublic,
        parentId: fileDoc.parentId,
      };

      return res.status(201).json(file);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default FilesController;
