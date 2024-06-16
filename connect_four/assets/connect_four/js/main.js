const constants =
    {
        game_over_enum :
        {
            WIN_PLAYER_1: 1,
            WIN_PLAYER_2: 2,
            DRAW: 3,
        },
        assets:
        {
            SOUND_BOUNCE_PATH: "assets/connect_four/audio/drop_bounce.mp3",
            SOUND_MENU_HOVER: "assets/connect_four/audio/bubble_sound.mp3",
            SOUND_CLICK: "assets/connect_four/audio/click_cool.wav",
            MUSIC_MENU: "assets/connect_four/audio/main_menu.mp3",
            MUSIC_GAME: "assets/connect_four/audio/game.mp3",
        },
        game_constraints:
        {
            TURN_LENGTH:30,
            BOUNCE_DELAY_MS : 418,
        },
        ui_state:
        {
            IN_MENU: 0,
            IN_GAME: 1,
            PLAYER_1_MOVE : 1,
            PLAYER_2_MOVE : 2,
            BLOCKING_ANIMATION : 3,
            GAME_OVER: 4,
        },
        board_constraints:
        {
            MAX_ROWS : 6,
            MAX_COLUMNS : 7,
        },
        player:
        {
            PLAYER1 : 1,
            PLAYER2 : 2,
        },
        scene_selector:
        {
            MAIN_MENU : ".scene-main-menu",
            RULES : ".scene-rules",
            GAME : ".scene-board",
            LOADING : ".scene-loading",
        },
        main_menu_selector:
        {
            RULES_BUTTON: ".menu-button-rules",
            GAME_START_BUTTON: ".menu-button-play",
        },
        rules_selector:
        {
            BACK_BUTTON: ".rules-container .back-button",
        },
        game_selector:
        {
            MENU_BUTTON: ".game-menu .board-menu-button",
            PROGRESS_BAR: ".progress-bar",
            RESTART_BUTTON: ".game-menu .board-restart-button",
            COUNTER_CONTAINER: ".counter-container",
            MARKER: ".marker",
            TURN_COUNTER: ".turn-counter",
            TURN_COUNTER_PLAYER_LABEL: ".player-turn-label",
            TURN_COUNTER_TIMER_VALUE: ".timer-value",
            WINNER_CARD: ".winner-card",
            WINNER_BAR: ".winner-message-bar",
            WINNER_TEXT_LABEL: ".winner-card-player-label",
            SCORE_VAL_PLAYER_1: ".score-player1 .score-value",
            SCORE_VAL_PLAYER_2: ".score-player2 .score-value",
            SCORE_PLAYER_1: ".score-player1",
            SCORE_PLAYER_2: ".score-player2",
            PLAY_AGAIN_BUTTON: ".winner-card .winner-card-play-again",
            ESCAPE_MENU: ".in-game-escape-menu",
            DARKEN_OVERLAY: ".darken-overlay",
            ESCAPE_MENU_QUIT_GAME: ".in-game-escape-menu .menu-button-quit",
            ESCAPE_MENU_CONTINUE_GAME: ".in-game-escape-menu .menu-button-continue",
            ESCAPE_MENU_RESTART: ".in-game-escape-menu .menu-button-restart",
            MUTE_BUTTON: ".volume-button",
            WINNING_COUNTER: "counter-won",
        },
        player_turn_messages:
        {
            PLAYER_1_TURN: "PLAYER 1's TURN",
            PLAYER_2_TURN: "PLAYER 2's TURN",
        },
        animation_selectors:
        {
            FLOAT_ANIM: "float-anim",
            NO_ANIM: "no-anim",
        },
        css_breakpoints:
        {
            BREAKPOINT_BOARD: 685, 
        },
        volume_button_class:
        {
            MUTED: "volume-button-off",
            UNMUTED: "volume-button-on",
        },
        winner_bar_class:
        {
            PLAYER1: "winner-message-bar-player1",
            PLAYER2: "winner-message-bar-player2",
        },
    };


class SceneManager
{
    #current_scene = null;
    constructor()
    {
        if (document.readyState === "complete" 
            || document.readyState === "loaded" 
            || document.readyState === "interactive") 
        {
            // DOM's already loaded
            this.#current_scene = document.querySelector(constants.scene_selector.LOADING);
        }
        else
        {
            document.addEventListener('DOMContentLoaded', function() 
                {
                    this.#current_scene = document.querySelector(constants.scene_selector.LOADING);
                }.bind(this));
        }
    }
    getCurrentScene()
    {
        return this.#current_scene;
    }

    switchScene(scene_class)
    {
        this.#current_scene.style.display='none';
        this.#current_scene = document.querySelector(scene_class);
        this.#current_scene.style.display='block';
    }
}
class MusicManager
{
    #current_track = new Audio(constants.assets.MUSIC_MENU);
    // This is unnecessary, but saves the need to do a some URL substring processing when extrating the data from #current_track
    #current_track_path = constants.assets.MUSIC_MENU; 
    #is_muted = false;

