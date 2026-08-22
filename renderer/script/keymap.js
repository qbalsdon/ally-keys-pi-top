// https://usb.org/sites/default/files/hut1_21.pdf
// https://github.com/adafruit/Adafruit_nRF52_Arduino/blob/200b3aaefb3256ac26df82ebc9b5b58923d9c37c/cores/nRF5/Adafruit_TinyUSB_Core/tinyusb/src/class/hid/hid.h#L213

const EMPTY_KEY = '0x0000';

const userMods = new Map();
userMods.set('VOICEOVER', ['hHID_KEY_CONTROL_LEFT', 'hHID_KEY_ALT_LEFT']);
userMods.set('TALKBACK', ['hHID_KEY_ALT_LEFT']);

const keyMap = new Map();
keyMap.set('HID_KEY_A', '0x0004');
keyMap.set('HID_KEY_B', '0x0005');
keyMap.set('HID_KEY_C', '0x0006');
keyMap.set('HID_KEY_D', '0x0007');
keyMap.set('HID_KEY_E', '0x0008');
keyMap.set('HID_KEY_F', '0x0009');
keyMap.set('HID_KEY_G', '0x000A');
keyMap.set('HID_KEY_H', '0x000B');
keyMap.set('HID_KEY_I', '0x000C');
keyMap.set('HID_KEY_J', '0x000D');
keyMap.set('HID_KEY_K', '0x000E');
keyMap.set('HID_KEY_L', '0x000F');
keyMap.set('HID_KEY_M', '0x0010');
keyMap.set('HID_KEY_N', '0x0011');
keyMap.set('HID_KEY_O', '0x0012');
keyMap.set('HID_KEY_P', '0x0013');
keyMap.set('HID_KEY_Q', '0x0014');
keyMap.set('HID_KEY_R', '0x0015');
keyMap.set('HID_KEY_S', '0x0016');
keyMap.set('HID_KEY_T', '0x0017');
keyMap.set('HID_KEY_U', '0x0018');
keyMap.set('HID_KEY_V', '0x0019');
keyMap.set('HID_KEY_W', '0x001A');
keyMap.set('HID_KEY_X', '0x001B');
keyMap.set('HID_KEY_Y', '0x001C');
keyMap.set('HID_KEY_Z', '0x001D');
keyMap.set('HID_KEY_1', '0x001E');
keyMap.set('HID_KEY_2', '0x001F');
keyMap.set('HID_KEY_3', '0x0020');
keyMap.set('HID_KEY_4', '0x0021');
keyMap.set('HID_KEY_5', '0x0022');
keyMap.set('HID_KEY_6', '0x0023');
keyMap.set('HID_KEY_7', '0x0024');
keyMap.set('HID_KEY_8', '0x0025');
keyMap.set('HID_KEY_9', '0x0026');
keyMap.set('HID_KEY_0', '0x0027');
keyMap.set('HID_KEY_RETURN', '0x0028');
keyMap.set('HID_KEY_ENTER', '0x0028');
keyMap.set('HID_KEY_ESCAPE', '0x0029');
keyMap.set('HID_KEY_BACKSPACE', '0x002A');
keyMap.set('HID_KEY_TAB', '0x002B');
keyMap.set('HID_KEY_SPACE', '0x002C');
keyMap.set('HID_KEY_MINUS', '0x002D');
keyMap.set('HID_KEY_EQUAL', '0x002E');
keyMap.set('HID_KEY_BRACKET_LEFT', '0x002F');
keyMap.set('HID_KEY_BRACKET_RIGHT', '0x0030');
keyMap.set('HID_KEY_BACKSLASH', '0x0031'); 
keyMap.set('HID_KEY_EUROPE_1', '0x0032'); // Unsure what purpose this is
keyMap.set('HID_KEY_SEMICOLON', '0x0033');
keyMap.set('HID_KEY_APOSTROPHE', '0x0034');
keyMap.set('HID_KEY_GRAVE', '0x0035'); // originally 0x0035
keyMap.set('HID_KEY_COMMA', '0x0036');
keyMap.set('HID_KEY_PERIOD', '0x0037');
keyMap.set('HID_KEY_SLASH', '0x0038');
keyMap.set('HID_KEY_CAPS_LOCK', '0x0039');
keyMap.set('HID_KEY_F1', '0x003A');
keyMap.set('HID_KEY_F2', '0x003B');
keyMap.set('HID_KEY_F3', '0x003C');
keyMap.set('HID_KEY_F4', '0x003D');
keyMap.set('HID_KEY_F5', '0x003E');
keyMap.set('HID_KEY_F6', '0x003F');
keyMap.set('HID_KEY_F7', '0x0040');
keyMap.set('HID_KEY_F8', '0x0041');
keyMap.set('HID_KEY_F9', '0x0042');
keyMap.set('HID_KEY_F10', '0x0043');
keyMap.set('HID_KEY_F11', '0x0044');
keyMap.set('HID_KEY_F12', '0x0045');
keyMap.set('HID_KEY_PRINT_SCREEN', '0x0046'); // take screenshot
keyMap.set('HID_KEY_SCROLL_LOCK', '0x0047'); // android: nothing
keyMap.set('HID_KEY_PAUSE', '0x0048'); // not working
keyMap.set('HID_KEY_INSERT', '0x0049');
keyMap.set('HID_KEY_HOME', '0x004A');
keyMap.set('HID_KEY_PAGE_UP', '0x004B');
keyMap.set('HID_KEY_DELETE', '0x004C');
keyMap.set('HID_KEY_END', '0x004D');
keyMap.set('HID_KEY_PAGE_DOWN', '0x004E');
keyMap.set('HID_KEY_ARROW_RIGHT', '0x004F');
keyMap.set('HID_KEY_ARROW_LEFT', '0x0050');
keyMap.set('HID_KEY_ARROW_DOWN', '0x0051');
keyMap.set('HID_KEY_ARROW_UP', '0x0052');
keyMap.set('HID_KEY_NUM_LOCK', '0x0053');
keyMap.set('HID_KEY_KEYPAD_DIVIDE', '0x0054');
keyMap.set('HID_KEY_KEYPAD_MULTIPLY', '0x0055');
keyMap.set('HID_KEY_KEYPAD_SUBTRACT', '0x0056');
keyMap.set('HID_KEY_KEYPAD_ADD', '0x0057');
keyMap.set('HID_KEY_KEYPAD_ENTER', '0x0058');
keyMap.set('HID_KEY_KEYPAD_1', '0x0059');
keyMap.set('HID_KEY_KEYPAD_2', '0x005A');
keyMap.set('HID_KEY_KEYPAD_3', '0x005B');
keyMap.set('HID_KEY_KEYPAD_4', '0x005C');
keyMap.set('HID_KEY_KEYPAD_5', '0x005D');
keyMap.set('HID_KEY_KEYPAD_6', '0x005E');
keyMap.set('HID_KEY_KEYPAD_7', '0x005F');
keyMap.set('HID_KEY_KEYPAD_8', '0x0060');
keyMap.set('HID_KEY_KEYPAD_9', '0x0061');
keyMap.set('HID_KEY_KEYPAD_0', '0x0062');
keyMap.set('HID_KEY_KEYPAD_DECIMAL', '0x0063');
keyMap.set('HID_KEY_EUROPE_2', '0x0064'); // |
keyMap.set('HID_KEY_APPLICATION', '0x0065'); // MENU
keyMap.set('HID_KEY_POWER', '0x0066');
keyMap.set('HID_KEY_KEYPAD_EQUAL', '0x0067');
keyMap.set('HID_KEY_F13', '0x0068');
keyMap.set('HID_KEY_F14', '0x0069');
keyMap.set('HID_KEY_F15', '0x006A');
keyMap.set('HID_KEY_CONTROL_LEFT', '0x00E0');
keyMap.set('HID_KEY_SHIFT_LEFT', '0x00E1');
keyMap.set('HID_KEY_ALT_LEFT', '0x00E2');
keyMap.set('HID_KEY_GUI_LEFT', '0x00E3');
keyMap.set('HID_KEY_CONTROL_RIGHT', '0x00E4');
keyMap.set('HID_KEY_SHIFT_RIGHT', '0x00E5');
keyMap.set('HID_KEY_ALT_RIGHT', '0x00E6');
keyMap.set('HID_KEY_GUI_RIGHT', '0x00E7');
// keyMap.set('HID_KEY_HELP', '0x0075'); // Not responding
keyMap.set('HID_KEY_STOP', '0x0078');
// keyMap.set('HID_KEY_FIND', '0x007E'); // Not responding
keyMap.set('HID_KEY_VOLUME_MUTE', '0x007F');
keyMap.set('HID_KEY_VOLUME_UP', '0x0080');
keyMap.set('HID_KEY_VOLUME_DOWN', '0x0081');
// keyMap.set('HID_KEY_POWER', '0x00F8'); // duplicate of 0x0066 
// keyMap.set('HID_KEY_CALCULATOR', '0x00FB');

