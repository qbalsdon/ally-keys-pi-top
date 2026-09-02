'use strict';
/**
 * bluez-hid-worker.js
 *
 * BLE HID keyboard via BlueZ GATT D-Bus API.
 *
 * Unlike hid-worker.js (bleno), this worker lets bluetoothd own the HCI adapter
 * and handle all BLE/SMP/bonding — which is exactly what iOS requires for HOGP
 * (HID over GATT Profile).  We register a GATT Application and an advertisement
 * via the standard org.bluez.GattManager1 / LEAdvertisingManager1 D-Bus APIs.
 *
 * dbus-next 0.10.x uses JS decorators (stage 2 TC39) for its high-level
 * Interface API.  Since we don't have Babel/TypeScript, we manually set the
 * $properties / $methods / $signals prototype members that the decorators
 * would have set — the runtime reads exactly these fields.
 *
 * Spawned as a child process by ble-manager.js; one instance per USB dongle.
 *   parent → child  IPC: { type: 'keycode', data: '<wire-string>' }
 *   child  → parent IPC: { type: 'connected' } | { type: 'disconnected' }
 *
 * Environment:
 *   HCI_ID (or BLENO_HCI_DEVICE_ID)  — adapter index, e.g. '2' for hci2
 *   DEVICE_NAME                       — BLE device name, e.g. 'AK-IOS'
 */

const dbus = require('dbus-next');
const { Interface, ACCESS_READ } = dbus.interface;
const { parseSignature }          = require('dbus-next/lib/signature');
const { HID_DESCRIPTOR }          = require('./hid-descriptor');
const { parseKeycodeString }      = require('./protocol-parser');

// ── Config ───────────────────────────────────────────────────────────────────

const HCI_ID      = process.env.HCI_ID || process.env.BLENO_HCI_DEVICE_ID || '2';
const DEVICE_NAME = process.env.DEVICE_NAME || `AK-HID-${HCI_ID}`;

const BLUEZ        = 'org.bluez';
const ADAPTER_PATH = `/org/bluez/hci${HCI_ID}`;
const APP_ROOT     = `/ak/hid${HCI_ID}`;   // unique per worker
const ADV_PATH     = `${APP_ROOT}/adv`;

const HID_SVC_PATH  = `${APP_ROOT}/s0`;
const BATT_SVC_PATH = `${APP_ROOT}/s1`;

const CHAR_INFO_PATH  = `${HID_SVC_PATH}/c0`;   // 2A4A HID Information
const CHAR_CP_PATH    = `${HID_SVC_PATH}/c1`;   // 2A4C HID Control Point
const CHAR_MAP_PATH   = `${HID_SVC_PATH}/c2`;   // 2A4B Report Map
const CHAR_INPUT_PATH = `${HID_SVC_PATH}/c3`;   // 2A4D Input Report
const DESC_REF_PATH   = `${CHAR_INPUT_PATH}/d0`; // 2908 Report Reference
const CHAR_BATT_PATH  = `${BATT_SVC_PATH}/c0`;  // 2A19 Battery Level

// ── Helpers ───────────────────────────────────────────────────────────────────

function toBytes(b) {
  return b instanceof Buffer ? Array.from(b) : Array.from(Buffer.from(b));
}
function v(sig, val) { return new dbus.Variant(sig, val); }

/**
 * Manually register properties on a dbus-next Interface subclass the same way
 * the @property decorator would.  `specs` is { PropName: {signature, access} }.
 */
function defProps(Klass, specs) {
  Klass.prototype.$properties = Klass.prototype.$properties || {};
  for (const [name, opts] of Object.entries(specs)) {
    Klass.prototype.$properties[name] = {
      name,
      access: opts.access || ACCESS_READ,
      signature: opts.signature,
      signatureTree: parseSignature(opts.signature),
      disabled: false,
    };
  }
}

/**
 * Manually register methods on a dbus-next Interface subclass the same way
 * the @method decorator would.  `specs` is { MethodName: {inSignature, outSignature} }.
 */
