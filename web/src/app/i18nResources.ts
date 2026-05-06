export const resources = {
  ru: {
    translation: {
      app: {
        title: "Skyline Arcade"
      },
      common: {
        back: "Назад",
        menu: "В меню",
        restart: "Рестарт",
        retry: "Повторить",
        playAgain: "Играть заново",
        play: "Играть",
        soundOn: "Вкл",
        soundOff: "Выкл",
        language: "Язык",
        save: "Сохранить"
      },
      menu: {
        chooseGame: "Выберите игру.",
        playGame: "Играть: {{title}}",
        sound: "Звук: {{state}}",
        levelBuilder: "Конструктор уровней: City Runner",
        campaign: "Кампания: City Runner"
      },
      game: {
        score: "Счет",
        sound: "Звук: {{state}}",
        exitToMenu: "В меню",
        defeatStatus: "Поражение. Можно сохранить результат.",
        victoryStatus: "Финиш! Уровень пройден."
      },
      leaderboard: {
        title: "Таблица рекордов",
        empty: "Пока нет результатов",
        name: "Имя",
        namePlaceholder: "Ваше имя",
        saveScore: "Сохранить результат",
        enterName: "Введите имя.",
        finishFirst: "Сначала завершите игру.",
        saved: "Результат сохранен!",
        savedOffline: "Результат сохранен локально (офлайн).",
        loadFailed: "Не удалось загрузить таблицу рекордов."
      },
      controls: {
        title: "Управление",
        keyboard: "Клавиатура",
        mobile: "Мобильные кнопки",
        dpad: "D-pad"
      },
      levelBuilder: {
        title: "Конструктор уровней City Runner",
        hint: "События спавнятся по времени в секундах. Чем больше время — тем позже появится объект.",
        play: "Играть уровень",
        levelTitle: "Название уровня",
        levelTitlePlaceholder: "Мой уровень",
        finishSec: "Финиш (сек)",
        checkpoints: "Чекпоинты (сек, через запятую)",
        json: "JSON для импорта/экспорта",
        export: "Экспорт JSON",
        import: "Импорт JSON",
        events: "События",
        add: {
          pipe: "+ Труба",
          flower: "+ Ромашка",
          brick: "+ Кирпич",
          potato: "+ Картошка",
          bee: "+ Пчела",
          fly: "+ Муха",
          starInv: "+ Звезда (инвул)",
          starJump: "+ Звезда (прыжок)"
        },
        timeSec: "время (сек)",
        type: "тип",
        remove: "Удалить",
        empty: "Пока пусто — добавь события кнопками сверху.",
        auto: "авто"
      },
      games: {
        titles: {
          "dodge-cubes": "Уворачивайся от кубов",
          "city-runner": "Сити-раннер",
          "car-ride": "Автопоездка",
          worms: "Червячки"
        },
        hints: {
          "dodge-cubes": "Двигайся WASD или стрелками. Продержись как можно дольше.",
          "city-runner": "Автобег. Прыжок: Up/W/Space, присесть: Down/S. Бей пчел и мух снизу, ломай кирпичи, собирай звезды.",
          "car-ride": "Разгоняйся Up и рули Left/Right. Избегай всех препятствий на дороге.",
          worms: "Ешь яблоки, расти и стань самым большим червем на карте."
        }
      }
    }
  },
  en: {
    translation: {
      app: { title: "Skyline Arcade" },
      common: {
        back: "Back",
        menu: "Menu",
        restart: "Restart",
        retry: "Retry",
        playAgain: "Play again",
        play: "Play",
        soundOn: "On",
        soundOff: "Off",
        language: "Language",
        save: "Save"
      },
      menu: {
        chooseGame: "Choose a game.",
        playGame: "Play: {{title}}",
        sound: "Sound: {{state}}",
        levelBuilder: "Level Builder: City Runner",
        campaign: "Campaign: City Runner"
      },
      game: {
        score: "Score",
        sound: "Sound: {{state}}",
        exitToMenu: "Exit to menu",
        defeatStatus: "Defeat. You can save your score.",
        victoryStatus: "Finish! Level completed."
      },
      leaderboard: {
        title: "Leaderboard",
        empty: "No scores yet",
        name: "Name",
        namePlaceholder: "Your name",
        saveScore: "Save score",
        enterName: "Enter your name.",
        finishFirst: "Finish the run first.",
        saved: "Score saved!",
        savedOffline: "Score saved locally (offline).",
        loadFailed: "Failed to load leaderboard."
      },
      controls: {
        title: "Controls",
        keyboard: "Keyboard",
        mobile: "Mobile buttons",
        dpad: "D-pad"
      },
      levelBuilder: {
        title: "City Runner Level Builder",
        hint: "Events spawn by time in seconds. Bigger time = later spawn.",
        play: "Play level",
        levelTitle: "Level title",
        levelTitlePlaceholder: "My level",
        finishSec: "Finish (sec)",
        checkpoints: "Checkpoints (sec, comma-separated)",
        json: "JSON import/export",
        export: "Export JSON",
        import: "Import JSON",
        events: "Events",
        add: {
          pipe: "+ Pipe",
          flower: "+ Flower",
          brick: "+ Brick",
          potato: "+ Potato",
          bee: "+ Bee",
          fly: "+ Fly",
          starInv: "+ Star (inv)",
          starJump: "+ Star (jump)"
        },
        timeSec: "time (sec)",
        type: "type",
        remove: "Remove",
        empty: "Empty—add events using buttons above.",
        auto: "auto"
      },
      games: {
        titles: {
          "dodge-cubes": "Dodge Cubes",
          "city-runner": "City Runner",
          "car-ride": "Car Ride",
          worms: "Worms"
        },
        hints: {
          "dodge-cubes": "Move with WASD or arrows. Survive as long as possible.",
          "city-runner": "Auto-run. Jump: Up/W/Space, crouch: Down/S. Hit bees/flies from below, break bricks, collect stars.",
          "car-ride": "Accelerate with Up and steer Left/Right. Avoid all obstacles.",
          worms: "Eat apples, grow, and become the biggest worm."
        }
      }
    }
  }
} as const;