// TODO: Fix HID
// keyMap.set('HID_KEY_FUNCTION', '0x5300'); // https://gist.github.com/fauxpark/010dcf5d6377c3a71ac98ce37414c6c4#file-applefn-patch-L105
// keyMap.set('HID_KEY_FUNCTION', '0x0039'); // Using CAPS LOCK: https://github.com/zmkfirmware/zmk/issues/947#issuecomment-1777975419
// This appears to work if the firware is capable. I can't test it though
keyMap.set('HID_KEY_FUNCTION', '0x029D'); // https://github.com/zmkfirmware/zmk/issues/947#issuecomment-1728261625
/*
https://github.com/adafruit/Adafruit_nRF52_Arduino/blob/addf2e0ebcac67b3406b8508f54ef8e8f55fa22d/libraries/Bluefruit52Lib/src/services/BLEHidAdafruit.h#L59
The Adafruit library maxes out at 255 by using a uint8_t type, meaning even if I do send 0x029D (669), the firmware can't handle it.
 */
// keyMap.set('HID_KEY_FUNCTION', '0x0000'); 

const typeKeyMap = new Map();
typeKeyMap.set(' ', 'HID_KEY_SPACE');
typeKeyMap.set('[', 'HID_KEY_BRACKET_LEFT');
typeKeyMap.set(']', 'HID_KEY_BRACKET_RIGHT');
typeKeyMap.set(';', 'HID_KEY_SEMICOLON');
typeKeyMap.set('\'', 'HID_KEY_APOSTROPHE');
typeKeyMap.set('\\', 'HID_KEY_BACKSLASH');
typeKeyMap.set(',', 'HID_KEY_COMMA');
typeKeyMap.set('.', 'HID_KEY_PERIOD');
typeKeyMap.set('/', 'HID_KEY_SLASH');
typeKeyMap.set('-', 'HID_KEY_MINUS');
typeKeyMap.set('=', 'HID_KEY_EQUAL');

