# 0x04. Files manager

A simple file management platform built with Node.js that allows users to upload, view and manage files. The platform includes user authentication, file permissions, and image thumbnail generation.


## Project Overview

This project implements a robust Files Manager API with the following core features:

- User authentication 
- File upload and management
- Permission controls
- Image thumbnail processing
- Redis caching
- MongoDB storage


## Technologies Used

- Node.js
- Express.js
- MongoDB
- Redis 
- Bull (for job queues)
- JWT Authentication


## Core Features

### User Management
- User registration with welcome email
- Authentication via token
- User profile management


### File Operations  
- Upload files/create folders
- List files
- Get file by ID
- File publication control
- Image thumbnail generation
- File permissions


### Additional Features
- MongoDB integration
- Redis caching
- Background job processing
- API pagination
- Documentation


## Getting Started

### Prerequisites

- Node.js >= v12.x.x
- MongoDB
- Redis


### Installation

1. Clone the repository
```bash
git clone https://github.com/megafemworld/alx-files_manager.git
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables in .env:

```json
PORT=5000
DB_HOST=localhost
DB_PORT=27017
DB_DATABASE=files_manager
FOLDER_PATH=/tmp/files_manager
```

4. Start the servers:

**Main application:**

```bash
npm run start-server
```

**Worker (for thumbnail processing):**

```bash
npm run start-worker
```


## API Endpoints

### Authentication
- `POST /users` - Create new user
- `GET /connect` - Sign in user
- `GET /disconnect` - Sign out user
- `GET /users/me` - Get user profile

### Files
- `POST /files` - Upload new file
- `GET /files/:id` - Get file by ID
- `GET /files` - List all files
- `PUT /files/:id/publish` - Make file public
- `PUT /files/:id/unpublish` - Make file private
- `GET /files/:id/data` - Get file content

### System
- `GET /status` - Get server status
- `GET /stats` - Get file and user stats


## Testing

**Run the test suite:**
```bash
npm test
```

## Authors
- [Femi Mehalayese](https://github.com/megafemworld)
- [Gabriel Isaac](https://github.com/gabrielisaacs)