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
---

## REST Endpoints

All endpoints are prefixed with `/api/games/`.

### Game Settings

#### Update Game Settings
- **PUT** `/updateSettings`
  - **Request Body**: `{ rounds, timeLimit }`
  - **Description**: Updates the game settings for a waiting game.
  - **Requires**:
    - JWT token for authentication.
    - User must be the host of the game.
  - **Validation**:
    - Game must be in the "waiting" state.
  - **Returns**: 
    ```json
    {
      "message": "Updated settings"
    }
    ```

### Game Actions

#### Submit Memes
- **PUT** `/submit-memes`
  - **Request Body**: `{ chosenTemplate, captions }`
  - **Description**: Submits a meme for the current round.
  - **Requires**:
    - JWT token for authentication.
    - Player must be part of an active game.
  - **Validation**:
    - Game must be in the "playing" state.
    - Round must be in the "submitting" state.
    - Submission window must be open.
    - Each user can only submit one meme per round.
  - **Returns**: 
    ```json
    {
      "message": "Meme submitted successfully",
      "submission": {
        "userId": string,
        "memeIndex": string,
        "captions": [string]
      }
    }
    ```

#### Submit Vote
- **PUT** `/submit-vote`
  - **Request Body**: `{ submissionsRanked }`
  - **Description**: Submits a player's vote for the current round.
  - **Requires**:
    - JWT token for authentication.
    - Player must be part of an active game.
  - **Validation**:
    - Game must be in the "playing" state.
    - Round must be in the "judging" state.
    - Players cannot vote for their own submission.
    - Submission IDs must be valid for the current round.
  - **Returns**: 
    ```json
    {
      "message": "Judgment submitted successfully",
      "remainingJudgements": number,
      "totalPlayers": number
    }
    ```

## Socket Events

### Game Management Events

#### Create Game
- **Emit**: `newGame`
  - **Parameters**: None
  - **Description**: Creates a new game with the current user as the host.
  - **Broadcasts**:
    - `gameCreated` event to the emitting client.
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
  - **Description**: Joins an existing game using its code.
  - **Broadcasts**:
    - `newPlayerJoined` event to all players in the game room.
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
  - **Description**: Reconnects to a previously joined game.
  - **Broadcasts**:
    - `playerRejoined` event to all players in the game room.
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
  - **Description**: Leaves the current game.
  - **Broadcasts**:
    - `playerLeft` event to all players in the game room.
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

#### Remove User
- **Emit**: `removeUser`
  - **Parameters**: `userIdToRemove` (string)
  - **Description**: Removes a specific player from the game (host only).
  - **Broadcasts**:
    - `playerRemoved` event to all players in the game room.

### Game State Events

#### Start Game
- **Emit**: `startGame`
  - **Parameters**: None
  - **Description**: Starts the game (host only).
  - **Broadcasts**:
    - `gameStarted` event to all players in the game room.

#### Finish Game
- **Emit**: `finishGame`
  - **Parameters**: None
  - **Description**: Ends the game (host only).
  - **Broadcasts**:
    - `gameFinished` event to all players in the game room.

#### Start New Round
- **Emit**: `nextRound`
  - **Parameters**: None
  - **Description**: Starts a new round in the game (host only).
  - **Broadcasts**:
    - `roundStarted` event to all players with round details.

### Event Listeners

#### Player Events
- **Listen**:
  - `newPlayerJoined`: New player's information.
  - `playerRejoined`: Rejoined player's information.
  - `playerLeft`: Departed player's information and updated player list.
  - `playerRemoved`: Removed player's information.

#### Game Lifecycle Events
- **Listen**:
  - `gameCreated`: Game creation details including game ID and host information.
  - `gameStarted`: Initial game state including players and round information.
  - `gameFinished`: Final game state and results.
  - `roundStarted`: Round details including round number, templates, and time limit.

#### Error Events
- **Listen**:
  - `error`: Error message and details.

## Important Notes

1. **Authentication**: All socket events and REST endpoints require a valid JWT token.
2. **Host Privileges**: Only the host can start or finish games and remove users.
3. **Game State Management**: Games in "waiting" state with no players are automatically deleted. Active games transition to "finished" if all players leave.
4. **Round-Specific Rules**:
    - Memes can only be submitted during the "submitting" state of a round.
    - Votes can only be submitted during the "judging" state of a round.
5. **Unique Game Codes**: Game codes are required for joining games.

---