typeKeyMap.set('!', 'hHID_KEY_SHIFT_LEFT/HID_KEY_1');
typeKeyMap.set('@', 'hHID_KEY_SHIFT_LEFT/HID_KEY_2');
typeKeyMap.set('#', 'hHID_KEY_SHIFT_LEFT/HID_KEY_3');
typeKeyMap.set('$', 'hHID_KEY_SHIFT_LEFT/HID_KEY_4');
typeKeyMap.set('%', 'hHID_KEY_SHIFT_LEFT/HID_KEY_5');
typeKeyMap.set('^', 'hHID_KEY_SHIFT_LEFT/HID_KEY_6');
typeKeyMap.set('&', 'hHID_KEY_SHIFT_LEFT/HID_KEY_7');
typeKeyMap.set('*', 'hHID_KEY_SHIFT_LEFT/HID_KEY_8');
typeKeyMap.set('(', 'hHID_KEY_SHIFT_LEFT/HID_KEY_9');
typeKeyMap.set(')', 'hHID_KEY_SHIFT_LEFT/HID_KEY_0');
typeKeyMap.set('_', 'hHID_KEY_SHIFT_LEFT/HID_KEY_MINUS');
typeKeyMap.set('+', 'hHID_KEY_SHIFT_LEFT/HID_KEY_EQUAL');
typeKeyMap.set('{', 'hHID_KEY_SHIFT_LEFT/HID_KEY_BRACKET_LEFT');
typeKeyMap.set('}', 'hHID_KEY_SHIFT_LEFT/HID_KEY_BRACKET_RIGHT');
typeKeyMap.set(':', 'hHID_KEY_SHIFT_LEFT/HID_KEY_SEMICOLON');
typeKeyMap.set('"', 'hHID_KEY_SHIFT_LEFT/HID_KEY_APOSTROPHE');
typeKeyMap.set('|', 'hHID_KEY_SHIFT_LEFT/HID_KEY_BACKSLASH');
typeKeyMap.set('<', 'hHID_KEY_SHIFT_LEFT/HID_KEY_COMMA');
typeKeyMap.set('>', 'hHID_KEY_SHIFT_LEFT/HID_KEY_PERIOD');
typeKeyMap.set('?', 'hHID_KEY_SHIFT_LEFT/HID_KEY_SLASH');
typeKeyMap.set('~', 'hHID_KEY_SHIFT_LEFT/HID_KEY_GRAVE');
// alt
typeKeyMap.set('¡', 'hHID_KEY_ALT_LEFT/HID_KEY_1');
typeKeyMap.set('™', 'hHID_KEY_ALT_LEFT/HID_KEY_2');
typeKeyMap.set('£', 'hHID_KEY_ALT_LEFT/HID_KEY_3');
typeKeyMap.set('¢', 'hHID_KEY_ALT_LEFT/HID_KEY_4');
typeKeyMap.set('∞', 'hHID_KEY_ALT_LEFT/HID_KEY_5');
typeKeyMap.set('§', 'hHID_KEY_ALT_LEFT/HID_KEY_6');
typeKeyMap.set('¶', 'hHID_KEY_ALT_LEFT/HID_KEY_7');
typeKeyMap.set('•', 'hHID_KEY_ALT_LEFT/HID_KEY_8');
typeKeyMap.set('ª', 'hHID_KEY_ALT_LEFT/HID_KEY_9');
typeKeyMap.set('º', 'hHID_KEY_ALT_LEFT/HID_KEY_0');
typeKeyMap.set('–', 'hHID_KEY_ALT_LEFT/HID_KEY_MINUS');
typeKeyMap.set('≠', 'hHID_KEY_ALT_LEFT/HID_KEY_EQUAL');
typeKeyMap.set('œ', 'hHID_KEY_ALT_LEFT/HID_KEY_Q');
typeKeyMap.set('∑', 'hHID_KEY_ALT_LEFT/HID_KEY_W');
typeKeyMap.set('´', 'hHID_KEY_ALT_LEFT/HID_KEY_E');
typeKeyMap.set('®', 'hHID_KEY_ALT_LEFT/HID_KEY_R');
typeKeyMap.set('†', 'hHID_KEY_ALT_LEFT/HID_KEY_T');
typeKeyMap.set('¥', 'hHID_KEY_ALT_LEFT/HID_KEY_Y');
typeKeyMap.set('¨', 'hHID_KEY_ALT_LEFT/HID_KEY_U');
typeKeyMap.set('ˆ', 'hHID_KEY_ALT_LEFT/HID_KEY_I');
typeKeyMap.set('ø', 'hHID_KEY_ALT_LEFT/HID_KEY_O');
typeKeyMap.set('π', 'hHID_KEY_ALT_LEFT/HID_KEY_P');
typeKeyMap.set('“', 'hHID_KEY_ALT_LEFT/HID_KEY_BRACKET_LEFT');
typeKeyMap.set('‘', 'hHID_KEY_ALT_LEFT/HID_KEY_BRACKET_RIGHT');
typeKeyMap.set('å', 'hHID_KEY_ALT_LEFT/HID_KEY_A');
typeKeyMap.set('ß', 'hHID_KEY_ALT_LEFT/HID_KEY_S');
typeKeyMap.set('∂', 'hHID_KEY_ALT_LEFT/HID_KEY_D');
typeKeyMap.set('ƒ', 'hHID_KEY_ALT_LEFT/HID_KEY_F');
typeKeyMap.set('©', 'hHID_KEY_ALT_LEFT/HID_KEY_G');
typeKeyMap.set('˙', 'hHID_KEY_ALT_LEFT/HID_KEY_H');
typeKeyMap.set('∆', 'hHID_KEY_ALT_LEFT/HID_KEY_J');
typeKeyMap.set('˚', 'hHID_KEY_ALT_LEFT/HID_KEY_K');
typeKeyMap.set('¬', 'hHID_KEY_ALT_LEFT/HID_KEY_L');
typeKeyMap.set('…', 'hHID_KEY_ALT_LEFT/HID_KEY_SEMICOLON');
typeKeyMap.set('æ', 'hHID_KEY_ALT_LEFT/HID_KEY_APOSTROPHE');
typeKeyMap.set('«', 'hHID_KEY_ALT_LEFT/HID_KEY_BACKSLASH');
typeKeyMap.set('≈', 'hHID_KEY_ALT_LEFT/HID_KEY_X');
typeKeyMap.set('ç', 'hHID_KEY_ALT_LEFT/HID_KEY_C');
typeKeyMap.set('√', 'hHID_KEY_ALT_LEFT/HID_KEY_V');
typeKeyMap.set('∫', 'hHID_KEY_ALT_LEFT/HID_KEY_B');
typeKeyMap.set('˜', 'hHID_KEY_ALT_LEFT/HID_KEY_N');
typeKeyMap.set('µ', 'hHID_KEY_ALT_LEFT/HID_KEY_M');
typeKeyMap.set('≤', 'hHID_KEY_ALT_LEFT/HID_KEY_COMMA');
typeKeyMap.set('≥', 'hHID_KEY_ALT_LEFT/HID_KEY_PERIOD');
typeKeyMap.set('÷', 'hHID_KEY_ALT_LEFT/HID_KEY_SLASH');