function defMethods(Klass, specs) {
  Klass.prototype.$methods = Klass.prototype.$methods || {};
  for (const [name, opts] of Object.entries(specs)) {
    Klass.prototype.$methods[name] = {
      name,
      inSignature:     opts.inSignature  || '',
      outSignature:    opts.outSignature || '',
      inSignatureTree:  parseSignature(opts.inSignature  || ''),
      outSignatureTree: parseSignature(opts.outSignature || ''),
      disabled: false,
      noReply:  false,
    };
  }
}

// ── GATT Service ──────────────────────────────────────────────────────────────

class GattService extends Interface {
  constructor(uuid) {
    super('org.bluez.GattService1');
    this._uuid = uuid;
  }
  get UUID()    { return this._uuid; }
  get Primary() { return true; }
}
defProps(GattService, {
  UUID:    { signature: 's', access: ACCESS_READ },
  Primary: { signature: 'b', access: ACCESS_READ },
});

// ── GATT Characteristic base ─────────────────────────────────────────────────

class GattChar extends Interface {
  constructor(uuid, flags, svcPath) {
    super('org.bluez.GattCharacteristic1');
    this._uuid      = uuid;
    this._svc       = svcPath;
    this._flags     = flags;
    this._value     = Buffer.alloc(0);
    this._notifying = false;
  }
  get UUID()      { return this._uuid; }
  get Service()   { return this._svc; }
  get Flags()     { return this._flags; }
  get Value()     { return toBytes(this._value); }
  get Notifying() { return this._notifying; }

  ReadValue(_opts)         { return toBytes(this._value); }
  WriteValue(val, _opts)   { this._value = Buffer.from(val); }
  StartNotify()            {}
  StopNotify()             {}
}
defProps(GattChar, {
  UUID:      { signature: 's',  access: ACCESS_READ },
  Service:   { signature: 'o',  access: ACCESS_READ },
  Flags:     { signature: 'as', access: ACCESS_READ },
  Value:     { signature: 'ay', access: ACCESS_READ },
  Notifying: { signature: 'b',  access: ACCESS_READ },
});
defMethods(GattChar, {
  ReadValue:   { inSignature: 'a{sv}', outSignature: 'ay' },
  WriteValue:  { inSignature: 'aya{sv}', outSignature: '' },
  StartNotify: { inSignature: '', outSignature: '' },
  StopNotify:  { inSignature: '', outSignature: '' },
});

// ── GATT Descriptor base ──────────────────────────────────────────────────────

class GattDesc extends Interface {
  constructor(uuid, charPath, value) {
    super('org.bluez.GattDescriptor1');
    this._uuid  = uuid;
    this._char  = charPath;
    this._flags = ['read'];
    this._value = value;
  }
  get UUID()           { return this._uuid; }
  get Characteristic() { return this._char; }
  get Flags()          { return this._flags; }
  get Value()          { return toBytes(this._value); }
  ReadValue(_opts)     { return toBytes(this._value); }
}
defProps(GattDesc, {
  UUID:           { signature: 's',  access: ACCESS_READ },
  Characteristic: { signature: 'o',  access: ACCESS_READ },
  Flags:          { signature: 'as', access: ACCESS_READ },
  Value:          { signature: 'ay', access: ACCESS_READ },
});
defMethods(GattDesc, {
  ReadValue: { inSignature: 'a{sv}', outSignature: 'ay' },
});

// ── LE Advertisement ──────────────────────────────────────────────────────────

class LEAdvertisement extends Interface {
  constructor() {
    super('org.bluez.LEAdvertisement1');
  }
  get Type()         { return 'peripheral'; }
  get ServiceUUIDs() { return ['1812']; }
  get Appearance()   { return 0x03C1; }
  get LocalName()    { return DEVICE_NAME; }
  Release() {
    console.log(`[${DEVICE_NAME}] advertisement released by bluetoothd`);
  }
}
defProps(LEAdvertisement, {
  Type:         { signature: 's',  access: ACCESS_READ },
  ServiceUUIDs: { signature: 'as', access: ACCESS_READ },
  Appearance:   { signature: 'q',  access: ACCESS_READ },
  LocalName:    { signature: 's',  access: ACCESS_READ },
});
defMethods(LEAdvertisement, {
  Release: { inSignature: '', outSignature: '' },
});

