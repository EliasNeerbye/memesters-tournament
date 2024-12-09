## API Documentation

### User Endpoints

All user endpoints are prefixed with `/api/users/`.

#### Authentication

**Register User**
- **POST** `/register`
- **Request Body**: `{ email }`
- **Description**: Initiates user registration by sending a verification code to the provided email.

**Complete Registration**
- **POST** `/register/code`
- **Request Body**: `{ email, username, code }`
- **Description**: Completes user registration using the verification code.
- **Returns**: JWT token on success.

**Login**
- **POST** `/login`
- **Request Body**: `{ emailOrUsername }`
- **Description**: Initiates login by sending a verification code to the user's email.

**Complete Login**
- **POST** `/login/code`
- **Request Body**: `{ emailOrUsername, code }`
- **Description**: Completes login by verifying the code.
- **Returns**: JWT token on success.

**Logout**
- **GET** `/logout`
- **Description**: Invalidates the current JWT token and logs out the user.

#### User Profile

**Get Profile**
- **GET** `/profile`
- **Description**: Retrieves user profile information.
- **Requires**: JWT token

**Update Username**
- **PUT** `/profile/username`
- **Request Body**: `{ username }`
- **Description**: Updates the user's username.
- **Requires**: JWT token

**Initiate Email Change**
- **POST** `/profile/email`
- **Description**: Sends a verification code to the current email.
- **Requires**: JWT token

**Update Email**
- **PUT** `/profile/email`
- **Request Body**: `{ code, newEmail }`
- **Description**: Verifies the code and initiates change to the new email.
- **Requires**: JWT token

**Confirm New Email**
- **POST** `/profile/email/code`
- **Request Body**: `{ newCode }`
- **Description**: Confirms and updates to the new email.
- **Requires**: JWT token

**Update Profile Picture**
- **PUT** `/profile/pfp`
- **Request Body**: Form data with 'pfp' file
- **Description**: Updates the user's profile picture.
- **Requires**: JWT token

#### Account Deletion

**Initiate Account Deletion**
- **DELETE** `/delete-user`
- **Description**: Sends a verification code for account deletion.
- **Requires**: JWT token

**Confirm Account Deletion**
- **DELETE** `/delete-user/code`
- **Request Body**: `{ code }`
- **Description**: Deletes the user account if the code is valid.
- **Requires**: JWT token

### Game Endpoints

All game endpoints are prefixed with `/api/games/`.

#### Game Settings

**Update Game Settings**
- **PUT** `/updateSettings`
- **Request Body**: `{ rounds, timeLimit }`
- **Description**: Updates the game settings for a waiting game.
- **Requires**: JWT token, user must be the host of the game.
- **Validation**: Game must be in the "waiting" state.
- **Returns**: `{ "message": "Updated settings" }`

#### Game Actions

**Submit Memes**
- **PUT** `/submit-memes`
- **Request Body**: `{ chosenTemplate, captions }`
- **Description**: Submits a meme for the current round.
- **Requires**: JWT token, player must be part of an active game.
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
      "memeIndex": string,
      "captions": [string]
    }
  }
  ```

**Submit Vote**
- **PUT** `/submit-vote`
- **Request Body**: `{ submissionsRanked }`
- **Description**: Submits a player's vote for the current round.
- **Requires**: JWT token, player must be part of an active game.
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

### Socket Events

#### Game Management Events

**Create Game**
- **Emit**: `newGame`
- **Parameters**: None
- **Description**: Creates a new game with the current user as the host.
- **Broadcasts**: `gameCreated` event to the emitting client.
- **Returns**:
  ```javascript
  {
    gameId: string,
    hostInfo: { playerName: string },
    code: string
  }
  ```

**Join Game**
- **Emit**: `joinGame`
- **Parameters**: `code` (string)
- **Description**: Joins an existing game using its code.
- **Broadcasts**: `newPlayerJoined` event to all players in the game room.
- **Returns**:
  ```javascript
  {
    gameId: string,
    playerInfo: { playerName: string, playerPfp: string },
    host: { username: string, pfp: string },
    players: Array<{ username: string, pfp: string }>
  }
  ```

**Rejoin Game**
- **Emit**: `rejoinGame`
- **Parameters**: None
- **Description**: Reconnects to a previously joined game.
- **Broadcasts**: `playerRejoined` event to all players in the game room.
- **Returns**:
  ```javascript
  {
    gameId: string,
    gameState: string,
    host: { username: string, pfp: string },
    players: Array<{ username: string, pfp: string }>
  }
  ```

**Leave Game**
- **Emit**: `leaveGame`
- **Parameters**: None
- **Description**: Leaves the current game.
- **Broadcasts**: `playerLeft` event to all players in the game room.
- **Returns**:
  ```javascript
  {
    gameId: string,
    updatedPlayers: Array<{ username: string, pfp: string }>,
    host: { username: string, pfp: string }
  }
  ```

**Remove User**
- **Emit**: `removeUser`
- **Parameters**: `usernameToRemove` (string)
- **Description**: Removes a specific player from the game (host only).
- **Broadcasts**: `playerRemoved` event to all players in the game room.

#### Game State Events

**Start Game**
- **Emit**: `startGame`
- **Parameters**: None
- **Description**: Starts the game (host only).
- **Broadcasts**: `gameStarted` event to all players in the game room.
- **Returns**:
  ```javascript
  {
    gameId: string,
    players: Array<{ username: string, pfp: string }>,
    currentRound: number,
    totalRounds: number,
    leaderboard: Array<{ username: string, score: number }>
  }
  ```

**Finish Game**
- **Emit**: `finishGame`
- **Parameters**: None
- **Description**: Ends the game (host only).
- **Broadcasts**: `gameFinished` event to all players in the game room.
- **Returns**:
  ```javascript
  {
    gameId: string,
    finalState: {
      leaderboard: Array<{ username: string, score: number }>
    }
  }
  ```

**Start New Round**
- **Emit**: `nextRound`
- **Parameters**: None
- **Description**: Starts a new round in the game (host only).
- **Broadcasts**: `newRound` event to all players with round details.
- **Returns**:
  ```json
  [
    {
      "roundNumber": number,
      "memes": [
        {
          "id": string,
          "name": string,
          "lines": number,
          "overlays": number,
          "styles": [string],
          "blank": string,
          "example": {
            "text": [string],
            "url": string
          },
          "source": string,
          "keywords": [string],
          "_self": string
        }
      ],
      "timeLimit": number
    }
  ]
  ```

#### Event Listeners

**Player Events**
- `newPlayerJoined`: New player's information.
- `playerRejoined`: Rejoined player's information.
- `playerLeft`: Departed player's information and updated player list.
- `playerRemoved`: Removed player's information.

**Game Lifecycle Events**
- `gameCreated`: Game creation details including game ID and host information.
- `gameStarted`: Initial game state including players and round information.
- `gameFinished`: Final game state and results.
- `newRound`: Round details including round number, memes, and time limit.

**Error Events**
- `error`: Error message and details.

## Important Notes

1. All socket events and REST endpoints require a valid JWT token for authentication.
2. Only the host can start or finish games and remove users.
3. Games in "waiting" state with no players are automatically deleted. Active games transition to "finished" if all players leave.
4. Memes can only be submitted during the "submitting" state of a round.
5. Votes can only be submitted during the "judging" state of a round.
6. Game codes are required for joining games.
7. Each player receives a set of randomly shuffled meme templates at the start of each round.