const rawKeyMap = new Map();
rawKeyMap.set('Backspace', 'HID_KEY_BACKSPACE');
rawKeyMap.set('Tab', 'HID_KEY_TAB');
rawKeyMap.set('Enter', 'HID_KEY_ENTER');
rawKeyMap.set('Space', 'HID_KEY_SPACE');
rawKeyMap.set('Escape', 'HID_KEY_ESCAPE');
rawKeyMap.set('ContextMenu', 'HID_KEY_APPLICATION');

rawKeyMap.set('ShiftLeft', 'HID_KEY_SHIFT_LEFT');
rawKeyMap.set('ShiftRight', 'HID_KEY_SHIFT_RIGHT');
rawKeyMap.set('ControlLeft', 'HID_KEY_CONTROL_LEFT');
rawKeyMap.set('ControlRight', 'HID_KEY_CONTROL_RIGHT');
rawKeyMap.set('AltLeft', 'HID_KEY_ALT_LEFT');
rawKeyMap.set('AltRight', 'HID_KEY_ALT_RIGHT');
rawKeyMap.set('MetaLeft', 'HID_KEY_GUI_LEFT');
rawKeyMap.set('MetaRight', 'HID_KEY_GUI_RIGHT');

rawKeyMap.set('Pause', 'HID_KEY_PAUSE');
rawKeyMap.set('CapsLock', 'HID_KEY_CAPS_LOCK');
rawKeyMap.set('PrintScreen', 'HID_KEY_PRINT_SCREEN');
rawKeyMap.set('Insert', 'HID_KEY_INSERT');
rawKeyMap.set('Delete', 'HID_KEY_DELETE');

