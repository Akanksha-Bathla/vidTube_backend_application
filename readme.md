# 📺 VidTube – Backend API
VidTube is a fully-featured backend API for a video-sharing platform inspired by YouTube. It supports user authentication, video uploads, playlists, likes/dislikes, comments, subscriptions, and more. Built with Express.js and MongoDB, it's designed with clean architecture and modular controllers for scalability.

## 📚 Table of Contents
- [ER Diagram](#-er-diagram)
- [Features](#-features)
- [Tech Stack](#%EF%B8%8F-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
    - [Health Check](#-healthcheck-api)
    - [User](#-user-api)
    - [Videos](#-videos)
    - [Comments](#-comments)
    - [Tweets (Short Posts)](#-tweet-api-community-posts)
    - [Playlists](#-playlists)
    - [Likes](#%EF%B8%8F-likes)
    - [Subscriptions](#-subscriptions)
    - [Dashboard](#-dashboard)
- [Project Structure](#-project-structure)
- [API Testing](#-api-testing-postman)
- [Contribute](#-contribute)
## 📐 ER Diagram
![ER Diagram for vidTube](./public/vidTube_ER_Diagram.svg)



## 🚀 Features

- 🔐 User authentication (Sign up, Login, Logout)
- 📹 Upload, update, delete videos
- 💬 Commenting on videos and tweets
- 🧵 Tweet-like posts
- ❤️ Like videos, tweets, and comments
- 📂 Playlist management (Create, delete, add/remove video)
- 🔁 Subscriptions (Follow/unfollow users)
- 📊 User dashboard with analytics
- 🍪 JWT-based auth with secure cookies

## 🛠️ Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Authentication:** JWT (access & refresh tokens)
- **Utilities:** Cloudinary (media storage), dotenv, multer, asyncHandler

## 🧑‍💻 Getting Started

### 1. Clone the repository

``` bash
git clone https://github.com/Akanksha-Bathla/vidTube_backend_application.git
```

### 2. Install dependencies
``` bash 
npm install
```

### 3. Set environment variables
Create a `.env` file in the root directory and fill it like this:

```
PORT = 8000
CORS_ORIGIN = *

MONGODB_URI = your_mongodb_connection_string

ACCESS_TOKEN_SECRET = your_Access_token
ACCESS_TOKEN_EXPIRY = 1d

REFRESH_TOKEN_SECRET = your_refresh_token
REFRESH_TOKEN_EXPIRY = 10d

CLOUDINARY_CLOUD_NAME = your_cloud_name  
CLOUDINARY_API_KEY = your_key
CLOUDINARY_API_SECRET = your_secret
```

### 4. Run the server
```
npm run dev
```

## 🔐 Environment Variables
| Variable       | Description                          |
|---------------|--------------------------------------|
| `PORT`   | Server port     |
| `MONGO_URI`     | MongoDB connection string       |
| `ACCESS_TOKEN_SECRET` | Secret for JWT tokens |
| `REFRESH_TOKEN_SECRET` | Secret for refresh tokens |
|`CLOUDINARY_*`| Media storage credentials|

## 📡 API Endpoints
All routes are prefixed with /api/v1.

<br/>

### 🩺 Healthcheck API
| Method | Endpoint               | Description                        | Auth Required |
| ------ | ---------------------- | ---------------------------------- | ------------- |
| `GET`  | `/api/v1/healthcheck/` | Check if backend server is running | No            |

<br/>

### 👤 User API
| Method  | Endpoint                        | Description                                    | Auth Required | Notes                                              |
| ------- | ------------------------------- | ---------------------------------------------- | ------------- | -------------------------------------------------- |
| `POST`  | `/api/v1/users/register`        | Register a new user                            | No            | Supports uploading `avatar` and `coverImage` files |
| `POST`  | `/api/v1/users/login`           | Login user and receive access & refresh tokens | No            |                                                    |
| `POST`  | `/api/v1/users/refesh-token`    | Refresh access token using refresh token       | No            |                                                    |
| `POST`  | `/api/v1/users/logout`          | Logout current user                            | Yes           | Requires JWT token                                 |
| `POST`  | `/api/v1/users/change-password` | Change password for current logged-in user     | Yes           | Requires JWT token                                 |
| `GET`   | `/api/v1/users/currentUser`     | Get current logged-in user details             | Yes           | Requires JWT token                                 |
| `GET`   | `/api/v1/users/c/:username`     | Get public channel profile by username         | Yes           | Requires JWT token                                 |
| `PATCH` | `/api/v1/users/update-account`  | Update account details (name, email, etc.)     | Yes           | Requires JWT token                                 |
| `PATCH` | `/api/v1/users/avatar`          | Update user avatar                             | Yes           | Requires JWT token, multipart/form-data upload     |
| `PATCH` | `/api/v1/users/cover-image`     | Update user cover image                        | Yes           | Requires JWT token, multipart/form-data upload     |
| `GET`   | `/api/v1/users/history`         | Get watch history of current user              | Yes           | Requires JWT token                                 |


<br/>

### 🎥 Videos
| Method   | Endpoint                                 | Description                                                        |
| -------- | ---------------------------------------- | ------------------------------------------------------------------ |
| `GET`    | `/api/v1/videos`                         | Fetch all published videos                                         |
| `POST`   | `/api/v1/videos`                         | Upload a new video (with `videoFile` and `thumbnail` as form-data) |
| `GET`    | `/api/v1/videos/:videoId`                | Get a single video by ID                                           |
| `PATCH`  | `/api/v1/videos/:videoId`                | Update video details (optionally update `thumbnail`)               |
| `DELETE` | `/api/v1/videos/:videoId`                | Delete a video                                                     |
| `PATCH`  | `/api/v1/videos/toggle/publish/:videoId` | Toggle publish status of a video                                   |

🔐 All routes are protected and require JWT authentication.

📤 File Upload:\
Use `multipart/form-data` with these fields:
- `videoFile`: video file (1 file)
- `thumbnail`: image file (1 file)

<br/>

### 💬 Comments
| Method   | Endpoint                                 | Description                                              |
| -------- | ---------------------------------------- | -------------------------------------------------------- |
| `GET`    | `/api/v1/comments/:entityType/:entityId` | Get all comments for a given entity (`video` or `tweet`) |
| `POST`   | `/api/v1/comments/:entityType/:entityId` | Add a new comment to a video or tweet                    |
| `DELETE` | `/api/v1/comments/c/:commentId`          | Delete a specific comment                                |
| `PATCH`  | `/api/v1/comments/c/:commentId`          | Update a specific comment                                |

🔐 All routes are protected and require JWT authentication.

📝 entityType can be:
- video — for video comments
- tweet — for tweet comments

<br/>

### 🐦 Tweet API (Community Posts)
| Method   | Endpoint                      | Description                         |
| -------- | ----------------------------- | ----------------------------------- |
| `POST`   | `/api/v1/tweets/`             | Create a new tweet (community post) |
| `GET`    | `/api/v1/tweets/user/:userId` | Get all tweets by a specific user   |
| `PATCH`  | `/api/v1/tweets/:tweetId`     | Update a specific tweet             |
| `DELETE` | `/api/v1/tweets/:tweetId`     | Delete a specific tweet             |

🔐 All routes are protected and require JWT authentication.

<br/>

### 📂 Playlists
| Method   | Endpoint                                        | Description                        |
| -------- | ----------------------------------------------- | ---------------------------------- |
| `POST`   | `/api/v1/playlists/`                            | Create a new playlist              |
| `GET`    | `/api/v1/playlists/:playlistId`                 | Get details of a specific playlist |
| `PATCH`  | `/api/v1/playlists/:playlistId`                 | Update playlist details            |
| `DELETE` | `/api/v1/playlists/:playlistId`                 | Delete a playlist                  |
| `PATCH`  | `/api/v1/playlists/add/:videoId/:playlistId`    | Add a video to a playlist          |
| `PATCH`  | `/api/v1/playlists/remove/:videoId/:playlistId` | Remove a video from a playlist     |
| `GET`    | `/api/v1/playlists/user/:userId`                | Get all playlists of a user        |

🔐 All routes are protected and require JWT authentication.


<br/>

### ❤️ Likes
| Method | Endpoint                            | Description                                |
| ------ | ----------------------------------- | ------------------------------------------ |
| `POST` | `/api/v1/likes/toggle/v/:videoId`   | Toggle like on a video                     |
| `POST` | `/api/v1/likes/toggle/c/:commentId` | Toggle like on a comment                   |
| `POST` | `/api/v1/likes/toggle/t/:tweetId`   | Toggle like on a tweet                     |
| `GET`  | `/api/v1/likes/videos`              | Get all liked videos of the logged-in user |

🔐 All routes are protected and require JWT authentication.

<br/>

### 🔁 Subscriptions
| Method | Endpoint                                | Description                                              |
| ------ | --------------------------------------- | -------------------------------------------------------- |
| `POST` | `/api/v1/subscriptions/c/:channelId`    | Toggle subscription to a channel (subscribe/unsubscribe) |
| `GET`  | `/api/v1/subscriptions/c/:channelId`    | Get list of subscribers for a channel                    |
| `GET`  | `/api/v1/subscriptions/u/:subscriberId` | Get list of channels subscribed by a user                |

🔐 All routes are protected and require JWT authentication.

<br/>

### 📊 Dashboard
| Method | Endpoint                   | Description                                                       |
| ------ | -------------------------- | ----------------------------------------------------------------- |
| `GET`  | `/api/v1/dashboard/stats`  | Get channel statistics (likes, subscribers, comments, etc.)       |
| `GET`  | `/api/v1/dashboard/videos` | Get all videos uploaded by the authenticated user (channel owner) |

<br/>

## 📁 Project Structure

```
VIDTUBE/
├── .git
├── public/                     # Static assets
├── src/
│   ├── controllers/            # Route handlers
│   ├── db/                     # DB connection/config
│   ├── middlewares/           # Custom middlewares (auth, multer, etc.)
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # API route definitions
│   ├── utils/                  # Utilities (ApiResponse, asyncHandler, etc.)
│   ├── app.js                  # Express app with all middlewares and routes
│   ├── constants.js            # App-wide constants
│   └── index.js                # Entry point
├── .env                        # Environment variables
├── .gitignore
├── .prettierrc / .prettierignore
├── package.json / lock.json
└── README.md
```


## 🧪 API Testing (Postman)

All APIs have been tested thoroughly using Postman.

👉 [Download Postman Collection](./postman/vidTube.postman_collection.json)

To use:
1. Open Postman
2. Import the collection using the downloaded JSON
3. Set your environment variables (like JWT token, base URL, etc.)

## 🤝 Contribute
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.


