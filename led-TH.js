
const {
  MultipleThings,
  Property,
  Thing,
  Value,
  WebThingServer,
} = require("webthing");
const { v4: uuidv4 } = require("uuid");
const Gpio = require("onoff").Gpio;
const led = new Gpio(4, "out");
var sensorLib = require("node-dht-sensor");

class LEDWebThing extends Thing {
  constructor() {
    super(
      "urn:dev:ops:my-led-1234",
      "My LED",
      ["OnOffSwitch", "Light"],
      "A web connected LED"
    );

    this.addProperty(
      new Property(
        this,
        "on",
        new Value(true, (v) => led.writeSync(v === true ? 1 : 0)),
        {
          "@type": "OnOffProperty",
          title: "On/Off",
          type: "boolean",
          description: "Whether the LED is turned on",
        }
      )
    );
  }
}


class TemperatureSensor extends Thing {
  constructor() {
    super(
      "urn:dev:ops:my-humidity-sensor-1234",
      "My Temperature Sensor",
      ["MultiLevelSensor"],
      "A web connected Temperature sensor"
    );

    this.level = new Value(0.0);
    this.addProperty(
      new Property(this, "level", this.level, {
        "@type": "LevelProperty",
        title: "Temperature",
        type: "number",
        description: "The current Temperature is in °C",
        minimum: 0,
        maximum: 100,
        unit: "°C",
        readOnly: true,
      })
    );

 
    setInterval(() => {
     
      const newLevel = app.readTemp();
      console.log("setting new Tempearature level:", newLevel);
      this.level.notifyOfExternalUpdate(newLevel);
    }, 3000);
  }
}


class HumiditySensor extends Thing {
  constructor() {
    super(
      "urn:dev:ops:my-humidity-sensor-1234",
      "My Humidity Sensor",
      ["MultiLevelSensor"],
      "A web connected humidity sensor"
    );

    this.level = new Value(0.0);
    this.addProperty(
      new Property(this, "level", this.level, {
        "@type": "LevelProperty",
        title: "Humidity",
        type: "number",
        description: "The current humidity in %",
        minimum: 0,
        maximum: 100,
        unit: "percent",
        readOnly: true,
      })
    );

    setInterval(() => {
    
      const newLevel = app.readHumid();
      console.log("setting new humidity level:", newLevel);
      this.level.notifyOfExternalUpdate(newLevel);
    }, 3000);
  }
}

var app = {
  sensors: [
    {
      name: "Indoor",
      type: 11,
      pin: 27,
    },
  ],
  readTemp: function () {
    for (var sensor in this.sensors) {
      var readout = sensorLib.read(
        this.sensors[sensor].type,
        this.sensors[sensor].pin
      );
      return readout.temperature;
    }
  },
  readHumid: function () {
    for (var sensor in this.sensors) {
      var readout = sensorLib.read(
        this.sensors[sensor].type,
        this.sensors[sensor].pin
      );
      return readout.humidity;
    }
  },
};

function runServer() {

  const led = new LEDWebThing();

  const temperature = new TemperatureSensor();
  const humidity = new HumiditySensor();

  const server = new WebThingServer(
    new MultipleThings([led, temperature, humidity], "LED,Temp & Humid"),
    8888
  );

  process.on("SIGINT", () => {
    server
      .stop()
      .then(() => process.exit())
      .catch(() => process.exit());
  });

  server.start().catch(console.error);
}

runServer();