rawKeyMap.set('PageUp', 'HID_KEY_PAGE_UP');
rawKeyMap.set('PageDown', 'HID_KEY_PAGE_DOWN');
rawKeyMap.set('End', 'HID_KEY_END');
rawKeyMap.set('Home', 'HID_KEY_HOME');

rawKeyMap.set('ArrowRight', 'HID_KEY_ARROW_RIGHT');
rawKeyMap.set('ArrowLeft', 'HID_KEY_ARROW_LEFT');
rawKeyMap.set('ArrowDown', 'HID_KEY_ARROW_DOWN');
rawKeyMap.set('ArrowUp', 'HID_KEY_ARROW_UP');

rawKeyMap.set('Digit0', 'HID_KEY_0');
rawKeyMap.set('Digit1', 'HID_KEY_1');
rawKeyMap.set('Digit2', 'HID_KEY_2');
rawKeyMap.set('Digit3', 'HID_KEY_3');
rawKeyMap.set('Digit4', 'HID_KEY_4');
rawKeyMap.set('Digit5', 'HID_KEY_5');
rawKeyMap.set('Digit6', 'HID_KEY_6');
rawKeyMap.set('Digit7', 'HID_KEY_7');
rawKeyMap.set('Digit8', 'HID_KEY_8');
rawKeyMap.set('Digit9', 'HID_KEY_9');

rawKeyMap.set('KeyA', 'HID_KEY_A');
rawKeyMap.set('KeyB', 'HID_KEY_B');
rawKeyMap.set('KeyC', 'HID_KEY_C');
rawKeyMap.set('KeyD', 'HID_KEY_D');
rawKeyMap.set('KeyE', 'HID_KEY_E');
rawKeyMap.set('KeyF', 'HID_KEY_F');
rawKeyMap.set('KeyG', 'HID_KEY_G');
rawKeyMap.set('KeyH', 'HID_KEY_H');
rawKeyMap.set('KeyI', 'HID_KEY_I');
rawKeyMap.set('KeyJ', 'HID_KEY_J');
rawKeyMap.set('KeyK', 'HID_KEY_K');
rawKeyMap.set('KeyL', 'HID_KEY_L');
rawKeyMap.set('KeyM', 'HID_KEY_M');
rawKeyMap.set('KeyN', 'HID_KEY_N');
rawKeyMap.set('KeyO', 'HID_KEY_O');
rawKeyMap.set('KeyP', 'HID_KEY_P');
rawKeyMap.set('KeyQ', 'HID_KEY_Q');
rawKeyMap.set('KeyR', 'HID_KEY_R');
rawKeyMap.set('KeyS', 'HID_KEY_S');
rawKeyMap.set('KeyT', 'HID_KEY_T');
rawKeyMap.set('KeyU', 'HID_KEY_U');
rawKeyMap.set('KeyV', 'HID_KEY_V');
rawKeyMap.set('KeyW', 'HID_KEY_W');
rawKeyMap.set('KeyX', 'HID_KEY_X');
rawKeyMap.set('KeyY', 'HID_KEY_Y');
rawKeyMap.set('KeyZ', 'HID_KEY_Z');

rawKeyMap.set('Numpad0', 'HID_KEY_KEYPAD_0');
rawKeyMap.set('Numpad1', 'HID_KEY_KEYPAD_1');
rawKeyMap.set('Numpad2', 'HID_KEY_KEYPAD_2');
rawKeyMap.set('Numpad3', 'HID_KEY_KEYPAD_3');
rawKeyMap.set('Numpad4', 'HID_KEY_KEYPAD_4');
rawKeyMap.set('Numpad5', 'HID_KEY_KEYPAD_5');
rawKeyMap.set('Numpad6', 'HID_KEY_KEYPAD_6');
rawKeyMap.set('Numpad7', 'HID_KEY_KEYPAD_7');
rawKeyMap.set('Numpad8', 'HID_KEY_KEYPAD_8');
rawKeyMap.set('Numpad9', 'HID_KEY_KEYPAD_9');

