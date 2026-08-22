const DEBUG_SETTINGS = {
  "use_debug": false,
  "show_keyboard_without_connection": false,
  "can_toggle_without_connection": true,
  "show_macro_pads": ["voiceover-keyboard", "iphone-basic"],
  "show_debug_colours": false,
  "show_cheatsheet": false,
  "show_cheatsheet_press": false,
}

const debugActionScriptData = JSON.parse(`
    {
      "config" : {
        "name" : "Unlock",
        "description" : "Test json for phone unlock",
        "options" : {
          "Jack" : { "code" : "314159", "wait" : "2000" },
          "Jill" : { "code" : "951413", "wait" : "5000" }
        }
      },
      "script" : [
        { "press" : { "literal" : "HID_KEY_APPLICATION"} },
        { "delay" : { "parameter" : "wait" } },
        { "press" : { "literal" : "HID_KEY_APPLICATION" } },
        { "delay" : { "parameter" : "wait" } },
        { "type"  : { "parameter" : "code" } },
        { "delay" : { "parameter" : "wait" } },
        { "press" : { "literal" : "HID_KEY_RETURN" } }
      ]
    }`);

    const debugActionScriptData2 = JSON.parse(`
        {
          "config" : {
            "name" : "Android Accessibility Shortcut Android",
            "description" : "Test json for Android phone ally shortcut"            
          },
          "script" : [
            { "press" : {"literal" : "HID_KEY_CONTROL_LEFT,HID_KEY_ALT_LEFT,HID_KEY_Z"} }
          ]
        }`);