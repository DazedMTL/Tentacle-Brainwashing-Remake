//=============================================================================
// NovelGameBasicSystem.js
// Copyright (c) 2020- 村人Ａ
//=============================================================================

/*:ja
 * @target MV
 * @plugindesc ノベルゲームのような機能を提供するプラグイン
 * @author 村人Ａ
 *
 * @help
 * ＊このプラグインはかぐらみずき様専用に作られたプラグインです。
 * ＊その他の方の無断の使用を禁止します。
 * ＊上記注意書きの名前はサークル名などに変更してください。この注意書きは削除して
 * 　ください。
 *
 * _/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
 *
 * バージョン情報
 *
 * 21/01/07 ver1.03リリース
 *          ノベルメニューを呼び出した後にコモンイベントとプラグインコマンドは実行しないよう修正
 *          ログが最大になった際に細心のログが削除されてしまう不具合を修正
 * 20/12/21 ver1.02リリース
 *          メニュープラグインを呼び出すコモンイベント以外を呼び出すと発生する不具合修正
 * 20/11/26 ver1.01リリース
 *          メッセージ中にメニューを開いた際にログが再記録されてしまう不具合修正
 * 20/11/25 ver1.0リリース
 *          不具合修正
 * 20/11/23 試作品リリース
 *
 * _/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
 *
 * ヘルプ
 *
 * ・ログに保存するメッセージは指定したスイッチをONにした時のみとなります。
 * プラグインパラメータ「ログメッセージ保存スイッチID」にて指定してください。
 *
 * ・メッセージを上限なくログとして保存した場合、クラッシュや動作が重くなる原因と
 * なりますので上限が作られています。
 * プラグインパラメータ「ログの上限数」にて指定してください。
 *
 * ・オートメッセージ、既読スキップは融通が利くようにするため、ゲームスイッチにて
 * 有効になるようにしました。
 * プラグインパラメータ「オートメッセージスイッチID」「既読スキップスイッチID」に
 * てスイッチのIDを指定してください。
 * ノベルメニューにてON/OFFにするとスイッチもON/OFFとなります。
 *
 * ・オートメッセージの進む速度は変数にて指定します。
 * プラグインパラメータ「オートメッセージの速度に使用する変数ID」にて指定した数値
 * のフレーム数でメッセージが進みます。
 *
 * ・既読メッセージスキップは「UTA_MessageSkip.js」の機能を借りていますので、この
 * プラグインを使用する際はUTA_MessageSkipを有効にするようにしてください。
 *
 *
 *
 *
 *
 * @param maxMessageLogNum
 * @text ログの上限数
 * @desc ログとして保存するメッセージの最大の数を指定します。
 * @default 30
 *
 * @param saveMessageLogSwitchId
 * @text ログメッセージ保存スイッチID
 * @desc ログとしてメッセージを保存する時のスイッチIDを指定します。このスイッチがONの時にメッセージが表示された際にログとして保存します。
 * @default 1
 * @type switch
 *
 * @param autoMessageSwitchID
 * @text オートメッセージスイッチID
 * @desc オートメッセージにする際にONにするスイッチのIDを指定します。
 * @default 2
 * @type switch
 *
 * @param skipReadMessageSwitchID
 * @text 既読スキップスイッチID
 * @desc 既読メッセージスキップする際にONにするスイッチのIDを指定します。
 * @default 3
 * @type switch
 *
 */

