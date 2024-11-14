# API Documentation
-------------------
## User Endpoints

All endpoints are prefixed with `/api/users/`.

### Authentication

#### Register User
- **POST** `/register`
  - **Request Body**: `{ email }`
  - **Description**: Initiates user registration by sending a verification code to the provided email.

#### Complete Registration
- **POST** `/register/code`
  - **Request Body**: `{ email, username, code }`
  - **Description**: Completes user registration using the verification code.
  - **Returns**: JWT token on success.

#### Login
- **POST** `/login`
  - **Request Body**: `{ emailOrUsername }`
  - **Description**: Initiates login by sending a verification code to the user's email.

#### Complete Login
- **POST** `/login/code`
  - **Request Body**: `{ emailOrUsername, code }`
  - **Description**: Completes login by verifying the code.
  - **Returns**: JWT token on success.

#### Logout
- **GET** `/logout`
  - **Description**: Invalidates the current JWT token and logs out the user.

### User Profile

#### Get Profile
- **GET** `/profile`
  - **Description**: Retrieves user profile information.
  - **Requires**: JWT token

#### Update Username
- **PUT** `/profile/username`
  - **Request Body**: `{ username }`
  - **Description**: Updates the user's username.
  - **Requires**: JWT token

#### Initiate Email Change
- **POST** `/profile/email`
  - **Description**: Sends a verification code to the current email.
  - **Requires**: JWT token

#### Update Email
- **PUT** `/profile/email`
  - **Request Body**: `{ code, newEmail }`
  - **Description**: Verifies the code and initiates change to the new email.
  - **Requires**: JWT token

#### Confirm New Email
- **POST** `/profile/email/code`
  - **Request Body**: `{ newCode }`
  - **Description**: Confirms and updates to the new email.
  - **Requires**: JWT token

#### Update Profile Picture
- **PUT** `/profile/pfp`
  - **Request Body**: Form data with 'pfp' file
  - **Description**: Updates the user's profile picture.
  - **Requires**: JWT token

### Account Deletion

#### Initiate Account Deletion
- **DELETE** `/delete-user`
  - **Description**: Sends a verification code for account deletion.
  - **Requires**: JWT token

#### Confirm Account Deletion
- **DELETE** `/delete-user/code`
  - **Request Body**: `{ code }`
  - **Description**: Deletes the user account if the code is valid.
  - **Requires**: JWT token

## Important Notes

1. All endpoints except registration and login require a valid JWT token.
2. Include the token in the Authorization header: `Authorization: Bearer <token>`.
3. Many endpoints use a two-step verification process.
4. Error responses include a `message` field explaining the error.
5. Successful responses typically include a `message` field and sometimes additional data.
-------------------