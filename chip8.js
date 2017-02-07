var memoryStart = 512;

var chip8 = function() {
    this.reset();   
}

var myInstruction = document.querySelector('#instruction');
var myType = document.querySelector('#inst-type');
var myCounter = document.querySelector('#counter');
var myStack = document.querySelector('#stack');
var myVRegister = document.querySelector('#vregister');
var myIRegister = document.querySelector('#iregister');
var myHistory = document.querySelector('#history');

var stepButton = document.querySelector('#step-button');

document.addEventListener('keyup', function(e){
    if(e.code == "Space"){
        chip.run();
    }
});
stepButton.addEventListener('click', function(){
    chip.run()
});

chip8.prototype.reset = function() {
    // Program counter
    this.pc = memoryStart;

    // Memory
    this.memory = new Array(4096);

    //Load Sprites
    this.loadSprites();

    // Stack
    this.stack = new Array(16);

    // Stack pointer
    this.sp = 0;

    // "V" registers
    this.v = new Array(16);

    // "I" register
    this.i = 0;

    // Delay timer
    this.delayTimer = 0;

    // Sound timer
    this.soundTimer = 0;
}

chip8.prototype.load = function(ROM) {
    var self = this;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", ROM, true);
    xhr.responseType = "arraybuffer";

    xhr.onload = function() {
        var program = new Uint8Array(xhr.response);
        console.log(program);
        for(var i=0;i<program.length;i++){
            self.memory[memoryStart+i] = program[i];
        }
    };

    xhr.send();
}

chip8.prototype.loadSprites = function() {
    var sprites = [
        0xf0, 0x90, 0x90, 0x90, 0xf0, //0
        0x20, 0x60, 0x20, 0x20, 0x70, //1
        0xf0, 0x10, 0xf0, 0x80, 0xf0, //2
        0xf0, 0x10, 0xf0, 0x10, 0xf0, //3
        0x90, 0x90, 0xf0, 0x10, 0x10, //4
        0xf0, 0x80, 0xf0, 0x10, 0xf0, //5
        0xf0, 0x80, 0xf0, 0x90, 0xf0, //6
        0xf0, 0x10, 0x20, 0x40, 0x40, //7
        0xf0, 0x90, 0xf0, 0x90, 0xf0, //8
        0xf0, 0x90, 0xf0, 0x10, 0xf0, //9
        0xf0, 0x90, 0xf0, 0x90, 0x90, //a
        0xe0, 0x90, 0xe0, 0x90, 0xe0, //b
        0xf0, 0x80, 0x80, 0x80, 0xf0, //c
        0xe0, 0x90, 0x90, 0x90, 0xe0, //d
        0xf0, 0x80, 0xf0, 0x80, 0xf0, //e
        0xf0, 0x80, 0xf0, 0x80, 0x80  //f
    ];
    for(var i=0;i<sprites.length;i++){
        this.memory[i] = sprites[i];
        
    }
    console.log('incoming sprites');
    console.log(this.memory);
}

chip8.prototype.runGui = function() {
    var opcode = (this.memory[this.pc] << 8 | this.memory[this.pc + 1]);
    myInstruction.innerHTML = opcode.toString(16);
    myType.innerHTML = (opcode & 0xF000).toString(16);
    myCounter.innerHTML = this.pc;
    myStack.innerHTML = this.stack.map(function(i){
        return `<li>${i}</li>`;
    }).join('');    
    myVRegister.innerHTML = this.v.map(function(value, index){
        return `<li><strong>${index}</strong> => ${value}</li>`;
    }).join('');
    myIRegister.innerHTML = this.i;
    var node = document.createElement('LI');
    node.innerHTML = `<code>${opcode.toString(16)}</code>`;
    myHistory.insertBefore(node, myHistory.firstChild);
}

chip8.prototype.run = function() {
    console.log('running');
    var self = this;
    var opcode = (self.memory[self.pc] << 8 | self.memory[self.pc + 1]);
    if(opcode == 0x00E0){
        console.log("CLS");
    }    
    if(opcode == 0x00EE){
        console.log("RET");
        self.pc = self.stack[self.sp];
    }
    console.log((opcode & 0xF000)>>12);
    console.log('test', ((opcode & 0xF000)>>12));
    switch ((opcode & 0xF000)>>12){
        case 1:
            console.log("jump to ", opcode & 0x0FFF);
            self.pc = (opcode & 0x0FFF).toString(16);
            break;
        case 2:
            self.sp++;
            self.stack[self.sp] = self.pc;
            self.pc = (opcode & 0x0FFF);
            console.log("Calling ", (opcode & 0x0FFF).toString(16));
            break;
        case 3:
            if (self.v[(opcode & 0x0F00)] == (opcode & 0x00FF).toString(16)){
                self.pc += 2;
            }
            console.log("Skipping next; case 3000");
            break;
        case 4:
            if (self.v[(opcode & 0x0F00)] =! (opcode & 0x00FF).toString(16)){
                self.pc += 2;
            }
            console.log("Skipping next; case 4000");
            break;
        case 5:
            if (self.v[(opcode & 0x0F00)] == self.v[(opcode & 0x00F0).toString(16)]){
                self.pc += 2;
            }
            console.log("Skipping next; case 5000");
            break;
        case 6:
            self.v[((opcode & 0x0F00) >> 8)] = (opcode & 0x00FF);
            console.log('6');
            break;
        case 7:
            console.log(opcode & 0x0F00)
            console.log(self.v[(opcode & 0x0F00)])
            console.log((opcode & 0x00FF))
            self.v[(opcode & 0x0F00) >> 8] = self.v[(opcode & 0x0F00) >> 8] + (opcode & 0x00FF);
            console.log('7');
            break;
        case 8:
            console.log('case8')
            console.log((opcode & 0x000F).toString(16));
            break;
        case 9:
            console.log('Skip');
            break;
        case 10:
            self.i = (opcode & 0x0FFF);
            console.log('A');
            break;
        case 11:
            console.log('B');
            break;
        case 12:
            console.log('C');
            break;
        case 13:
            console.log('D');
            break;
        case 14:
            console.log('E');
            break;
        case 15:
            console.log('f');
            console.log((opcode & 0x00FF));
            switch ((opcode & 0x00FF)){
                case 0x29:
                    console.log('sprite#', (opcode & 0x0F00) >> 8);
                    self.i = self.v[(opcode & 0x0F00) >> 8]*5;
                    break;
                case 0x33:
                    var arr = (""+(self.v[(opcode & 0x0F00) >> 8])).split("").map(function(item){
                        return parseInt(item);
                    });
                    while(arr.length<3){
                        arr.unshift(0)
                    }
                    self.memory[self.i + 0] = arr[0];
                    self.memory[self.i + 1] = arr[1];
                    self.memory[self.i + 2] = arr[2];
                    break;
                case 0x65:
                    for(var i=0; i<(opcode & 0x0F00) >> 8;i++){
                        self.v[i] = self.memory[self.i + i];
                    }
                    break;


            }
            break;



    }
    this.runGui();
    self.pc+=2;
}

var chip = new chip8();
chip.reset();
chip.load("ROMS/PONG.ch8");
setTimeout(function(){
    chip.run();
}, 500);