    //Switches to the specified track, unless it's already playing it
    switchTrackNoRepeat(track_path)
    {
        if (track_path == this.#current_track_path)
            return;

        this.#current_track_path = track_path;
        this.#current_track.src = track_path;

        if (this.#is_muted)
            return;

        this.#current_track.play();
        this.#current_track.loop = true;
    }
    //Switches to the specified track regardless if it's playing it already, will just start from the beggining
    switchTrack(track_path)
    {
        this.#current_track_path = track_path;
        this.#current_track.src = track_path;

        if (this.#is_muted)
            return;

        this.#current_track.play();
        this.#current_track.loop = true;
    }
    mute()
    {
        this.#current_track.pause();
        this.#is_muted = true;
    }

    //Mutes if not muted, unmute if muted
    // Returns false if muted, true if unmuted
    toggleMute()
    {
        if(this.#is_muted)
        {
            this.#current_track.play();
            this.#is_muted = false;
            return true;
        }
        else
        {
            this.mute();
            return false;
        }
    }
}


// Represents a win. Contains the player than won as well as the coordinates of the winning counters.
// This is so that upon a win, we could find the winning counters and add a css class on them for visual purposes
class PlayerWin
{
    // Enum of player that won
    player_enum;
    // Array containing the coordinates of the winning counters
    winning_counters = [];
    constructor(player_enum,winning_counters)
    {
        this.player_enum = player_enum;
        this.winning_counters = winning_counters;
    }
}


// Holds the logic of the entire game.
class BoardStateManager
{
    #current_player = null;
    #board_state_buffer = null;
    #board_state = null;
    //Timestamp of the start of the current turn
    #time_left_turn = constants.game_constraints.TURN_LENGTH;

    resetTimer()
    {
        this.#time_left_turn = constants.game_constraints.TURN_LENGTH;
    }

    decrementTimer()
    {
        this.#time_left_turn -= 1;
    }

    getCurrentPlayer()
    {
        return this.#current_player;
    }

    getTimer()
    {
        return this.#time_left_turn;
    }

    constructor()
    {
        this.#current_player = constants.player.PLAYER1;
        this.#board_state_buffer = new ArrayBuffer(constants.board_constraints.MAX_ROWS * constants.board_constraints.MAX_COLUMNS);
        this.#board_state = new Int8Array(this.#board_state_buffer);
    }

    resetGameState(last_winner)
    {
        this.resetBoard();
        this.resetTimer();

        if(last_winner == null)
            this.#current_player = constants.player.PLAYER1;
        else
        {
            this.#current_player = last_winner == constants.player.PLAYER1 ? 
                constants.player.PLAYER2 : constants.player.PLAYER1;
        }
    }

    setPlayer(player_enum)
    {
        this.#current_player = player_enum;
    }
    switchPlayer()
    {
        const other_player_enum = this.#current_player == constants.player.PLAYER1 ?
            constants.player.PLAYER2 : constants.player.PLAYER1;
        this.#current_player = other_player_enum;
    }

    // Calculates the row index of where a counter would go, given the column index
    // This function is abstracted from the placeCounter function because it is used both for placing counters and for creating the counter animation
    // Returns -1 if the counter cannot be placed (Since the column is full)
    calculateCounterPlacement(column_index)
    {
        for (let row_index = constants.board_constraints.MAX_ROWS - 1; row_index >= 0; row_index--) {
            if(this.#board_state[(row_index * constants.board_constraints.MAX_COLUMNS) + column_index] == 0)
            {
                return row_index;
            }
        }
        return -1;
    }

    //Places the counter at the specified column position or returns -1 if it cannot.
    //Returns the row_index of where the counter was placed.
    placeCounter(column_index, player_enum)
    {
        const row_index = this.calculateCounterPlacement(column_index);
        if (row_index == -1 )
            return -1;
        this.#board_state[(row_index * constants.board_constraints.MAX_COLUMNS) + column_index] = player_enum;
        return row_index;
    }

    isOutOfBounds(row_index,col_index)
    {
        if(row_index < 0 || row_index > constants.board_constraints.MAX_ROWS || col_index < 0
            || col_index >  constants.board_constraints.MAX_COLUMNS)
        {
            return true;
        }
        return false;
    }

    //Checks for win condition around a specified coordinate and player enum
    //Returns:
    // one of the constants.game_over_enum values or
    //-1 if nobody won
    checkWinCondition(row_index,col_index,player_enum)
    {
        console.log("Row:" + row_index);
        console.log("Column:" + col_index);
        let row_iterator,col_iterator,consecutive_counter_count,winning_counters;

        //////////////////////// VERTICAL CHECK /////////////////////////////////////////
        consecutive_counter_count = 0;
        winning_counters = [];
        row_iterator = Math.max(row_index - 3, 0); // bounded top check
        for(let i = 1; i <= 8; i++)
        {
            const player_enum_at_iterator = this.#board_state[(row_iterator * constants.board_constraints.MAX_COLUMNS) + col_index];
            if(player_enum_at_iterator == player_enum)
            {
                consecutive_counter_count++;
                winning_counters.push([row_iterator,col_index]);
            }
            else
            {
                consecutive_counter_count = 0;
                winning_counters = [];
            }

            if(consecutive_counter_count == 4)
                return new PlayerWin(player_enum,winning_counters);

            if (this.isOutOfBounds(row_iterator,col_index))
                break;

            row_iterator++;
        }

        //////////////////////// HORIZONTAL CHECK /////////////////////////////////////////
        winning_counters = [];
        consecutive_counter_count = 0;
        col_iterator = Math.min(col_index + 3, constants.board_constraints.MAX_COLUMNS - 1); // bounded right check
        for(let i = 1; i <= 8; i++)
        {
            const player_enum_at_iterator = this.#board_state[(row_index * constants.board_constraints.MAX_COLUMNS) + col_iterator];
            if(player_enum_at_iterator == player_enum)
            {
                consecutive_counter_count++;
                winning_counters.push([row_index,col_iterator]);
            }
            else
            {
                consecutive_counter_count = 0;
                winning_counters = [];
            }

            if(consecutive_counter_count == 4)
                return new PlayerWin(player_enum,winning_counters);

            if (this.isOutOfBounds(row_index,col_iterator))
                break;

            col_iterator--;
        }

        //////////////////////// DIAGONAL-RIGHT CHECK /////////////////////////////////////////

        winning_counters = [];
        consecutive_counter_count = 0;
        col_iterator = col_index + 3;
        row_iterator = row_index - 3;

        while(this.isOutOfBounds(row_iterator,col_iterator))
        {
            col_iterator--;
            row_iterator++;
        }
        for(let i = 1; i <= 8; i++)
        {
            const player_enum_at_iterator = this.#board_state[(row_iterator * constants.board_constraints.MAX_COLUMNS) + col_iterator];
            if(player_enum_at_iterator == player_enum)
            {
                consecutive_counter_count++;
                winning_counters.push([row_iterator,col_iterator]);
            }
            else
            {
                consecutive_counter_count = 0;
                winning_counters = [];
            }

            if(consecutive_counter_count == 4)
                return new PlayerWin(player_enum,winning_counters);

            if (this.isOutOfBounds(row_iterator,col_iterator))
                break;

            col_iterator--;
            row_iterator++;
        }

        //////////////////////// DIAGONAL-LEFT CHECK /////////////////////////////////////////

        winning_counters = [];
        consecutive_counter_count = 0;
        col_iterator = col_index - 3;
        row_iterator = row_index - 3;

        while(this.isOutOfBounds(row_iterator,col_iterator))
        {
            col_iterator++;
            row_iterator++;
        }

        for(let i = 1; i <= 8; i++)
        {
            const player_enum_at_iterator = this.#board_state[(row_iterator * constants.board_constraints.MAX_COLUMNS) + col_iterator];
            if(player_enum_at_iterator == player_enum)
            {
                consecutive_counter_count++;
                winning_counters.push([row_iterator,col_iterator]);
            }
            else
            {
                consecutive_counter_count = 0;
                winning_counters = [];
            }

            if(consecutive_counter_count == 4)
                return new PlayerWin(player_enum,winning_counters);

            if (this.isOutOfBounds(row_iterator,col_iterator))
                break;

            col_iterator++;
            row_iterator++;
        }

        //////////////////////// DRAW CHECK /////////////////////////////////////////
        //If there's any empty slot it's not a draw, otherwise it is
        let is_draw = true;
        for(let i = 0; i < constants.board_constraints.MAX_ROWS * constants.board_constraints.MAX_COLUMNS; i++)
        {
            if(this.#board_state[i] == 0)
            {
                is_draw = false;
                break;
            }
        }

        return is_draw == true ? constants.game_over_enum.DRAW : -1;
    }

    resetBoard()
    {
        this.#board_state.fill(0);
    }

    getBoardStateView()
    {
        return this.#board_state;
    }
}

// Bridges the logic of the game and the UI.
class Game
{
    //Defining the singleton here is unnecessary but I did for convenience, since my lsp gets confused if I don't.
    static s_instance = new Game();

    scene_manager = new SceneManager();
    board_state_manager = new BoardStateManager();
    music_manager = new MusicManager();

    ui_state = constants.ui_state.IN_MENU;

    //Interval id for timer
    timerIntervalID = null;

    player1_wins = 0;
    player2_wins = 0;
    //Player enum holding the last winner.
    last_winner = null;

    //DOM elements references
    marker_element = null;
    counter_container = null;
    turn_counter_element = null;
    winner_card_element = null;
    winner_card_text_element = null;
    timer_value_element = null;
    score_val_player_1_element = null;
    score_val_player_2_element = null;
    score_player_1_element = null;
    score_player_2_element = null;
    bounce_audio_element = null;
    escape_menu_element = null;
    mute_button_element = null;
    winner_bar_element = null;
    darken_overlay_element = null;

    constructor()
    {
        if (Game.s_instance)
            throw new Error("Only one instance of game can exist at a time.");

        // Initialize all references to DOM elements
        if (document.readyState === "complete" 
            || document.readyState === "loaded" 
            || document.readyState === "interactive") 
        {
            this.marker_element = document.querySelector(constants.game_selector.MARKER);
            this.counter_container = document.querySelector(constants.game_selector.COUNTER_CONTAINER);
            this.turn_counter_element = document.querySelector(constants.game_selector.TURN_COUNTER);
            this.timer_value_element = document.querySelector(constants.game_selector.TURN_COUNTER_TIMER_VALUE);
            this.winner_card_element = document.querySelector(constants.game_selector.WINNER_CARD);
            this.score_val_player_1_element = document.querySelector(constants.game_selector.SCORE_VAL_PLAYER_1);
            this.score_val_player_2_element = document.querySelector(constants.game_selector.SCORE_VAL_PLAYER_2);
            this.score_player_1_element = document.querySelector(constants.game_selector.SCORE_PLAYER_1);
            this.score_player_2_element = document.querySelector(constants.game_selector.SCORE_PLAYER_2);
            this.escape_menu_element = document.querySelector(constants.game_selector.ESCAPE_MENU);
            this.mute_button_element = document.querySelector(constants.game_selector.MUTE_BUTTON);
            this.winner_bar_element = document.querySelector(constants.game_selector.WINNER_BAR);
            this.darken_overlay_element = document.querySelector(constants.game_selector.DARKEN_OVERLAY);
            this.winner_card_text_element = document.querySelector(constants.game_selector.WINNER_TEXT_LABEL);
        }
        else
        {

            document.addEventListener('DOMContentLoaded', function() 
                {
                    this.marker_element = document.querySelector(constants.game_selector.MARKER);
                    this.counter_container = document.querySelector(constants.game_selector.COUNTER_CONTAINER);
                    this.turn_counter_element = document.querySelector(constants.game_selector.TURN_COUNTER);
                    this.timer_value_element = document.querySelector(constants.game_selector.TURN_COUNTER_TIMER_VALUE);
                    this.winner_card_element = document.querySelector(constants.game_selector.WINNER_CARD);
                    this.score_val_player_1_element = document.querySelector(constants.game_selector.SCORE_VAL_PLAYER_1);
                    this.score_val_player_2_element = document.querySelector(constants.game_selector.SCORE_VAL_PLAYER_2);
                    this.score_player_1_element = document.querySelector(constants.game_selector.SCORE_PLAYER_1);
                    this.score_player_2_element = document.querySelector(constants.game_selector.SCORE_PLAYER_2);
                    this.escape_menu_element = document.querySelector(constants.game_selector.ESCAPE_MENU);
                    this.mute_button_element = document.querySelector(constants.game_selector.MUTE_BUTTON);
                    this.winner_bar_element = document.querySelector(constants.game_selector.WINNER_BAR);
                    this.darken_overlay_element = document.querySelector(constants.game_selector.DARKEN_OVERLAY);
                    this.winner_card_text_element = document.querySelector(constants.game_selector.WINNER_TEXT_LABEL);
                }.bind(this));
        }
        Game.s_instance = this;
        return Game.s_instance;
    }
    static the()
    {
        if (Game.s_instance)
            return Game.s_instance;

        Game.s_instance = new Game();
        return Game.s_instance;
    }

    // Callback that gets called every second and handle the game's timer
    static updateClock()
    {
        Game.the().board_state_manager.decrementTimer();
        // UI update with this time left
        Game.the().updateClockLook();

        if (Game.the().board_state_manager.getTimer() < 0)
        {
            console.log("GAME OVER! by time");
            //the opposite of whose turn it currently is
            if (Game.the().board_state_manager.getCurrentPlayer() == constants.ui_state.PLAYER_1_MOVE)
                Game.the().game_over(new PlayerWin(constants.player.PLAYER2,null));
            else
                Game.the().game_over(new PlayerWin(constants.player.PLAYER1,null));
        }
    }

    resumeGame()
    {
        // Should I refactor this with some kind of game function?
        // That occurs whenever you enter a menu or something?
        this.ui_state = constants.ui_state.IN_GAME;
        this.escape_menu_element.style.display = 'none';
        this.marker_element.classList.add("display-flex");
        this.marker_element.classList.remove("display-none");
        this.darken_overlay_element.style.display = 'none';

        clearInterval(this.timerIntervalID);
        this.timerIntervalID = setInterval(Game.updateClock, 1000);
    }
    pauseGame()
    {
        this.ui_state = constants.ui_state.IN_MENU;

        this.marker_element.classList.add("display-none");
        this.marker_element.classList.remove("display-flex");
        this.escape_menu_element.style.display = 'flex';
        this.darken_overlay_element.style.display = 'block';

        clearInterval(this.timerIntervalID);
    }

    toggleMute()
    {
        const is_playing = this.music_manager.toggleMute();

        if(is_playing)
        {
            this.mute_button_element.classList.add(constants.volume_button_class.UNMUTED);
            this.mute_button_element.classList.remove(constants.volume_button_class.MUTED);
        }
        else
        {
            this.mute_button_element.classList.add(constants.volume_button_class.MUTED);
            this.mute_button_element.classList.remove(constants.volume_button_class.UNMUTED);
        }
    }

    //Make it accept this PlayerWin and make it do everything.
    game_over(playerWin)
    {
        this.last_winner = playerWin.player_enum;

        clearInterval(this.timerIntervalID);
        this.ui_state = constants.ui_state.GAME_OVER;

        if(playerWin.player_enum == constants.player.PLAYER1)
            this.player1_wins++;
        else
            this.player2_wins++;

        // UI updates
        // Add the class to the winning counters if they exist
        if (playerWin.winning_counters != null)
        {
            // Iterate over all counters
            const counters = document.querySelectorAll(".counter");
            counters.forEach(function(counter)
                {
                    const grid_area_property_string = getComputedStyle(counter).gridArea;
                    const regex = /\s*(\d+)\s*\/\s*(\d+)/;
                    const match = grid_area_property_string.match(regex);
                    console.log("Grid area string:" + grid_area_property_string)

                    const counter_row_index = match[1] - 1;
                    const counter_col_index = match[2] - 1;

                    // Iterate through all of the counters inside the playerWin ting
                    playerWin.winning_counters.forEach(function(winning_counter)
                        {
                            if(counter_row_index == winning_counter[0] && counter_col_index == winning_counter[1])
                            {
                                // Then this counter matches the winning counter and thus we should add a class to it
                                counter.classList.add(constants.game_selector.WINNING_COUNTER);
                            }
                        });

                })
        }

        //TODO: Handle draw case
        //Draw condition ... 
        //if(game_result == constants.game_over_enum.DRAW)
        //    console.log("DRAW");

        //Update Winner card UI and Winner Bar UI
        this.winner_card_element.style.display = "flex";
        this.winner_card_text_element.innerHTML = playerWin.player_enum == constants.player.PLAYER1 ? "PLAYER 1" : "PLAYER 2";
        this.marker_element.classList.add('display-none');
        this.updateWinnerBarLook(playerWin.player_enum);

        this.timer_value_element.innerText = `${constants.game_constraints.TURN_LENGTH}s`;

        // Update the score UI
        if(playerWin.player_enum == constants.player.PLAYER1)
            this.score_val_player_1_element.innerText = this.player1_wins;
        else
            this.score_val_player_2_element.innerText = this.player2_wins;
    }


    // Returns -1 if the game is ongoing, otherwise
    checkAndHandleWinCondition(row_index,col_index,player_enum)
    {
        const game_result = this.board_state_manager.checkWinCondition(row_index,col_index,player_enum);
        if (game_result == -1)
            return -1;

        //Win condition ...
        this.game_over(game_result);
    }

    switchScene(scene_class)
    {
        if(scene_class == constants.scene_selector.GAME)
        {
            this.initializeGame();
            this.music_manager.switchTrackNoRepeat(constants.assets.MUSIC_GAME);
        }
        if(scene_class == constants.scene_selector.MAIN_MENU) 
        {
            this.music_manager.switchTrackNoRepeat(constants.assets.MUSIC_MENU);
        }

        this.scene_manager.switchScene(scene_class);
    }

    resetSessionState()
    {
        this.player1_wins = 0;
        this.player2_wins = 0;
    }

    initializeGame()
    {
        console.log("initializing game")
        this.board_state_manager.resetGameState(this.last_winner); // Game logic reset
        this.resetGameUI(); // UI state reset

        clearInterval(this.timerIntervalID);
        this.timerIntervalID = setInterval(Game.updateClock, 1000);
    }

    quitGame()
    {
        document.removeEventListener('click', handleGameClick);
        // Maybe put all actions related to resetting the game state in a single function
        // Because at the moment both quitting the game and hitting game over require that functionality and I might slip up and update one and forget the other
        clearInterval(this.timerIntervalID); 
    }

    resetGameUI()
    {
        // Reset every UI related state to the start. What's the point of this if it doesn't reflect the game state? Should it not just be called right after resetting the board?
        this.ui_state = constants.ui_state.IN_GAME;

        this.updateBoardUI();
        this.updateMarkerClass(this.board_state_manager.getCurrentPlayer());
        this.updateTurnCounterLook(this.board_state_manager.getCurrentPlayer());
        this.updateScoreLook(this.board_state_manager.getCurrentPlayer());
        this.updateClockLook();
        this.resetWinnerBarLook();

        this.marker_element.classList.remove('display-none');
        this.winner_card_element.style.display = 'none';
        this.escape_menu_element.style.display = 'none';
        this.darken_overlay_element.style.display = 'none';
    }

    
    // Places a counter and keeps UI in sync
    placeCounter(col_index)
    {
        if(this.ui_state != constants.ui_state.IN_GAME)
            return -1;
        const player_enum = this.ui_state = this.board_state_manager.getCurrentPlayer();

        // Place counter in the logical representation of the game
        const row_index = this.board_state_manager.placeCounter(col_index,player_enum);
        if(row_index == -1)
            return -1;

        const html_counter = `
                        <div class="counter counter-player${player_enum} bounce-in-top" style="grid-area:${row_index+1}/${col_index+1};"></div>`;
        this.counter_container.insertAdjacentHTML('beforeend', html_counter);

        const counter_elment = this.counter_container.lastElementChild;
        
        this.ui_state = constants.ui_state.BLOCKING_ANIMATION;
        counter_elment.addEventListener('animationend', function() 
            {
                this.board_state_manager.switchPlayer(); // Logical state updates
                this.board_state_manager.resetTimer();

                this.syncUiWithGameLogicState();
                this.ui_state = constants.ui_state.IN_GAME;
                this.checkAndHandleWinCondition(row_index,col_index,player_enum);
            }.bind(this));

        //Trigger sound efect after delay
        setTimeout(()=>{
            const audio = new Audio(constants.assets.SOUND_BOUNCE_PATH);  // Create a new audio object
            audio.play();  // Play the new audio object
        },constants.game_constraints.BOUNCE_DELAY_MS);

    }

    //Aesthetic changes
    // Question: Should this be its own manager? Like the UI manager or something? Probably not
    // Function that updates the board aesthetically with what's in the board state
    updateBoardUI()
    {
        const board_view = this.board_state_manager.getBoardStateView();
        //I need access to the dom element for the board
        const counter_container = document.querySelector(constants.game_selector.COUNTER_CONTAINER);
        //Then I need to clear it of any elements it has inside.
        while (counter_container.lastChild) {
            counter_container.removeChild(counter_container.lastChild);
        }

        //Iterate through the board_view and create a counter DOM element for each counter in the game's state.
        for (let row_index = 0; row_index < constants.board_constraints.MAX_ROWS; row_index++) {
            for(let col_index = 0; col_index < constants.board_constraints.MAX_COLUMNS; col_index++)
            {
                const counter_enum = board_view[(row_index * constants.board_constraints.MAX_COLUMNS) + col_index];
                if(counter_enum != 0)
                {
                    //TODO: Maybe introduce web components here.
                    const html_counter = `
                        <div class="counter counter-player${counter_enum}" style="grid-area:${row_index+1}/${col_index+1};"></div>`;
                    counter_container.insertAdjacentHTML('beforeend', html_counter);
                }
            }
        }
    }

    //Syncs up the UI with the current state of the game.
    //Contrary to the name, it does not synchronize the board, due to that interfering with the counter placing animation.
    syncUiWithGameLogicState()
    {
        this.updateMarkerClass(this.board_state_manager.getCurrentPlayer());
        this.updateTurnCounterLook(this.board_state_manager.getCurrentPlayer());
        this.updateScoreLook(this.board_state_manager.getCurrentPlayer());
        this.updateClockLook();
    }

    updateMarkerClass(player_enum)
    {
        if (player_enum == constants.player.PLAYER1)
        {
            this.marker_element.classList.remove("marker-player2");
            this.marker_element.classList.add("marker-player1");
        }
        else 
        {
            this.marker_element.classList.remove("marker-player1");
            this.marker_element.classList.add("marker-player2");
        }
    }

    updateClockLook()
    {
        Game.the().timer_value_element.innerText = `${Game.the().board_state_manager.getTimer()}s`;
    }
    //Floats the score element of the given player
    updateScoreLook(player_enum)
    {
        if (player_enum == constants.player.PLAYER1)
        {
            this.score_player_1_element.classList.add(constants.animation_selectors.FLOAT_ANIM);
            this.score_player_1_element.classList.remove(constants.animation_selectors.NO_ANIM);

            this.score_player_2_element.classList.remove(constants.animation_selectors.FLOAT_ANIM);
            this.score_player_2_element.classList.add(constants.animation_selectors.NO_ANIM);
        }
        else 
        {
            this.score_player_2_element.classList.add(constants.animation_selectors.FLOAT_ANIM);
            this.score_player_2_element.classList.remove(constants.animation_selectors.NO_ANIM);

            this.score_player_1_element.classList.remove(constants.animation_selectors.FLOAT_ANIM);
            this.score_player_1_element.classList.add(constants.animation_selectors.NO_ANIM);
        }

    }
    updateTurnCounterLook(player_enum)
    {
        const player_turn_label = this.turn_counter_element.querySelector(constants.game_selector.TURN_COUNTER_PLAYER_LABEL);
        if ( player_enum == constants.player.PLAYER1)
        {
            this.turn_counter_element.classList.remove("turn-counter-player2");
            this.turn_counter_element.classList.add("turn-counter-player1");
            player_turn_label.textContent = constants.player_turn_messages.PLAYER_1_TURN;
        }
        else 
        {
            this.turn_counter_element.classList.remove("turn-counter-player1");
            this.turn_counter_element.classList.add("turn-counter-player2");
            player_turn_label.textContent = constants.player_turn_messages.PLAYER_2_TURN;
        }
    }


    updateWinnerBarLook(playerEnum)
    {
        if(playerEnum == constants.player.PLAYER1)
        {
            this.winner_bar_element.classList.add(constants.winner_bar_class.PLAYER1);
        }
        else
        {
            this.winner_bar_element.classList.add(constants.winner_bar_class.PLAYER2);
        }
    }
    resetWinnerBarLook()
    {

            this.winner_bar_element.classList.remove(constants.winner_bar_class.PLAYER1);
            this.winner_bar_element.classList.remove(constants.winner_bar_class.PLAYER2);
    }

    updateMarkerPosition(column_index)
    {
        //Change the marker's position to be above a certain column.
        const counter_container_style = getComputedStyle(this.counter_container);
        const column_gap = parseInt(counter_container_style["column-gap"]);

        //TODO: don't hardcode it, discover it. Challenge is the property that has this has a different value for each column.
        const column_size = 64;
        this.marker_element.style.left=`${((column_size + column_gap) * column_index) + column_size/2}px`;
    }
}


var image_assets = ["assets/connect_four/images/cpu.svg",
                    "assets/connect_four/images/counter-red-small.svg",
                    "assets/connect_four/images/counter-yellow-small.svg",
                    "assets/connect_four/images/counter-red-large.svg",
                    "assets/connect_four/images/counter-yellow-large.svg",
                    "assets/connect_four/images/board-layer-black-small.svg",
                    "assets/connect_four/images/board-layer-white-small.svg",
                    "assets/connect_four/images/board-layer-black-large.svg",
                    "assets/connect_four/images/board-layer-white-large.svg",
                    "assets/connect_four/images/volume-on.svg",
                    "assets/connect_four/images/volume-off.svg",
                    "assets/connect_four/images/volume-low.svg",
                    "assets/connect_four/images/marker-red.svg",
                    "assets/connect_four/images/marker-yellow.svg",
                    "assets/connect_four/images/turn-background-red.svg",
                    "assets/connect_four/images/turn-background-yellow.svg",
                    "assets/connect_four/images/icon-check.svg",
                    "assets/connect_four/images/icon-check-purple.svg",
                    "assets/connect_four/images/icon-check-purple.svg",
                    "assets/connect_four/images/player-vs-player.svg",
]
var audio_assets = [ "assets/connect_four/audio/drop_bounce.mp3",
                     "assets/connect_four/audio/bubble_sound.mp3",
                     "assets/connect_four/audio/click_cool.wav",
                     "assets/connect_four/audio/main_menu.mp3",
                     "assets/connect_four/audio/game.mp3",
]
//TODO: fill in the image_assets and audio_assets, then make a little loading screen.
// The game should start in the loding stage, then this loadAllAssets function should
// be the one to switch from the loading scene to the main menu.
// Could pretty easily make a progress bar of some kind as well.

function loadAllAssets()
{
    const progress_bar = document.querySelector(constants.game_selector.PROGRESS_BAR);
    let asset_loaded_count = 0;
    const total_asset_count = audio_assets.length + image_assets.length;
    console.log(total_asset_count);

    const asset_array = []; // So they don't get garbage collected
    function onAssetLoad(){
        asset_loaded_count++;
        console.log(`Loaded: something; total nr loaded assets: ${asset_loaded_count}`);
        //Update the progress_bar
        let progress_percent = Math.floor((asset_loaded_count / total_asset_count) * 100);
        progress_bar.style.width= `${progress_percent}%`
        console.log("progress perc:" + progress_percent);
        console.log("just the division" + (asset_loaded_count/total_asset_count));

        if(asset_loaded_count == total_asset_count)
        {
            Game.the().switchScene(constants.scene_selector.MAIN_MENU);
        }
    } 
    image_assets.forEach(function(path)
        {
            const image = new Image();
            asset_array.push(image);
            image.onload = onAssetLoad;
            image.onerror = function(error){
                console.log(error);
            }
            image.src = path;
        });
    audio_assets.forEach(function(path)
        {
            const track = new Audio();
            asset_array.push(track);
            track.addEventListener("canplaythrough",onAssetLoad);
            track.onerror = function(error){
                console.log(error);
            }
            track.src = path;
            track.load();
        });
}




document.addEventListener('DOMContentLoaded', function() 
    {

        loadAllAssets();
        // Attach Button handlers
        const main_menu_game_rules_button = document.querySelector(constants.main_menu_selector.RULES_BUTTON);
        main_menu_game_rules_button.addEventListener('click',function(event)
            {
                Game.the().switchScene(constants.scene_selector.RULES);
                event.stopPropagation();
            });

        const rules_back_button = document.querySelector(constants.rules_selector.BACK_BUTTON);
        rules_back_button.addEventListener('click',function(event)
            {
                Game.the().switchScene(constants.scene_selector.MAIN_MENU);
                event.stopPropagation();
            });
        const game_start_button = document.querySelector(constants.main_menu_selector.GAME_START_BUTTON);
        game_start_button.addEventListener('click',function(event)
            {
                Game.the().switchScene(constants.scene_selector.GAME);
                event.stopPropagation();
            });


        const game_menu_button = document.querySelector(constants.game_selector.MENU_BUTTON);

        game_menu_button.addEventListener('click',function(event)
            { 
                if (Game.the().escape_menu_element.style.display == 'flex')
                    Game.the().resumeGame();
                else
                    Game.the().pauseGame();
                event.stopPropagation();
            });
        // Escape menu button handlers
        const quit_game_button = document.querySelector(constants.game_selector.ESCAPE_MENU_QUIT_GAME);
        quit_game_button.addEventListener('click',function(event)
            {
                //TODO: Make it so the game's state is reset on this switch scene.
                Game.the().switchScene(constants.scene_selector.MAIN_MENU);
                event.stopPropagation();
            });
        const continue_game_button = document.querySelector(constants.game_selector.ESCAPE_MENU_CONTINUE_GAME);
        continue_game_button.addEventListener('click',function(event)
            {
                Game.the().resumeGame();
                event.stopPropagation();
            });

        const game_restart_button = document.querySelector(constants.game_selector.RESTART_BUTTON);
        game_restart_button.addEventListener('click',function(event)
            {
                Game.the().initializeGame();
                Game.the().music_manager.switchTrack(constants.assets.MUSIC_GAME);
                event.stopPropagation();
            });

        const play_again_button = document.querySelector(constants.game_selector.PLAY_AGAIN_BUTTON);
        play_again_button.addEventListener('click',function()
            {
                console.log("Play again button clicked");
                Game.the().switchScene(constants.scene_selector.GAME);
                event.stopPropagation();
            });

        const mute_button = document.querySelector(constants.game_selector.MUTE_BUTTON);
        mute_button.addEventListener('click',function()
            {
                console.log("Mute button clicked");
                Game.the().toggleMute();
            });


        //TODO Maybe add this mousemove event to the counter container instead of the whole document?
        document.addEventListener('mousemove', function(event) {
            const counter_container = document.querySelector(constants.game_selector.COUNTER_CONTAINER);
            const rect = counter_container.getBoundingClientRect();
            
            if (event.clientX >= rect.x && event.clientX <= (rect.x + rect.width)) {
                const xOffset = event.clientX - rect.x;
                const col_index = getCounterContainerColumnIndexFromXOffset(xOffset)
                // Here we can add the aesthetic change (change the position of the marker to be above the index)
                Game.the().updateMarkerPosition(col_index);

            }          
        });

        // Handle game clicks event
        document.addEventListener('click', function (event){
            if(Game.the().ui_state == constants.ui_state.GAME_OVER || constants.ui_state.IN_MENU)
            {
                return;
            }
            const counter_container = document.querySelector(constants.game_selector.COUNTER_CONTAINER);
            const rect = counter_container.getBoundingClientRect();

            if (event.clientX >= rect.x && event.clientX <= (rect.x + rect.width) && event.clientY >= rect.y) {
                const xOffset = event.clientX - rect.x;
                const col_index = getCounterContainerColumnIndexFromXOffset(xOffset)
                Game.the().placeCounter(col_index,constants.player.PLAYER1);
            }
        });

        const buttons = document.querySelectorAll('button');
        // Loop through each button and attach the event listener
        buttons.forEach(function(button) {
            button.addEventListener('mouseenter', function()
                {
                    const audio = new Audio(constants.assets.SOUND_MENU_HOVER);  // Create a new audio object
                    audio.play();  // Play the new audio object
                });

            button.addEventListener('click', function()
                {
                    const audio = new Audio(constants.assets.SOUND_CLICK);  // Create a new audio object
                    audio.play();  // Play the new audio object
                });
        });
    });



function getCounterContainerColumnIndexFromXOffset(xOffset)
{
    //TODO: Cache this somewhere, this will be done on every mouse move I don't want to search that often
    const counter_container = document.querySelector(constants.game_selector.COUNTER_CONTAINER);
    const counter_container_style = getComputedStyle(counter_container);

    const column_gap = parseInt(counter_container_style["column-gap"]);
    const padding_left = parseInt(counter_container_style["padding-left"]);
    let column_size;
    // TODO: Query the counter container for the column size instead. This is a hacky solution.
    if (window.innerWidth > constants.css_breakpoints.BREAKPOINT_BOARD)
        column_size = 64;
    else
        column_size = 34;

    const column_index = parseInt(Math.max(xOffset - padding_left,0) / (column_size + column_gap) + 1);
    return column_index - 1;
}





