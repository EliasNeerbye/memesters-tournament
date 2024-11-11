# API Documentation
-----------------------------------
## API: User endpoints
All endpoints are prefixed with `/api/users/`.

### Authentication Endpoints

#### Register User
- **POST** `/api/users/register`
  - **Request Body**: `{ email }`
  - **Description**: Sends a verification code to the provided email to confirm ownership.

#### Complete Registration
- **POST** `/api/users/register/code`
  - **Request Body**: `{ email, username, code }`
  - **Description**: Completes user registration using the verification code sent to their email.
  - **Returns**: A JWT token upon successful registration.

#### Login
- **POST** `/api/users/login`
  - **Request Body**: `{ emailOrUsername }`
  - **Description**: Sends a login verification code to the user's email.

#### Complete Login
- **POST** `/api/users/login/code`
  - **Request Body**: `{ emailOrUsername, code }`
  - **Description**: Verifies the login code and returns a JWT token.

#### Logout
- **GET** `/api/users/logout`
  - **Description**: Invalidates the current JWT token and logs the user out.

### User Profile Endpoints

#### Get User Profile
- **GET** `/api/users/profile`
  - **Requires**: Authorization Header with JWT Token
  - **Description**: Returns user profile information.

#### Update Username
- **PUT** `/api/users/profile/username`
  - **Requires**: Authorization Header with JWT Token
  - **Request Body**: `{ username }`
  - **Description**: Updates the user's username.

#### Initiate Email Change
- **POST** `/api/users/profile/email`
  - **Requires**: Authorization Header with JWT Token
  - **Description**: Sends a verification code to the current email for confirmation before changing it.

#### Update Email
- **PUT** `/api/users/profile/email`
  - **Requires**: Authorization Header with JWT Token
  - **Request Body**: `{ code, newEmail }`
  - **Description**: Verifies the code and sends a new verification code to the new email.

#### Confirm New Email
- **POST** `/api/users/profile/email/code`
  - **Requires**: Authorization Header with JWT Token
  - **Request Body**: `{ newCode }`
  - **Description**: Confirms the new email and updates the user's email.

#### Update Profile Picture
- **PUT** `/api/users/profile/pfp`
  - **Requires**: Authorization Header with JWT Token
  - **Request Body**: Form data with 'pfp' file.
  - **Description**: Updates the user's profile picture.

### Account Deletion

#### Initiate Account Deletion
- **DELETE** `/api/users/delete-user`
  - **Requires**: Authorization Header with JWT Token
  - **Description**: Sends a verification code to the user's email for confirmation before deletion.

#### Confirm Account Deletion
- **DELETE** `/api/users/delete-user/code`
  - **Requires**: Authorization Header with JWT Token
  - **Request Body**: `{ code }`
  - **Description**: Deletes the user account if the verification code is valid.

### Important Notes:
1. All endpoints except registration and login require a valid JWT token in the Authorization header.
2. The token should be included as follows: "Authorization: Bearer <token>"
3. Many endpoints use a two-step verification process (send code, then verify code).
4. Error responses will include a `message` field explaining the error.
5. Successful responses typically include a `message` field and sometimes additional data (e.g., `token`, `pfpUrl`).
-----------------------------------