rawKeyMap.set('NumpadDivide', 'HID_KEY_KEYPAD_DIVIDE');
rawKeyMap.set('NumpadMultiply', 'HID_KEY_KEYPAD_MULTIPLY');
rawKeyMap.set('NumpadSubtract', 'HID_KEY_KEYPAD_SUBTRACT');
rawKeyMap.set('NumpadAdd', 'HID_KEY_KEYPAD_ADD');
rawKeyMap.set('NumpadDecimal', 'HID_KEY_KEYPAD_DECIMAL');

rawKeyMap.set('F1', 'HID_KEY_F1');
rawKeyMap.set('F2', 'HID_KEY_F2');
rawKeyMap.set('F3', 'HID_KEY_F3');
rawKeyMap.set('F4', 'HID_KEY_F4');
rawKeyMap.set('F5', 'HID_KEY_F5');
rawKeyMap.set('F6', 'HID_KEY_F6');
rawKeyMap.set('F7', 'HID_KEY_F7');
rawKeyMap.set('F8', 'HID_KEY_F8');
rawKeyMap.set('F9', 'HID_KEY_F9');
rawKeyMap.set('F10', 'HID_KEY_F10');
rawKeyMap.set('F11', 'HID_KEY_F11');
rawKeyMap.set('F12', 'HID_KEY_F12');

rawKeyMap.set('NumLock', 'HID_KEY_NUM_LOCK');
rawKeyMap.set('ScrollLock', 'HID_KEY_SCROLL_LOCK');

rawKeyMap.set('Semicolon', 'HID_KEY_SEMICOLON');
rawKeyMap.set('Equal', 'HID_KEY_EQUAL');
rawKeyMap.set('Comma', 'HID_KEY_COMMA');
rawKeyMap.set('Minus', 'HID_KEY_MINUS');
rawKeyMap.set('Period', 'HID_KEY_PERIOD');
rawKeyMap.set('Slash', 'HID_KEY_SLASH');
rawKeyMap.set('Backquote', 'HID_KEY_GRAVE');
rawKeyMap.set('BracketLeft', 'HID_KEY_BRACKET_LEFT');
rawKeyMap.set('BracketRight', 'HID_KEY_BRACKET_RIGHT');
rawKeyMap.set('Backslash', 'HID_KEY_BACKSLASH');
rawKeyMap.set('Quote', 'HID_KEY_APOSTROPHE');

