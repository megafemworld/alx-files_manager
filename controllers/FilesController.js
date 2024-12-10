import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class FilesController {
  static async postUpload(req, res) {
    try {
      // Get token and validate user
      const token = req.header('X-Token');
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      const key = `auth_${token}`;
      const userId = await redisClient.get(key);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      // Find user in database
      const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      // Validate request body
      const {
        name, type, parentId = 0, isPublic = false, data,
      } = req.body;

      if (!name) return res.status(400).json({ error: 'Missing name' });

      const validTypes = ['folder', 'file', 'image'];
      if (!type || !validTypes.includes(type)) {
        return res.status(400).json({ error: 'Missing type' });
      }

      if (!data && type !== 'folder') {
        return res.status(400).json({ error: 'Missing data' });
      }

      // Validate parentId if provided
      if (parentId !== 0) {
        const parent = await dbClient.db.collection('files')
          .findOne({ _id: ObjectId(parentId) });

        if (!parent) {
          return res.status(400).json({ error: 'Parent not found' });
        }

        if (parent.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      // Prepare file document
      const fileDocument = {
        userId: ObjectId(userId),
        name,
        type,
        isPublic,
        parentId: parentId === 0 ? '0' : ObjectId(parentId),
      };

      // Handle folder creation
      if (type === 'folder') {
        const result = await dbClient.db.collection('files').insertOne(fileDocument);
        return res.status(201).json({
          id: result.insertedId,
          userId: fileDocument.userId,
          name: fileDocument.name,
          type: fileDocument.type,
          isPublic: fileDocument.isPublic,
          parentId: fileDocument.parentId,
        });
      }

      // Handle file/image creation
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';

      // Create storage folder if it doesn't exist
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Generate unique filename and save file
      const filename = uuidv4();
      const localPath = path.join(folderPath, filename);

      // Save file content
      const fileContent = Buffer.from(data, 'base64');
      fs.writeFileSync(localPath, fileContent);

      // Add localPath to document and save to DB
      fileDocument.localPath = localPath;
      const result = await dbClient.db.collection('files').insertOne(fileDocument);

      // Return response without localPath
      return res.status(201).json({
        id: result.insertedId,
        userId: fileDocument.userId,
        name: fileDocument.name,
        type: fileDocument.type,
        isPublic: fileDocument.isPublic,
        parentId: fileDocument.parentId,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default FilesController;
