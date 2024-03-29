const { exec } = require('child_process');
const recordMeter = require('./record-meter');

// let level = new recordMeter();
// level.start('plughw:1,0');
// level.on('data', console.log);

// setTimeout(() => {
//     level.destroy();
// }, 5000);

//play_devices();
//capture_devices();
//get_mixerControls(1);
//setLevel(1, 'PCM', 24);
//getLevel(1, 'PCM');

async function setLevel(card, control, value) {
    const result = await (execute('amixer', `-c ${card} sset '${control}' ${value}`));
    return parseMixer(result);
}

async function getLevel(card, control) {
    const result = await (execute('amixer', `-c ${card} sget '${control}'`));
    return parseMixer(result);
}

async function get_mixerControls(card) {
    const result = await (execute('amixer', `-c ${card} scontents`));
    return parseMixer(result);
}

function parseMixer(data) {
    const lines = data.split('\n');
    let controls = [];
    let control = null;

    lines.forEach((line) => {
        if (line.match(/^Simple mixer control/)) {
            if (control) {
                if (control) controls.push(control);
                control = null;
            }

            const name = line.match(/'(.*?)'/)[1];
            control = {
                name,
                state: []
            };
        }

        let channels = line.match(/(?<= channels: ).*/);
        if (channels) {
            control.channels = channels[0].split(' - ');
        }

        let limits = line.match(/(?<= Limits: ).*/);
        if (limits) {
            const parts = limits[0].split(' ');
            if (parts[0] == 'Playback') control.playback = true;
            if (parts[0] == 'Capture') control.capture = true;
            control.min = parts[1];
            control.max = parts[3];
        }

        if (control?.channels) {
            control.channels.forEach((channelName) => {
                let pattern = new RegExp(`(?<= ${channelName}: ).*`, 'g');
                let state = line.match(pattern);
                if (state) {
                    const parts = state[0].split(' ');
                    const status = {
                        channel: channelName,
                        type: parts[0],
                        value: parts[1],
                        percentage: parts[2].match(/\[(.[0-9]?)%\]/)?.[1],
                        dB: parts[3].match(/\[(.*)dB\]/)?.[1],
                        switch: parts[4]
                    };
                    control.state.push(status);
                }
            })
        }
    });

    if (control) controls.push(control);
    return controls;
}

async function play_devices() {
    const result = await execute('aplay', '-l');
    return deviceParser(result);
}

async function capture_devices() {
    const result = await execute('arecord', '-l');
    return deviceParser(result);
}

function deviceParser(data) {
    const devices = [];
    const lines = data.split('\n');

    lines.forEach((line) => {
        if (line.match(/^card [0-9]+:.*\[.*\], device [0-9]+:.*\[.*\]$/)) {
            devices.push(parseDeviceLine(line));
        }
    });

    return devices;
}

function parseDeviceLine(line) {
    const card = line.match(/card (\d+):/)[1];
    const device = line.match(/device (\d+):/)[1];
    const names = line.match(/\[(.*?)\]/g);
    const device_name = names[1].slice(1, -1);
    const soundcard_name = names[0].slice(1, -1);
    return { card, device, device_name, soundcard_name }
}

function execute(cli, command) {
    return new Promise((resolve, reject) => {
        const cmd = `${cli} ${command}`;
        exec(cmd, (error, stdout) => {
            if (error) reject(error);

            let output = stdout.trim();
            resolve(output);
        });
    });
}

module.exports = {
    play_devices,
    capture_devices,
    get_mixerControls,
    setLevel,
    getLevel,
    recordMeter
}