const userFriendlyMap = new Map();
userFriendlyMap.set('HID_KEY_A', 'A');
userFriendlyMap.set('HID_KEY_B', 'B');
userFriendlyMap.set('HID_KEY_C', 'C');
userFriendlyMap.set('HID_KEY_D', 'D');
userFriendlyMap.set('HID_KEY_E', 'E');
userFriendlyMap.set('HID_KEY_F', 'F');
userFriendlyMap.set('HID_KEY_G', 'G');
userFriendlyMap.set('HID_KEY_H', 'H');
userFriendlyMap.set('HID_KEY_I', 'I');
userFriendlyMap.set('HID_KEY_J', 'J');
userFriendlyMap.set('HID_KEY_K', 'K');
userFriendlyMap.set('HID_KEY_L', 'L');
userFriendlyMap.set('HID_KEY_M', 'M');
userFriendlyMap.set('HID_KEY_N', 'N');
userFriendlyMap.set('HID_KEY_O', 'O');
userFriendlyMap.set('HID_KEY_P', 'P');
userFriendlyMap.set('HID_KEY_Q', 'Q');
userFriendlyMap.set('HID_KEY_R', 'R');
userFriendlyMap.set('HID_KEY_S', 'S');
userFriendlyMap.set('HID_KEY_T', 'T');
userFriendlyMap.set('HID_KEY_U', 'U');
userFriendlyMap.set('HID_KEY_V', 'V');
userFriendlyMap.set('HID_KEY_W', 'W');
userFriendlyMap.set('HID_KEY_X', 'X');
userFriendlyMap.set('HID_KEY_Y', 'Y');
userFriendlyMap.set('HID_KEY_Z', 'Z');
userFriendlyMap.set('HID_KEY_1', '1');
userFriendlyMap.set('HID_KEY_2', '2');
userFriendlyMap.set('HID_KEY_3', '3');
userFriendlyMap.set('HID_KEY_4', '4');
userFriendlyMap.set('HID_KEY_5', '5');
userFriendlyMap.set('HID_KEY_6', '6');
userFriendlyMap.set('HID_KEY_7', '7');
userFriendlyMap.set('HID_KEY_8', '8');
userFriendlyMap.set('HID_KEY_9', '9');
userFriendlyMap.set('HID_KEY_0', '0');
userFriendlyMap.set('HID_KEY_RETURN', '&#8629;');
userFriendlyMap.set('HID_KEY_ENTER', '&#8629;');
userFriendlyMap.set('HID_KEY_ESCAPE', 'ESC');
userFriendlyMap.set('HID_KEY_BACKSPACE', '&#9003;');
userFriendlyMap.set('HID_KEY_TAB', '&#8677;');
userFriendlyMap.set('HID_KEY_SPACE', '&#8852;');
userFriendlyMap.set('HID_KEY_MINUS', '-');
userFriendlyMap.set('HID_KEY_EQUAL', '=');
userFriendlyMap.set('HID_KEY_BRACKET_LEFT', '[');
userFriendlyMap.set('HID_KEY_BRACKET_RIGHT', ']');
userFriendlyMap.set('HID_KEY_BACKSLASH', '\\'); // originally 0x0031
userFriendlyMap.set('HID_KEY_EUROPE_1', ''); // Unsure what purpose this is
userFriendlyMap.set('HID_KEY_SEMICOLON', ';');
userFriendlyMap.set('HID_KEY_APOSTROPHE', '\'');
userFriendlyMap.set('HID_KEY_GRAVE', '&#96;'); // originally 0x0035
userFriendlyMap.set('HID_KEY_COMMA', ',');
userFriendlyMap.set('HID_KEY_PERIOD', '.');
userFriendlyMap.set('HID_KEY_SLASH', '/');
userFriendlyMap.set('HID_KEY_CAPS_LOCK', '');
userFriendlyMap.set('HID_KEY_F1', 'F1');
userFriendlyMap.set('HID_KEY_F2', 'F2');
userFriendlyMap.set('HID_KEY_F3', 'F3');
userFriendlyMap.set('HID_KEY_F4', 'F4');
userFriendlyMap.set('HID_KEY_F5', 'F5');
userFriendlyMap.set('HID_KEY_F6', 'F6');
userFriendlyMap.set('HID_KEY_F7', 'F7');
userFriendlyMap.set('HID_KEY_F8', 'F8');
userFriendlyMap.set('HID_KEY_F9', 'F9');
userFriendlyMap.set('HID_KEY_F10', 'F10');
userFriendlyMap.set('HID_KEY_F11', 'F11');
userFriendlyMap.set('HID_KEY_F12', 'F12');
userFriendlyMap.set('HID_KEY_PRINT_SCREEN', 'PRNT'); // take screenshot
userFriendlyMap.set('HID_KEY_SCROLL_LOCK', ''); // android: nothing
userFriendlyMap.set('HID_KEY_PAUSE', '&#8227;');
userFriendlyMap.set('HID_KEY_INSERT', '');
userFriendlyMap.set('HID_KEY_HOME', 'HOME');
userFriendlyMap.set('HID_KEY_PAGE_UP', '&#8892;');
userFriendlyMap.set('HID_KEY_DELETE', '&#9003;');
userFriendlyMap.set('HID_KEY_END', 'END');
userFriendlyMap.set('HID_KEY_PAGE_DOWN', '&#8891;');
userFriendlyMap.set('HID_KEY_ARROW_RIGHT', '&#8594;');
userFriendlyMap.set('HID_KEY_ARROW_LEFT', '&#8592;');
userFriendlyMap.set('HID_KEY_ARROW_DOWN', '&#8595;');
userFriendlyMap.set('HID_KEY_ARROW_UP', '&#8593;');
userFriendlyMap.set('HID_KEY_NUM_LOCK', '');
userFriendlyMap.set('HID_KEY_KEYPAD_DIVIDE', '');
userFriendlyMap.set('HID_KEY_KEYPAD_MULTIPLY', '');
userFriendlyMap.set('HID_KEY_KEYPAD_SUBTRACT', '');
userFriendlyMap.set('HID_KEY_KEYPAD_ADD', '');
userFriendlyMap.set('HID_KEY_KEYPAD_ENTER', '');
userFriendlyMap.set('HID_KEY_KEYPAD_1', '1');
userFriendlyMap.set('HID_KEY_KEYPAD_2', '2');
userFriendlyMap.set('HID_KEY_KEYPAD_3', '3');
userFriendlyMap.set('HID_KEY_KEYPAD_4', '4');
userFriendlyMap.set('HID_KEY_KEYPAD_5', '5');
userFriendlyMap.set('HID_KEY_KEYPAD_6', '6');
userFriendlyMap.set('HID_KEY_KEYPAD_7', '7');
userFriendlyMap.set('HID_KEY_KEYPAD_8', '8');
userFriendlyMap.set('HID_KEY_KEYPAD_9', '9');
userFriendlyMap.set('HID_KEY_KEYPAD_0', '0');
userFriendlyMap.set('HID_KEY_KEYPAD_DECIMAL', '.');
userFriendlyMap.set('HID_KEY_EUROPE_2', ''); // |
userFriendlyMap.set('HID_KEY_APPLICATION', 'MENU'); // MENU
userFriendlyMap.set('HID_KEY_POWER', 'POWER');
userFriendlyMap.set('HID_KEY_KEYPAD_EQUAL', '=');
userFriendlyMap.set('HID_KEY_F13', 'F13');
userFriendlyMap.set('HID_KEY_F14', 'F14');
userFriendlyMap.set('HID_KEY_F15', 'F15');
userFriendlyMap.set('HID_KEY_CONTROL_LEFT', '&#94;');
userFriendlyMap.set('HID_KEY_SHIFT_LEFT', '&#8679;');
userFriendlyMap.set('HID_KEY_ALT_LEFT', '&#8997;');
userFriendlyMap.set('HID_KEY_GUI_LEFT', '&#8984;');
userFriendlyMap.set('HID_KEY_CONTROL_RIGHT', '&#94;');
userFriendlyMap.set('HID_KEY_SHIFT_RIGHT', '&#8679;');
userFriendlyMap.set('HID_KEY_ALT_RIGHT', '&#8997;');
userFriendlyMap.set('HID_KEY_GUI_RIGHT', '&#8984;');
userFriendlyMap.set('HID_KEY_STOP', 'STOP');
userFriendlyMap.set('HID_KEY_VOLUME_MUTE', 'MUTE');
userFriendlyMap.set('HID_KEY_VOLUME_UP', 'VOL UP');
userFriendlyMap.set('HID_KEY_VOLUME_DOWN', 'VOL DN');
userFriendlyMap.set('HID_KEY_FUNCTION', 'fn');

