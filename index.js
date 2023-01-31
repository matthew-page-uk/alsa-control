const { exec } = require('child_process');

play_devices();
capture_devices();

async function play_devices() {
    const result = await execute('aplay', '-l');
    console.log(deviceParser(result));
}

async function capture_devices() {
    const result = await execute('arecord', '-l');
    console.log(deviceParser(result));
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