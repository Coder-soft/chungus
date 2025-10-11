**```

# YouTube Channel Rating API Documentation

## Overview

This API allows users to submit ratings for YouTube channels and retrieve all submitted ratings. The API fetches real-time channel information from YouTube (channel name and subscriber count) and stores it along with user-provided ratings and comments.

## Base URL

```


https://your-domain.com


```

## Authentication

No authentication required - this is a public API.

---

## Endpoints

### 1. Submit Channel Rating

Submit a new YouTube channel rating with stars and comments. The API will fetch channel information from YouTube automatically.

**Endpoint:** `POST /api/submit-channel`

**Request Headers:**

```


Content-Type: application/json


```

**Request Body:**

```json

{

  "youtubeHandle": "@channelhandle",

  "stars": 5,

  "comment": "Your review comment here"

}

```

**Request Body Parameters:**

- `youtubeHandle` (string, required): The YouTube channel handle (e.g., "@mrbeast") or channel name
- `stars` (integer, required): Rating from 1 to 5
- `comment` (string, required): User's review comment

**Success Response (201 Created):**

```json

{

  "success": true,

  "data": {

    "id": 1,

    "youtubeHandle": "@mrbeast",

    "channelName": "MrBeast",

    "subscriberCount": 239000000,

    "stars": 5,

    "comment": "Amazing content creator!",

    "submittedAt": "2024-01-15T10:30:00.000Z"

  }

}

```

**Error Response (400 Bad Request):**

```json

{

  "error": "YouTube handle is required"

}

```

or

```json

{

  "error": "Stars must be a number between 1 and 5"

}

```

or

```json

{

  "error": "Comment is required"

}

```

or

```json

{

  "error": "Failed to fetch YouTube channel: [error details]"

}

```

**Error Response (500 Internal Server Error):**

```json

{

  "error": "Internal server error"

}

```

**Example Request (cURL):**

```bash

curl -X POST https://your-domain.com/api/submit-channel \

  -H "Content-Type: application/json" \

  -d '{

    "youtubeHandle": "@mrbeast",

    "stars": 5,

    "comment": "Best content creator on YouTube!"

  }'

```

**Example Request (JavaScript):**

```javascript

const response = await fetch('/api/submit-channel', {

  method: 'POST',

  headers: {

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    youtubeHandle: '@mrbeast',

    stars: 5,

    comment: 'Best content creator on YouTube!'

  })

});


const data = await response.json();

console.log(data);

```

**Example Request (Python):**

```python

import requests

import json


url = "https://your-domain.com/api/submit-channel"

payload = {

    "youtubeHandle": "@mrbeast",

    "stars": 5,

    "comment": "Best content creator on YouTube!"

}

headers = {"Content-Type": "application/json"}


response = requests.post(url, data=json.dumps(payload), headers=headers)

print(response.json())

```

---

### 2. Get All Channel Ratings

Retrieve all submitted channel ratings from the database. Results are ordered by submission date (most recent first).

**Endpoint:** `GET /api/channels`

**Request Headers:**

None required

**Success Response (200 OK):**

```json

[

  {

    "id": 1,

    "youtubeHandle": "@mrbeast",

    "channelName": "MrBeast",

    "subscriberCount": 239000000,

"avatarUrl": "https://yt3.googleusercontent.com/ytc/example-avatar-url",

    "stars": 5,

    "comment": "The most creative content on YouTube! Every video is a masterpiece.",

    "submittedAt": "2024-01-15T10:30:00.000Z"

  },

  {

    "id": 2,

    "youtubeHandle": "@mkbhd",

    "channelName": "Marques Brownlee",

    "subscriberCount": 19500000,

"avatarUrl": "https://yt3.googleusercontent.com/ytc/example-avatar-url",

    "stars": 5,

    "comment": "Best tech reviews hands down. Crisp production quality.",

    "submittedAt": "2024-01-14T08:20:00.000Z"

  },

  {

    "id": 3,

    "youtubeHandle": "@veritasium",

    "channelName": "Veritasium",

    "subscriberCount": 14800000,

"avatarUrl": "https://yt3.googleusercontent.com/ytc/example-avatar-url",

    "stars": 5,

    "comment": "Mind-blowing science content that makes complex topics accessible.",

    "submittedAt": "2024-01-13T15:45:00.000Z"

  }

]

```

**Response Fields:**

- `id` (integer): Unique identifier for the rating
- `youtubeHandle` (string): The YouTube channel handle
- `channelName` (string): Full name of the YouTube channel (from YouTube API)
- `subscriberCount` (integer): Number of subscribers (from YouTube API)
- `avatarUrl` (string): URL of the channel's avatar/profile image for use in UI
- `stars` (integer): User rating from 1 to 5
- `comment` (string): User's review comment
- `submittedAt` (string): ISO 8601 timestamp of when the rating was submitted

**Error Response (500 Internal Server Error):**

```json

{

  "error": "Internal server error: [error details]"

}

```

**Example Request (cURL):**

```bash

curl https://your-domain.com/api/channels

```

**Example Request (JavaScript):**

```javascript

const response = await fetch('/api/channels');

const channels = await response.json();

console.log(channels);

```

**Example Request (Python):**

```python

import requests


url = "https://your-domain.com/api/channels"

response = requests.get(url)

print(response.json())

```

---

### 3. Delete Channel Rating

Delete a specific channel rating by its ID.

**Endpoint:** `DELETE /api/channels/[id]`

**URL Parameters:**

- `id` (integer, required): The unique identifier of the channel rating to delete

**Success Response (200 OK):**

```json