// ── ObjectManager ─────────────────────────────────────────────────────────────
// bluetoothd calls GetManagedObjects after RegisterApplication to discover our
// GATT hierarchy.  We return a snapshot of all service/char/descriptor paths
// with their current property values as Variants.

function buildManagedObjects() {
  return {
    [HID_SVC_PATH]: {
      'org.bluez.GattService1': {
        UUID:    v('s', '1812'),
        Primary: v('b', true),
      },
    },
    [BATT_SVC_PATH]: {
      'org.bluez.GattService1': {
        UUID:    v('s', '180f'),
        Primary: v('b', true),
      },
    },
    [CHAR_INFO_PATH]: {
      'org.bluez.GattCharacteristic1': {
        UUID:    v('s', '2a4a'),
        Service: v('o', HID_SVC_PATH),
        Flags:   v('as', ['read']),
      },
    },
    [CHAR_CP_PATH]: {
      'org.bluez.GattCharacteristic1': {
        UUID:    v('s', '2a4c'),
        Service: v('o', HID_SVC_PATH),
        Flags:   v('as', ['write-without-response']),
      },
    },
    [CHAR_MAP_PATH]: {
      'org.bluez.GattCharacteristic1': {
        UUID:    v('s', '2a4b'),
        Service: v('o', HID_SVC_PATH),
        Flags:   v('as', ['read']),
      },
    },
    [CHAR_INPUT_PATH]: {
      'org.bluez.GattCharacteristic1': {
        UUID:      v('s', '2a4d'),
        Service:   v('o', HID_SVC_PATH),
        Flags:     v('as', ['read', 'notify']),
        Notifying: v('b', false),
      },
    },
    [DESC_REF_PATH]: {
      'org.bluez.GattDescriptor1': {
        UUID:           v('s', '2908'),
        Characteristic: v('o', CHAR_INPUT_PATH),
        Flags:          v('as', ['read']),
        Value:          v('ay', [0x00, 0x01]),
      },
    },
    [CHAR_BATT_PATH]: {
      'org.bluez.GattCharacteristic1': {
        UUID:    v('s', '2a19'),
        Service: v('o', BATT_SVC_PATH),
        Flags:   v('as', ['read']),
      },
    },
  };
}

class ObjectManager extends Interface {
  constructor() { super('org.freedesktop.DBus.ObjectManager'); }
  GetManagedObjects() { return buildManagedObjects(); }
}
defMethods(ObjectManager, {
  GetManagedObjects: { inSignature: '', outSignature: 'a{oa{sa{sv}}}' },
});

// ── Concrete characteristic instances ─────────────────────────────────────────

class HidInfoChar extends GattChar {
  constructor() {
    super('2a4a', ['read'], HID_SVC_PATH);
    this._value = Buffer.from([0x11, 0x01, 0x00, 0x03]); // bcdHID 1.11, country 0, RemoteWake+NormallyConnectable
  }
}

class HidCpChar extends GattChar {
  constructor() { super('2a4c', ['write-without-response'], HID_SVC_PATH); }
}

class ReportMapChar extends GattChar {
  constructor() {
    super('2a4b', ['read'], HID_SVC_PATH);
    this._value = HID_DESCRIPTOR;
  }
}

class InputReportChar extends GattChar {
  constructor() {
    super('2a4d', ['read', 'notify'], HID_SVC_PATH);
    this._value = Buffer.alloc(8);
  }

  StartNotify() {
    this._notifying = true;
    console.log(`[${DEVICE_NAME}] StartNotify — HID client subscribed`);
    process.send({ type: 'connected' });
  }

  StopNotify() {
    this._notifying = false;
    console.log(`[${DEVICE_NAME}] StopNotify — HID client unsubscribed`);
    process.send({ type: 'disconnected' });
  }

  sendReport(buf) {
    this._value = buf;
    // Emit PropertiesChanged → bluetoothd forwards this as a BLE GATT notification
    Interface.emitPropertiesChanged(this, { Value: v('ay', toBytes(buf)) }, []);
  }
}

