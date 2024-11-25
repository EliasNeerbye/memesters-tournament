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

# Game Documentation
-------------------
## REST Endpoints

All endpoints are prefixed with `/api/games/`.

### Game Settings

#### Update Game Settings
- **PUT** `/updateSettings`
  - **Request Body**: `{ rounds, timeLimit }`
  - **Description**: Updates the game settings for a waiting game.
  - **Requires**: JWT token, must be host
  - **Returns**: Success message

### Game Actions

#### Submit Memes
- **PUT** `/submit-memes`
  - **Request Body**: `{ chosenTemplate, captions }`
  - **Description**: Submits a meme for the current round.
  - **Requires**: JWT token, active game
  - **Validation**:
    - Game must be in "playing" state
    - Round must be in "submitting" state
    - Submission window must be open
    - One submission per user per round
  - **Returns**: Submission confirmation and details

## Socket Events

### Game Management Events

#### Create Game
- **Emit**: `newGame`
  - **Parameters**: None
  - **Description**: Creates a new game with the current user as host
  - **Returns**: 
    ```javascript
    {
      gameId: string,
      hostInfo: {
        playerId: string,
        playerName: string
      },
      code: string
    }
    ```

#### Join Game
- **Emit**: `joinGame`
  - **Parameters**: `code` (string)
  - **Description**: Joins an existing game using its code
  - **Returns**: 
    ```javascript
    {
      gameId: string,
      playerInfo: {
        playerId: string,
        playerName: string,
        playerPfp: string
      },
      host: {
        id: string,
        username: string,
        pfp: string
      },
      players: Array<{
        id: string,
        username: string,
        pfp: string
      }>
    }
    ```

#### Rejoin Game
- **Emit**: `rejoinGame`
  - **Parameters**: None
  - **Description**: Reconnects to a previously joined game
  - **Returns**: 
    ```javascript
    {
      gameId: string,
      playerId: string,
      gameState: string,
      host: {
        id: string,
        username: string,
        pfp: string
      },
      players: Array<{
        id: string,
        username: string,
        pfp: string,
        socketId: string
      }>
    }
    ```

#### Leave Game
- **Emit**: `leaveGame`
  - **Parameters**: None
  - **Description**: Leaves the current game
  - **Returns**: 
    ```javascript
    {
      gameId: string,
      updatedPlayers: Array<{
        id: string,
        username: string,
        pfp: string
      }>,
      host: {
        id: string,
        username: string,
        pfp: string
      }
    }
    ```

### Game State Events

#### Start Game
- **Emit**: `startGame`
  - **Parameters**: None
  - **Description**: Initiates game start (host only)
  - **Requirements**:
    - Must be host
    - Game must be in "waiting" state
    - Minimum player count must be met
  - **Broadcasts**: `gameStarted` event to all players

#### Finish Game
- **Emit**: `finishGame`
  - **Parameters**: None
  - **Description**: Ends the current game (host only)
  - **Requirements**: Must be host
  - **Broadcasts**: `gameFinished` event to all players

### Event Listeners

#### Game Created
- **Listen**: `gameCreated`
  - **Data**: Game creation details including game ID and host information

#### New Player Joined
- **Listen**: `newPlayerJoined`
  - **Data**: New player's information

#### Player Rejoined
- **Listen**: `playerRejoined`
  - **Data**: Rejoined player's information

#### Player Left
- **Listen**: `playerLeft`
  - **Data**: Departed player's information and updated player list

#### Game Started
- **Listen**: `gameStarted`
  - **Data**: Initial game state including players and round information

#### Game Finished
- **Listen**: `gameFinished`
  - **Data**: Final game state and results

#### Error Events
- **Listen**: `error`
  - **Data**: Error message and details

## Important Notes

1. All socket events require an authenticated user.
2. Game codes are unique and required for joining games.
3. Only the host can start or finish a game.
4. Players can only be in one active game at a time.
5. Games in "waiting" state with no players are automatically deleted.
6. Socket connections are managed automatically for game rooms.
-------------------