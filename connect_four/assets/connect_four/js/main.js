const constants =
    {
        game_constraints:
        {
            TURN_LENGTH:30,
        },
        game_state:
        {
            IN_MENU: 0,
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
            RESTART_BUTTON: ".game-menu .board-restart-button",
            COUNTER_CONTAINER: ".counter-container",
            MARKER: ".marker",
            TURN_COUNTER: ".turn-counter",
            TURN_COUNTER_PLAYER_LABEL: ".player-turn-label",
            TURN_COUNTER_TIMER_VALUE: ".timer-value",
        },
        player_turn_messages:
        {
            PLAYER_1_TURN: "PLAYER 1's TURN",
            PLAYER_2_TURN: "PLAYER 2's TURN",
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
            this.#current_scene = document.querySelector(constants.scene_selector.MAIN_MENU);
        }
        else
        {
            document.addEventListener('DOMContentLoaded', function() 
                {
                    this.#current_scene = document.querySelector(constants.scene_selector.MAIN_MENU);
                }.bind(this));
        }
    }

    switchScene(scene_class)
    {
        this.#current_scene.style.display='none';
        this.#current_scene = document.querySelector(scene_class);
        this.#current_scene.style.display='block';

    }
}

class BoardStateManager
{
    #board_state_buffer = null;
    #board_state = null;
    constructor()
    {
        this.#board_state_buffer = new ArrayBuffer(constants.board_constraints.MAX_ROWS * constants.board_constraints.MAX_COLUMNS);
        this.#board_state = new Int8Array(this.#board_state_buffer);
    }

    //Places the counter at the specified column position or returns -1 if it cannot.
    // Uses the grid coordinates.
    placeCounter(column_index, player_enum)
    {
        for (let row_index = constants.board_constraints.MAX_ROWS - 1; row_index >= 0; row_index--) {
            if(this.#board_state[(row_index * constants.board_constraints.MAX_COLUMNS) + column_index] == 0)
            {
                this.#board_state[(row_index * constants.board_constraints.MAX_COLUMNS) + column_index] = player_enum;
                return 0;
            }
        }
        return -1;
    }

    //Checks for win condition around a specified coordinate
    //Returns:
    //-1 if nobody won or
    //const.player.PLAYER1 or const.player.PLAYER2 if a player did win
    checkWinCondition(rowIndex,columnIndex,playerEnum)
    {
        // Explore all possible directions around this coordinate

        //Vertical
        //Horizontal
        //Diagonal-left
        //Diagonal-right

        //And then start from the closest boundary in one direction and work your way towards
        //the other boundary. And simply count + 1 for every subsequent counter your come
        //accross. When you get to a different counter or space, reset the counter to 0.
        //If you get to the end without having returned you can return -1.

    }

    get_board_state_view()
    {
        return this.#board_state;
    }
}

// Define the game controls
// I want to mouse over the game board and detect what column I'm touching. Then when I click anywhere on the screen
// I want to place a counter.

class Game
{
    //Defining the singleton here is unnecessary but I did for convenience, since my lsp gets confused if I don't.
    static s_instance = new Game();

    scene_manager = new SceneManager();
    board_state_manager = new BoardStateManager();

    game_state = constants.game_state.IN_MENU;

    //Timestamp of the start of the current turn
    turn_timestamp = null;
    //Interval id for timer
    timerIntervalID = null;

    player1_wins = 0;
    player2_wins = 0;