{
  ("use strict");

  String.prototype.toNumArray = function () {
    return this.split(",").map((str) => Number(str));
  };

  const param = PluginManager.parameters("NovelGameBasicSystem");
  const maxMessageLogNum = Number(param.maxMessageLogNum);
  const saveMessageLogSwitchId = Number(param.saveMessageLogSwitchId);
  const autoMessageSwitchID = Number(param.autoMessageSwitchID);
  const skipReadMessageSwitchID = Number(param.skipReadMessageSwitchID);

  //-----------------------------------------------------------------------------
  // Game_Message
  //

  const _alias_Game_Message_initialize = Game_Message.prototype.initialize;
  Game_Message.prototype.initialize = function () {
    _alias_Game_Message_initialize.call(this);
    this.messageLog = [];
    this.readMessageHash = {};
    this.canUTASkip = false;
  };

  Game_Message.prototype.withCommand101 = function (m, e, p, i) {
    this.saveMessageLog();
    this.saveReadMessageData(m, e, p, i);
  };

  Game_Message.prototype.saveMessageLog = function () {
    if (!$gameSwitches.value(saveMessageLogSwitchId)) {
      return;
    }
    this.messageLog.push(this._texts);
    if (this.messageLog.length > maxMessageLogNum) {
      this.messageLog.shift();
    }
  };

  Game_Message.prototype.saveReadMessageData = function (m, e, p, i) {
    const num = this.readMessageHash[[m, e, p]];
    const isAdd = !num || num < i;
    this.canUTASkip = !isAdd;
    if (isAdd) {
      this.readMessageHash[[m, e, p]] = i;
    }
  };

  if (typeof utakata !== "undefined" && utakata.MessageSkip) {
    const uTAparam = PluginManager.parameters("UTA_MessageSkip");
    const skipKey = String(uTAparam["Skip Key"]) || null;
    utakata.MessageSkip.isPressedMsgSkipButton = function () {
      if ($gameSwitches.value(skipReadMessageSwitchID)) {
        return $gameMessage.canUTASkip || Input.isPressed(skipKey);
      }
      return Input.isPressed(skipKey);
    };
  } else {
    console.log(
      "既読メッセージスキップを有効にする場合はUTA_MessageSkipを有効にしてください。"
    );
  }

  //-----------------------------------------------------------------------------
  // Game_Interpreter
  //

  const _alias_Game_Interpreter_pluginCommand =
    Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function (command, args) {
    _alias_Game_Interpreter_pluginCommand.call(this, command, args);
    if (command == "ノベルゲームメニュー") {
      SceneManager._scene._messageWindow.onEndOfText();
      $gameMessage.clear();
      if (SceneManager._scene._messageWindow.isOpen()) {
        $gameMessage.nVLinstantOpen = true;
      }
      SceneManager.snapForBackground();
      SceneManager.push(Scene_NovelMenu);
    }
  };

  // Show Text
  const _alias_Game_Interpreter_command101 =
    Game_Interpreter.prototype.command101;
  Game_Interpreter.prototype.command101 = function () {
    _alias_Game_Interpreter_command101.call(this);

    const gEvent = $gameMap.event(this._eventId);
    if (gEvent && !$gameMessage.nVLinstantOpen) {
      $gameMessage.withCommand101(
        this._mapId,
        this._eventId,
        gEvent._pageIndex,
        this._index
      );
    }
    return false;
  };

  Game_Interpreter.prototype.repreatPreCommond = function () {
    this._index = this._preIndex;
  };

  const _alias_Game_Interpreter_executeCommand =
    Game_Interpreter.prototype.executeCommand;
  Game_Interpreter.prototype.executeCommand = function () {
    if (
      this.isBackFromNovelMenu &&
      ![117, 356].includes(this._list[this._preIndex].code)
    ) {
      this.repreatPreCommond();
    }
    this.isBackFromNovelMenu = false;
    this._preIndex = this._index;
    return _alias_Game_Interpreter_executeCommand.call(this);
  };

  //-----------------------------------------------------------------------------
  // Scene_NovelMenu
  //

  function Scene_NovelMenu() {
    this.initialize.apply(this, arguments);
  }

  Scene_NovelMenu.prototype = Object.create(Scene_Base.prototype);
  Scene_NovelMenu.prototype.constructor = Scene_NovelMenu;

  Scene_NovelMenu.prototype.initialize = function () {
    Scene_Base.prototype.initialize.call(this);
    this.createBackground();
    this.createWindowLayer();
    this.createCommandWindow();
    if ($gameMap._interpreter._list != null) {
      $gameMap._interpreter.isBackFromNovelMenu = true;
    }
  };

  Scene_NovelMenu.prototype.createBackground = function () {
    this._backgroundSprite = new Sprite();
    this._backgroundSprite.bitmap = SceneManager.backgroundBitmap();
    this.addChild(this._backgroundSprite);
  };

  Scene_NovelMenu.prototype.createCommandWindow = function () {
    this._commandWindow = new Window_NovelMenuCommand();
    this._commandWindow.setHandler("save", this.commandSave.bind(this));
    this._commandWindow.setHandler("load", this.commandLoad.bind(this));
    this._commandWindow.setHandler("options", this.commandOptions.bind(this));
    this._commandWindow.setHandler("auto", this.commandAuto.bind(this));
    this._commandWindow.setHandler("log", this.commandLog.bind(this));
    this._commandWindow.setHandler(
      "backTitle",
      this.commandbackTitle.bind(this)
    );
    this._commandWindow.setHandler("gameExit", this.commandGameExit.bind(this));
    this._commandWindow.setHandler("cancel", this.popScene.bind(this));
    this.addWindow(this._commandWindow);
  };

  Scene_NovelMenu.prototype.commandCancel = function () {
    SceneManager.pop();
  };

  Scene_NovelMenu.prototype.commandSave = function () {
    SceneManager.push(Scene_Save);
  };

  Scene_NovelMenu.prototype.commandLoad = function () {
    SceneManager.push(Scene_Load);
  };

  Scene_NovelMenu.prototype.commandOptions = function () {
    SceneManager.push(Scene_Options);
  };

  Scene_NovelMenu.prototype.commandAuto = function () {
    SoundManager.playOk();
    $gameSwitches.setValue(
      autoMessageSwitchID,
      !$gameSwitches.value(autoMessageSwitchID)
    );
    this._commandWindow.refresh();
    this._commandWindow.activate();
  };

  Scene_NovelMenu.prototype.commandLog = function () {
    SceneManager.push(Scene_MessageLog);
  };

  Scene_NovelMenu.prototype.commandbackTitle = function () {
    SceneManager.push(Scene_GameEnd);
  };

  Scene_NovelMenu.prototype.commandGameExit = function () {
    SceneManager.push(Scene_GameExit);
  };

  //-----------------------------------------------------------------------------
  // Scene_MessageLog
  //

  function Scene_MessageLog() {
    this.initialize.apply(this, arguments);
  }

  Scene_MessageLog.prototype = Object.create(Scene_Base.prototype);
  Scene_MessageLog.prototype.constructor = Scene_MessageLog;

  Scene_MessageLog.prototype.initialize = function () {
    Scene_Base.prototype.initialize.call(this);
    this.createWindowLayer();
    this.createLogWindow();
  };

  Scene_MessageLog.prototype.createLogWindow = function () {
    this.logWindow = new Window_MessageLog();
    this.addWindow(this.logWindow);
  };

  //-----------------------------------------------------------------------------
  // Window_MessageLog
  //

  function Window_MessageLog() {
    this.initialize.apply(this, arguments);
  }

  Window_MessageLog.prototype = Object.create(Window_Base.prototype);
  Window_MessageLog.prototype.constructor = Window_MessageLog;

  Window_MessageLog.prototype.initialize = function () {
    Window_Base.prototype.initialize.call(
      this,
      0,
      0,
      Graphics.width,
      Graphics.height
    );
    this.maxLine = Math.floor(this.contents.height / this.lineHeight()) + 1;
    this.sumTextlineNum = 0;
    $gameMessage.messageLog.forEach((textArr) => {
      this.sumTextlineNum += textArr.length + 1;
    });
    this._index = -(this.sumTextlineNum - this.maxLine);
    this.refresh();
  };

  Window_MessageLog.prototype.refresh = function () {
    this.drawMessageLog();
  };

  Window_MessageLog.prototype.drawMessageLog = function () {
    this.contents.clear();
    let lineNum = this._index;
    $gameMessage.messageLog.forEach((textArr) => {
      const y = lineNum * this.lineHeight();
      this.drawTextEx(textArr.join("\n"), 0, y);
      lineNum += textArr.length + 1;
    });
  };

  Window_MessageLog.prototype.update = function () {
    Window_Base.prototype.update.call(this);
    this.processInputKeys();
    this.processWheel();
  };

  Window_MessageLog.prototype.processInputKeys = function () {
    if (TouchInput.isCancelled()) {
      SoundManager.playCancel();
      SceneManager.pop();
    }
    if (Input.isTriggered("cancel")) {
      SoundManager.playCancel();
      SceneManager.pop();
    }
    if (Input.isTriggered("down")) {
      this.processTextsDown();
    }
    if (Input.isRepeated("down")) {
      this.processTextsDown();
    }
    if (Input.isTriggered("up")) {
      this.processTextsUp();
    }
    if (Input.isRepeated("up")) {
      this.processTextsUp();
    }
  };

  Window_MessageLog.prototype.processTextsDown = function () {
    if (-this._index > this.sumTextlineNum - this.maxLine - 1) {
      return;
    }
    this._index--;
    this.refresh();
  };

  Window_MessageLog.prototype.processTextsUp = function () {
    if (this._index == 0) {
      return;
    }
    this._index++;
    this.refresh();
  };

  Window_MessageLog.prototype.processWheel = function () {
    const threshold = 20;
    if (TouchInput.wheelY >= threshold) {
      this.processTextsDown();
    }
    if (TouchInput.wheelY <= -threshold) {
      this.processTextsUp();
    }
  };

  //-----------------------------------------------------------------------------
  // Window_Message
  //

  const _alias_Window_Message_initialize = Window_Message.prototype.initialize;
  Window_Message.prototype.initialize = function () {
    _alias_Window_Message_initialize.call(this);
  };

  const _alias_Window_Message_open = Window_Message.prototype.open;
  Window_Message.prototype.open = function () {
    if ($gameMessage.nVLinstantOpen) {
      this.openness = 255;
      $gameMessage.nVLinstantOpen = false;
    } else {
      _alias_Window_Message_open.call(this);
    }
  };

  //-----------------------------------------------------------------------------
  // Scene_GameExit
  //

  function Scene_GameExit() {
    this.initialize.apply(this, arguments);
  }

  Scene_GameExit.prototype = Object.create(Scene_GameEnd.prototype);
  Scene_GameExit.prototype.constructor = Scene_GameExit;

  Scene_GameExit.prototype.createCommandWindow = function () {
    this._commandWindow = new Window_GameExit();
    this._commandWindow.setHandler("gameEnd", this.commandGameExit.bind(this));
    this._commandWindow.setHandler("cancel", this.popScene.bind(this));
    this.addWindow(this._commandWindow);
  };

  Scene_GameExit.prototype.commandGameExit = function () {
    SceneManager.exit();
  };

  //-----------------------------------------------------------------------------
  // Window_GameExit
  //

  function Window_GameExit() {
    this.initialize.apply(this, arguments);
  }

  Window_GameExit.prototype = Object.create(Window_GameEnd.prototype);
  Window_GameExit.prototype.constructor = Window_GameExit;

  Window_GameExit.prototype.makeCommandList = function () {
    this.addCommand("ゲーム終了", "gameEnd");
    this.addCommand(TextManager.cancel, "cancel");
  };

  //-----------------------------------------------------------------------------
  // Window_NovelMenuCommand
  //

  function Window_NovelMenuCommand() {
    this.initialize.apply(this, arguments);
  }

  Window_NovelMenuCommand.prototype = Object.create(
    Window_MenuCommand.prototype
  );
  Window_NovelMenuCommand.prototype.constructor = Window_NovelMenuCommand;

  Window_NovelMenuCommand.prototype.initialize = function () {
    Window_MenuCommand.prototype.initialize.call(this, 0, 0);
    this.x = (Graphics.width - this.width) / 2;
    this.y = (Graphics.height - this.height) / 2;
  };

  Window_NovelMenuCommand.prototype.addMainCommands = function () {
    const autoText = $gameSwitches.value(autoMessageSwitchID)
      ? "Skip Read ON"
      : "Skip Read OFF";
    const skipText = $gameSwitches.value(skipReadMessageSwitchID)
      ? "Skip Read ON"
      : "Skip Read OFF";
    this.addCommand(TextManager.save, "save", this.isSaveEnabled());
    this.addCommand("Load", "load", true);
    this.addCommand(TextManager.options, "options", true);
    this.addCommand(autoText, "auto", true);
    this.addCommand("Log", "log", true);
    this.addCommand("To Title", "backTitle", true);
    this.addCommand("Quit Game", "gameExit", true);
  };

  Window_NovelMenuCommand.prototype.addFormationCommand = function () {};

  Window_NovelMenuCommand.prototype.addOriginalCommands = function () {};

  Window_NovelMenuCommand.prototype.addOptionsCommand = function () {};

  Window_NovelMenuCommand.prototype.addSaveCommand = function () {};

  Window_NovelMenuCommand.prototype.addGameEndCommand = function () {};
}
