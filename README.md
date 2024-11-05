# API Documentation
-----------------------------------
## API: User endpoints
All endpoints are prefixed with `/api/user/`.

### Authentication Endpoints

#### Register User
- **POST** `/api/user/register`
  - **Request Body**: `{ email }`
  - **Description**: Sends a verification code to the provided email to confirm ownership.

#### Complete Registration
- **POST** `/api/user/register/code`
  - **Request Body**: `{ email, username, code }`
  - **Description**: Completes user registration using the verification code sent to their email.
  - **Returns**: A JWT token upon successful registration.

#### Login
- **POST** `/api/user/login`
  - **Request Body**: `{ emailOrUsername }`
  - **Description**: Sends a login verification code to the user's email.

#### Complete Login
- **POST** `/api/user/login/code`
  - **Request Body**: `{ emailOrUsername, code }`
  - **Description**: Verifies the login code and returns a JWT token.

#### Logout
- **GET** `/api/user/logout`
  - **Description**: Invalidates the current JWT token and logs the user out.

### User Profile Endpoints

#### Get User Profile
- **GET** `/api/user/profile`
  - **Requires**: Authorization Header with JWT Token
  - **Description**: Returns user profile information.

#### Update Username
- **PUT** `/api/user/profile/username`
  - **Requires**: Authorization Header with JWT Token
  - **Request Body**: `{ username }`
  - **Description**: Updates the user's username.

#### Initiate Email Change
- **POST** `/api/user/profile/email`
  - **Requires**: Authorization Header with JWT Token
  - **Description**: Sends a verification code to the current email for confirmation before changing it.

#### Update Email
- **PUT** `/api/user/profile/email`
  - **Requires**: Authorization Header with JWT Token
  - **Request Body**: `{ code, newEmail }`
  - **Description**: Verifies the code and sends a new verification code to the new email.

#### Confirm New Email
- **POST** `/api/user/profile/email/code`
  - **Requires**: Authorization Header with JWT Token
  - **Request Body**: `{ newCode }`
  - **Description**: Confirms the new email and updates the user's email.

#### Update Profile Picture
- **PUT** `/api/user/profile/pfp`
  - **Requires**: Authorization Header with JWT Token
  - **Request Body**: Form data with 'pfp' file.
  - **Description**: Updates the user's profile picture.

### Account Deletion

#### Initiate Account Deletion
- **DELETE** `/api/user/delete-user`
  - **Requires**: Authorization Header with JWT Token
  - **Description**: Sends a verification code to the user's email for confirmation before deletion.

#### Confirm Account Deletion
- **DELETE** `/api/user/delete-user/code`
  - **Requires**: Authorization Header with JWT Token
  - **Request Body**: `{ code }`
  - **Description**: Deletes the user account if the verification code is valid.

### Important Notes:
1. All endpoints except registration and login require a valid JWT token in the Authorization header.
2. The token should be included as follows:
