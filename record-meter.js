const { spawn } = require('child_process');
const { EventEmitter } = require('events');

class recordMeter extends EventEmitter {
    constructor() {
        super();
        this.child = null;
    }

    start(device) {
        this.child = spawn('arecord', [
            '-vvq',
            '-V', 'mono',
            '-D', device,
            '/dev/null'
        ]);

        this._running();
    }

    stop() {
        this.child.kill();
    }

    _running() {
        this.child.stderr.on('data', (data) => {
            const line = data.toString();
            if (line.indexOf('| ') == 52) {
                let percentage = line.substr(54, 2);
                if (percentage == 'MA') percentage = 100;
                percentage = parseInt(percentage);
                this.updateLevel(percentage);
            }
            // console.log(line, line.indexOf('|'), line.indexOf('%'));
        });
    }

    updateLevel(percentage) {
        this.emit('data', percentage);
    }
}

module.exports = recordMeter;