class BattLevelChar extends GattChar {
  constructor() {
    super('2a19', ['read'], BATT_SVC_PATH);
    this._value = Buffer.from([0x64]); // 100%
  }
}

const hidInfoChar  = new HidInfoChar();
const hidCpChar    = new HidCpChar();
const reportMapChar = new ReportMapChar();
const inputReport  = new InputReportChar();
const reportRefDesc = new GattDesc('2908', CHAR_INPUT_PATH, Buffer.from([0x00, 0x01]));
const battLevelChar = new BattLevelChar();

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const bus = dbus.systemBus();

  // Export all GATT objects on the system bus at their paths.
  // bluetoothd will call GetManagedObjects on APP_ROOT to discover the hierarchy,
  // then call ReadValue/StartNotify/etc on the characteristic paths directly.
  bus.export(APP_ROOT,        new ObjectManager());
  bus.export(HID_SVC_PATH,    new GattService('1812'));
  bus.export(BATT_SVC_PATH,   new GattService('180f'));
  bus.export(CHAR_INFO_PATH,  hidInfoChar);
  bus.export(CHAR_CP_PATH,    hidCpChar);
  bus.export(CHAR_MAP_PATH,   reportMapChar);
  bus.export(CHAR_INPUT_PATH, inputReport);
  bus.export(DESC_REF_PATH,   reportRefDesc);
  bus.export(CHAR_BATT_PATH,  battLevelChar);
  bus.export(ADV_PATH,        new LEAdvertisement());

  // Get bluetoothd proxy objects for this adapter
  let adapter;
  try {
    adapter = await bus.getProxyObject(BLUEZ, ADAPTER_PATH);
  } catch (err) {
    throw new Error(`hci${HCI_ID} not found in bluetoothd — is bluetoothd running? (${err.message})`);
  }

  const gattMgr      = adapter.getInterface('org.bluez.GattManager1');
  const advMgr       = adapter.getInterface('org.bluez.LEAdvertisingManager1');
  const adapterProps = adapter.getInterface('org.freedesktop.DBus.Properties');

  // Power on the adapter (bluetoothd's job; with AutoEnable=false we do it explicitly)
  try {
    await adapterProps.Set('org.bluez.Adapter1', 'Powered', v('b', true));
    console.log(`[${DEVICE_NAME}] hci${HCI_ID} powered on`);
  } catch (err) {
    console.warn(`[${DEVICE_NAME}] could not power on hci${HCI_ID} (may already be on): ${err.message}`);
  }

  // RegisterApplication: bluetoothd calls GetManagedObjects on our APP_ROOT path
  // using our D-Bus bus name and builds the GATT database from our objects.
  await gattMgr.RegisterApplication(APP_ROOT, {});
  console.log(`[${DEVICE_NAME}] GATT application registered on ${ADAPTER_PATH}`);

  // RegisterAdvertisement: bluetoothd reads our LEAdvertisement1 props and
  // starts broadcasting. Properties: Type, ServiceUUIDs, Appearance, LocalName.
  await advMgr.RegisterAdvertisement(ADV_PATH, {});
  console.log(`[${DEVICE_NAME}] advertising as "${DEVICE_NAME}" on hci${HCI_ID}`);
}

main().catch((err) => {
  console.error(`[${DEVICE_NAME}] startup failed:`, err.message || err);
  // Retry in 5 s — bluetoothd may not be up yet when the worker first starts
  setTimeout(() => main().catch(console.error), 5000);
});

// ── IPC: receive keycode, send HID report ────────────────────────────────────

const KEY_UP = Buffer.alloc(8);

process.on('message', (msg) => {
  if (msg.type !== 'keycode') return;
  const report = parseKeycodeString(msg.data);
  inputReport.sendReport(report);
  setTimeout(() => inputReport.sendReport(KEY_UP), 30);
});

process.on('uncaughtException', (err) => {
  console.error(`[${DEVICE_NAME}] uncaught:`, err);
});