{

  "success": true,

  "message": "Channel deleted successfully",

  "id": 1

}

```

**Error Response (400 Bad Request):**

```json

{

  "error": "Valid ID is required",

  "code": "INVALID_ID"

}

```

**Error Response (404 Not Found):**

```json

{

  "error": "Channel not found",

  "code": "NOT_FOUND"

}

```

**Error Response (500 Internal Server Error):**

```json

{

  "error": "Internal server error: [error details]"

}

```

**Example Request (cURL):**

```bash

curl -X DELETE https://your-domain.com/api/channels/1

```

**Example Request (JavaScript):**

```javascript

const response = await fetch('/api/channels/1', {

  method: 'DELETE'

});


const data = await response.json();

console.log(data);

```

**Example Request (Python):**

```python

import requests


url = "https://your-domain.com/api/channels/1"

response = requests.delete(url)

print(response.json())

```

---

## Database Schema

### Channels Table

| Column Name     | Type    | Constraints                 | Description                             |

| --------------- | ------- | --------------------------- | --------------------------------------- |

| id              | integer | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for each rating       |

| youtubeHandle   | text    | NOT NULL                    | YouTube channel handle (e.g., @mrbeast) |

| channelName     | text    | NOT NULL                    | Full channel name from YouTube API      |

| subscriberCount | integer | NOT NULL                    | Number of subscribers from YouTube API  |

| avatarUrl | text | NOT NULL | URL of the channel's avatar/profile image |

| stars           | integer | NOT NULL                    | User rating (1-5)                       |

| comment         | text    | NOT NULL                    | User's review comment                   |

| submittedAt     | text    | NOT NULL                    | ISO 8601 timestamp of submission        |

---

## Error Codes

### POST /api/submit-channel

- `400` - Invalid request (missing or invalid parameters)
- `500` - Internal server error

### GET /api/channels

- `500` - Internal server error

### DELETE /api/channels/[id]

- `400` - Invalid ID parameter (INVALID_ID)
- `404` - Channel not found (NOT_FOUND)
- `500` - Internal server error

---

## Rate Limiting

Currently, no rate limiting is implemented. This may be added in future versions.

---

## Data Validation

### POST /api/submit-channel

- `youtubeHandle`: Must be a non-empty string
- `stars`: Must be an integer between 1 and 5 (inclusive)
- `comment`: Must be a non-empty string
- YouTube channel must exist and be accessible via YouTube Data API v3

### DELETE /api/channels/[id]

- `id`: Must be a valid positive integer
- Channel with the specified ID must exist in the database

---

## YouTube API Integration

This API integrates with YouTube Data API v3 to fetch real-time channel information:

- Channel Name
- Subscriber Count

The API automatically handles:

- Channel handle to channel ID resolution
- Data fetching and parsing
- Error handling for invalid or non-existent channels

**Note:** YouTube API has daily quota limits. If the quota is exceeded, new submissions may fail temporarily until the quota resets.

---

## Examples

### Complete Workflow Example

1. **Submit a new channel rating:**

```bash

curl -X POST https://your-domain.com/api/submit-channel \

  -H "Content-Type: application/json" \

  -d '{

    "youtubeHandle": "@fireship",

    "stars": 5,

    "comment": "Best programming tutorials, short and to the point!"

  }'

```

Response:

```json

{

  "success": true,

  "data": {

    "id": 4,

    "youtubeHandle": "@fireship",

    "channelName": "Fireship",

    "subscriberCount": 3200000,

    "stars": 5,

    "comment": "Best programming tutorials, short and to the point!",

    "submittedAt": "2024-01-16T12:00:00.000Z"

  }

}

```

2. **Retrieve all ratings:**

```bash

curl https://your-domain.com/api/channels

```

Response:

```json

[

  {

    "id": 4,

    "youtubeHandle": "@fireship",

    "channelName": "Fireship",

    "subscriberCount": 3200000,

    "stars": 5,

    "comment": "Best programming tutorials, short and to the point!",

    "submittedAt": "2024-01-16T12:00:00.000Z"

  },

  {

    "id": 1,

    "youtubeHandle": "@mrbeast",

    "channelName": "MrBeast",

    "subscriberCount": 239000000,

    "stars": 5,

    "comment": "The most creative content on YouTube!",

    "submittedAt": "2024-01-15T10:30:00.000Z"

  }

]

```

3. **Delete a rating:**

```bash

curl -X DELETE https://your-domain.com/api/channels/4

```

Response:

```json

{

  "success": true,

  "message": "Channel deleted successfully",

  "id": 4

}

```

---

## Version History

### v1.0.0 (Current)

- Initial release
- POST /api/submit-channel - Submit channel ratings
- GET /api/channels - Retrieve all ratings
- DELETE /api/channels/[id] - Delete specific rating
- YouTube Data API v3 integration
- SQLite database with Drizzle ORM
- Full CRUD operations

---

## Technical Stack

- **Framework:** Next.js 15 with App Router
- **Database:** Turso (SQLite)
- **ORM:** Drizzle ORM
- **External API:** YouTube Data API v3
- **Language:** TypeScript

---

## Support

For issues, questions, or feature requests, please contact the development team or create an issue in the project repository.

---

## License

This API is provided as-is for public use. Please respect YouTube's Terms of Service when using this API.

```


```

**
