# API Documentation

## Authentication

All API endpoints (except `/api/v1/status`) require Bearer token authentication.

### How to Get Your Token

1. Sign in to the application
2. Open browser DevTools (F12)
3. Go to Application → Storage → Cookies
4. Find the `better-auth.session_token` cookie
5. Copy the value - this is your bearer token

### Using the Token

Include the token in the `Authorization` header:

```bash
Authorization: Bearer <your-token-here>
```

## Endpoints

### Status

#### `GET /api/v1/status`

**Authentication:** Not required

Returns API status information.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-12-12T10:30:00.000Z",
  "version": "1.0.0"
}
```

---

### User

#### `GET /api/v1/user`

**Authentication:** Required

Get current user information.

**Response:**

```json
{
  "id": "user_abc123",
  "name": "John Doe",
  "email": "john@example.com",
  "emailVerified": true,
  "image": "https://...",
  "theme": "dark",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

---

### Tasks

#### `GET /api/v1/tasks`

**Authentication:** Required

Get all tasks for the authenticated user.

**Response:**

```json
{
  "tasks": [
    {
      "id": "task-1234567890-abc123",
      "name": "Complete project",
      "description": "Finish the task management app",
      "body": "# Details\n\nMore information here...",
      "userId": "user_abc123",
      "assignmentId": null,
      "bookmarked": 0,
      "finished": 0,
      "deadline": "2025-12-25T00:00:00.000Z",
      "createdAt": "2025-12-10T10:00:00.000Z",
      "updatedAt": "2025-12-10T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### `POST /api/v1/tasks`

**Authentication:** Required

Create a new task.

**Request Body:**

```json
{
  "name": "Task name (required)",
  "description": "Short description",
  "bodyText": "Full markdown content",
  "deadline": "2025-12-25T00:00:00.000Z",
  "finished": 0,
  "bookmarked": 0
}
```

**Response:**

```json
{
  "id": "task-1234567890-abc123",
  "name": "Task name",
  "description": "Short description",
  "body": "Full markdown content",
  "userId": "user_abc123",
  "assignmentId": null,
  "bookmarked": 0,
  "finished": 0,
  "deadline": "2025-12-25T00:00:00.000Z",
  "createdAt": "2025-12-12T10:30:00.000Z",
  "updatedAt": "2025-12-12T10:30:00.000Z"
}
```

#### `GET /api/v1/tasks/:id`

**Authentication:** Required

Get a specific task by ID.

**Response:**

```json
{
  "id": "task-1234567890-abc123",
  "name": "Task name",
  "description": "Short description",
  "body": "Full markdown content",
  "userId": "user_abc123",
  "assignmentId": null,
  "bookmarked": 0,
  "finished": 0,
  "deadline": "2025-12-25T00:00:00.000Z",
  "createdAt": "2025-12-10T10:00:00.000Z",
  "updatedAt": "2025-12-10T10:00:00.000Z"
}
```

#### `PATCH /api/v1/tasks/:id`

**Authentication:** Required

Update a task. Only include fields you want to update.

**Request Body:**

```json
{
  "name": "Updated name",
  "description": "Updated description",
  "bodyText": "Updated markdown content",
  "finished": 1,
  "bookmarked": 1,
  "deadline": "2025-12-31T00:00:00.000Z"
}
```

**Response:**

```json
{
  "id": "task-1234567890-abc123",
  "name": "Updated name",
  "description": "Updated description",
  "body": "Updated markdown content",
  "userId": "user_abc123",
  "assignmentId": null,
  "bookmarked": 1,
  "finished": 1,
  "deadline": "2025-12-31T00:00:00.000Z",
  "createdAt": "2025-12-10T10:00:00.000Z",
  "updatedAt": "2025-12-12T10:35:00.000Z"
}
```

#### `DELETE /api/v1/tasks/:id`

**Authentication:** Required

Delete a task.

**Response:**

```json
{
  "success": true
}
```

---

### Assignments

#### `GET /api/v1/assignments`

**Authentication:** Required

Get all assignments for the authenticated user.

**Response:**

```json
{
  "assignments": [
    {
      "id": "assignment_abc123",
      "name": "Math Homework",
      "taskIds": "task-123,task-456",
      "userId": "user_abc123",
      "canvasAssignmentId": "12345",
      "canvasCourseId": "67890",
      "deadline": "2025-12-20T23:59:59.000Z",
      "createdAt": "2025-12-10T10:00:00.000Z",
      "updatedAt": "2025-12-10T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

## Error Responses

### 401 Unauthorized

```json
{
  "error": "Missing or invalid authorization header"
}
```

```json
{
  "error": "Invalid or expired token"
}
```

### 404 Not Found

```json
{
  "error": "Task not found"
}
```

### 400 Bad Request

```json
{
  "error": "Name is required"
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to fetch tasks"
}
```

---

## Example Usage

### cURL

```bash
# Get all tasks
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  https://your-domain.com/api/v1/tasks

# Create a task
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Task","description":"Test task"}' \
  https://your-domain.com/api/v1/tasks

# Update a task
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"finished":1}' \
  https://your-domain.com/api/v1/tasks/task-123

# Delete a task
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  https://your-domain.com/api/v1/tasks/task-123
```

### JavaScript/Fetch

```javascript
const token = "YOUR_TOKEN_HERE";
const baseURL = "https://your-domain.com/api/v1";

// Get all tasks
const tasks = await fetch(`${baseURL}/tasks`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
}).then((r) => r.json());

// Create a task
const newTask = await fetch(`${baseURL}/tasks`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "New Task",
    description: "Test task",
  }),
}).then((r) => r.json());

// Update a task
const updated = await fetch(`${baseURL}/tasks/task-123`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    finished: 1,
  }),
}).then((r) => r.json());

// Delete a task
await fetch(`${baseURL}/tasks/task-123`, {
  method: "DELETE",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### Python

```python
import requests

token = "YOUR_TOKEN_HERE"
base_url = "https://your-domain.com/api/v1"
headers = {"Authorization": f"Bearer {token}"}

# Get all tasks
tasks = requests.get(f"{base_url}/tasks", headers=headers).json()

# Create a task
new_task = requests.post(
    f"{base_url}/tasks",
    headers={**headers, "Content-Type": "application/json"},
    json={"name": "New Task", "description": "Test task"}
).json()

# Update a task
updated = requests.patch(
    f"{base_url}/tasks/task-123",
    headers={**headers, "Content-Type": "application/json"},
    json={"finished": 1}
).json()

# Delete a task
requests.delete(f"{base_url}/tasks/task-123", headers=headers)
```