function toKeyCode(original, separator = '/') {
    var finalStr = '';
    for (let element of original.split('/')) {
        if (!element) continue;
        var reference = element;
        var prefix = '';
        if (reference.startsWith('h')) {
            prefix = 'h';
            reference = reference.slice(1);
        }        
        finalStr += `${prefix}${keyMap.get(reference)}${separator}`;
    }
    return finalStr;
}

function toKeyAlias(raw_input) {
    return rawKeyMap.get(raw_input);
}

function generateKeyCombo(shortcut, returnArr = false) {
    let value = [];
    if (shortcut.userMod != "") {
        userMods.get(shortcut.userMod).forEach(element => {
            value.push(element);
        });
    }
    if (shortcut.modMeta) {
        value.push("hHID_KEY_GUI_LEFT");
    }
    if (shortcut.modShift) {
        value.push("hHID_KEY_SHIFT_LEFT");
    }
    if (shortcut.modAlt) {
        value.push("hHID_KEY_ALT_LEFT");
    }
    if (shortcut.modControl) {
        value.push("hHID_KEY_CONTROL_LEFT");
    }
    if (shortcut.modTab) {
        value.push("hHID_KEY_TAB");
    }
    if (shortcut.modFunction) {
        value.push("hHID_KEY_FUNCTION");
    }
    value.push(`HID_KEY_${shortcut.keyValue}`);

    if (returnArr) {
        return value;
    } else {
        return `${value.join('/')}/`;
    }
}

function findKeyInMap(map, searchValue) {
    for (let [key, value] of map.entries()) {
        if (value === searchValue)
            return key;
    }
    return null;
}

function findKeyName(keyValue) {
    return findKeyInMap(keyMap, keyValue);    
}

function findUserFriendlyKeyName(keyValue) {
    const name = findKeyName(keyValue);
    const friendlyName = userFriendlyMap.get(name);
    if (friendlyName == '') {
        return name.replace('HID_KEY_','').replace('_',' ');
    }
    return friendlyName;
}

function userFriendlyCharToCode(character) {
    if (keyMap.has(character)) {
        return character;
    }
    let check = `HID_KEY_${character.toUpperCase()}`;    
    if (!keyMap.has(check)) {
        check = typeKeyMap.get(character);
    }
    return check;
}

function isUpperCase(character) {
    return character === character.toUpperCase() && character !== character.toLowerCase();
}

function inputCharToCode(singleCharacter) {    
    const checkCode = `HID_KEY_${singleCharacter.toUpperCase()}`;
    if (keyMap.has(checkCode)) {
        if (isUpperCase(singleCharacter)) {
            return `hHID_KEY_SHIFT_LEFT/${checkCode}`;
        } else {
            return checkCode;
        }
    }

    if (typeKeyMap.has(singleCharacter)) {
        return typeKeyMap.get(singleCharacter);
    }
}