    //DOM elements references
    marker_element = null;
    counter_container = null;
    turn_counter_element = null;
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
        }
        else
        {
            document.addEventListener('DOMContentLoaded', function() 
                {
                    this.marker_element = document.querySelector(constants.game_selector.MARKER);
                    this.counter_container = document.querySelector(constants.game_selector.COUNTER_CONTAINER);
                    this.turn_counter_element = document.querySelector(constants.game_selector.TURN_COUNTER);
                    this.timer_value_element = document.querySelector(constants.game_selector.TURN_COUNTER_TIMER_VALUE);
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
        const turn_time_delta = parseInt((Date.now() - Game.the().turn_timestamp) / 1000);
        const time_left = (constants.game_constraints.TURN_LENGTH - turn_time_delta);

        console.log("Time left: " + time_left);
        if (time_left < 0)
        {
            console.log("GAME OVER!");
            Game.the().game_over();
        }

        // UI update with this time left
        Game.the().timer_value_element.innerText = `${time_left}s`;
    }

    game_over(winner_player_enum)
    {
        this.game_state = constants.game_state.GAME_OVER

        if(winner_player_enum == constants.player.PLAYER1)
            this.player1_wins++;
        else
            this.player2_wins++;

        //Update UI accordingly
        //TODO: Update UI on a win.
        //Update the w
    }

    switchScene(scene_class)
    {
        this.scene_manager.switchScene(scene_class);

        if(scene_class == constants.scene_selector.GAME)
        {
            this.initializeGame();
        }
    }
    initializeGame()
    {
        console.log("initializing game")
        this.turn_timestamp = Date.now();
        this.timerIntervalID = setInterval(Game.updateClock, 1000);

        //Delaying a bit since if not, clicking the button to start the game
        //Will place a counter. This function happens to run before the click event on the document
        setTimeout(function () {
            Game.the().game_state = constants.game_state.PLAYER_1_MOVE;

        }, 1000);
    }
    quitGame()
    {
        document.removeEventListener('click', handleGameClick);
    }
    
    placeCounter(col_index)
    {
        if(this.game_state == constants.game_state.IN_MENU || this.game_state == constants.game_state.GAME_OVER)
            return -1;
    
        const player_enum = this.game_state == constants.game_state.PLAYER_1_MOVE ?
            constants.player.PLAYER1 : constants.player.PLAYER2;

        const success = this.board_state_manager.placeCounter(col_index,player_enum);
        if(success == -1)
        {
            return -1;
        }

        //Switch to other player's turn
        this.game_state = this.game_state == constants.game_state.PLAYER_1_MOVE ?
            constants.player.PLAYER2 : constants.player.PLAYER1;

        this.turn_timestamp = Date.now();
        Game.updateClock();// Force an update otherwise UI lags for however long it takes for the next second to pass.

        //Keep the UI in sync with state
        this.updateBoardUI();
        this.updateMarkerClass();
        this.updateTurnCounterLook();
    }

    //Aesthetic changes
    // Question: Should this be its own manager? Like the UI manager or something? Probably not
    // Function that updates the board aesthetically with what's in the board state
    updateBoardUI()
    {
        const board_view = this.board_state_manager.get_board_state_view();
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


    updateMarkerClass()
    {
        if (this.game_state == constants.game_state.PLAYER_1_MOVE)
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

    updateTurnCounterLook()
    {
        const player_turn_label = this.turn_counter_element.querySelector(constants.game_selector.TURN_COUNTER_PLAYER_LABEL);
        if (this.game_state == constants.game_state.PLAYER_1_MOVE)
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

document.addEventListener('DOMContentLoaded', function() 
    {
        // Attach Button handlers
        const main_menu_game_rules_button = document.querySelector(constants.main_menu_selector.RULES_BUTTON);
        main_menu_game_rules_button.addEventListener('click',function()
            {
                Game.the().switchScene(constants.scene_selector.RULES);
            });

        const rules_back_button = document.querySelector(constants.rules_selector.BACK_BUTTON);
        rules_back_button.addEventListener('click',function()
            {
                Game.the().switchScene(constants.scene_selector.MAIN_MENU);
            });
        const game_start_button = document.querySelector(constants.main_menu_selector.GAME_START_BUTTON);
        game_start_button.addEventListener('click',function()
            {
                Game.the().switchScene(constants.scene_selector.GAME);
            });


        const game_menu_button = document.querySelector(constants.game_selector.MENU_BUTTON);
        game_menu_button.addEventListener('click',function()
            {
                Game.the().switchScene(constants.scene_selector.MAIN_MENU);
            });

        const game_restart_button = document.querySelector(constants.game_selector.RESTART_BUTTON);
        game_restart_button.addEventListener('click',function()
            {
                console.log("Restart button clicked");
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
            if(Game.the().game_state == constants.game_state.GAME_OVER || constants.game_state.IN_MENU)
            {
                return;
            }
            const counter_container = document.querySelector(constants.game_selector.COUNTER_CONTAINER);
            const rect = counter_container.getBoundingClientRect();

            if (event.clientX >= rect.x && event.clientX <= (rect.x + rect.width)) {
                const xOffset = event.clientX - rect.x;
                const col_index = getCounterContainerColumnIndexFromXOffset(xOffset)
                Game.the().placeCounter(col_index,constants.player.PLAYER1);
            }
        });
    });



function getCounterContainerColumnIndexFromXOffset(xOffset)
{
    //TODO: Cache this somewhere, this will be done on every mouse move I don't want to search that often
    const counter_container = document.querySelector(constants.game_selector.COUNTER_CONTAINER);
    const counter_container_style = getComputedStyle(counter_container);
    const column_gap = parseInt(counter_container_style["column-gap"]);
    const padding_left = parseInt(counter_container_style["padding-left"]);
    //TODO: don't hardcode it, discover it. Challenge is the property that has this has a different value for each column.
    const column_size = 64;
    const column_index = parseInt(Math.max(xOffset - padding_left,0) / (column_size + column_gap) + 1);
    return column_index - 1;
}
//You'd think the logic for tha twould be related to the column width and the column gap?
//I want to be able to read the column width of the counter container and the gap.

