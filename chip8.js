var memoryStart = 512;
var steps = 0;
var playing = false;
var runSpeed = 50;
var video = true;

var chip8 = function() {
    this.reset();   
}

var myInstruction = document.querySelector('#instruction');
var myMemory = document.querySelector('#memory');
var myType = document.querySelector('#inst-type');
var myManual = document.querySelector('#manual');
var myCounter = document.querySelector('#counter');
var myStack = document.querySelector('#stack');
var myVRegister = document.querySelector('#vregister');
var myIRegister = document.querySelector('#iregister');
var myDelayTimer = document.querySelector('#delaytimer');
var myHistory = document.querySelector('#history');

var stepButton = document.querySelector('#step-button');
var playButton = document.querySelector('#play-button');
var mySteps = document.querySelector('#steps');

var canvas = document.querySelector('#video');
var ctx = canvas.getContext('2d');
ctx.fillStyle = "red";
ctx.fillRect(0,0,64,32);

document.addEventListener('keyup', function(e){
    if(e.code == "Space"){
        chip.run();
    }
});
stepButton.addEventListener('click', function(){
    chip.run()
});

var keyMap = [];
window.onkeyup = function(e) {keyMap[e.keyCode]=false;}
window.onkeydown = function(e) {keyMap[e.keyCode]=true;}

playButton.addEventListener('click', function(e){
    playButton.classList.toggle('btn-success');
    playButton.classList.toggle('btn-warning');
    playing = !playing;
    if(playing){
        playButton.innerHTML = "Pause";
        chip.run();
    }
    else {
        playButton.innerHTML = "Play";        
    }
});

function isKeyPressed(key){
    var keyCode = 0;
    switch(key){
        case 1:
            keyCode = 97;
            break;
        case 4:
            keyCode = 100;
            break;
        case 12:
            keyCode = 67;
            break;
        case 13:
            keyCode = 68;
            break;
        case 0xc:
    }
    return keyMap[keyCode];
}

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

    // GFX
    this.gfx = new Array(64*32);

    // Delay timer
    this.delayTimer = 0;

    // Sound timer
    this.soundTimer = 0;

    // for debugging purposes
    this.template = "";
    this.manual = "";
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

chip8.prototype.runVideo = function() {
    ctx.fillStyle = "black";
    ctx.fillRect(0,0,320,160);
    ctx.fillStyle = "white";
    for(var pixel = 0; pixel<this.gfx.length;pixel++){
        var x = pixel % 64;
        var y = Math.floor(pixel/64);
        if(this.gfx[pixel]==1){
            console.log(x,y);
            ctx.fillRect(x*5,y*5,5,5);
        }
    }
    console.log(this.gfx);
}

chip8.prototype.runGui = function() {
    var opcode = (this.memory[this.pc] << 8 | this.memory[this.pc + 1]);
    myInstruction.innerHTML = opcode.toString(16);
    myType.innerHTML = this.template;
    myManual.innerHTML = this.manual;
    myCounter.innerHTML = this.pc;
    myStack.innerHTML = this.stack.map(function(i){
        return `<li>${i}</li>`;
    }).join('');    
    myVRegister.innerHTML = this.v.map(function(value, index){
        return `<li><strong>${index}</strong> => ${value}</li>`;
    }).join('');
    myIRegister.innerHTML = this.i;
    myDelayTimer.innerHTML = this.delayTimer;
    var node = document.createElement('LI');
    node.innerHTML = `<code>${opcode.toString(16)}</code>`;
    myHistory.insertBefore(node, myHistory.firstChild);
    myMemory.innerHTML = '\t'+this.memory.map(function(i,v){
        if(v%16==0 && v > 0)
            return(i.toString(16)+'<br/>');
        else
            return i.toString(16);
    }).join('\t');

    mySteps.innerHTML = steps;
}

chip8.prototype.run = function() {
    console.log('running');
    var self = this;
    if(self.delayTimer>0){
        self.delayTimer--;
    }
    steps++;
    var opcode = (self.memory[self.pc] << 8 | self.memory[self.pc + 1]);
    var x = (opcode & 0x0F00) >> 8;
    var y = (opcode & 0x00F0) >> 4;
    var n = (opcode & 0x000F);
    var kk = (opcode & 0x00FF);
    var nnn = (opcode & 0x0FFF);
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
            self.template = "1nnn";
            self.manual = "Jump to location nnn.";
            self.pc = nnn-2;
            break;
        case 2:
            self.template = "2nnn";
            self.manual = "Call subroutine at nnn.";
            self.sp++;
            self.stack[self.sp] = self.pc;
            self.pc = nnn-2;
            break;
        case 3:
            self.template = "3xkk";
            self.manual = "Skip next instruction if Vx = kk.";
                console.log('bep');
                console.log(self.v[x]);
                console.log(kk);
            if (self.v[x] == kk){
                self.pc += 2;
            }
            break;
        case 4:
            self.template = "4xkk";
            self.manual = "Skip next instruction if Vx != kk.";
            if (self.v[x] =! kk){
                self.pc += 2;
            }
            break;
        case 5:
            self.template = "5xy0";
            self.manual = "Skip next instruction if Vx = Vy.";
            if (self.v[x] == self.v[y]){
                self.pc += 2;
            }
            break;
        case 6:
            self.template = "6xkk";
            self.manual = "Set Vx = kk.";
            self.v[x] = kk;
            console.log('6');
            break;
        case 7:
            self.template = "7xkk";
            self.manual = "Set Vx = Vx + kk.";
            self.v[x] = self.v[x] + kk;
            break;
        case 8:
            switch (n){
                case 0:
                    console.log(n);
                    break;
                case 1: 
                    console.log(n);
                    break;
                case 2: 
                    console.log(n);
                    break;
                case 3: 
                    console.log(n);
                    break;
                case 4: 
                    console.log(n);
                    break;
                case 5: 
                    console.log(n);
                    break;
                case 6: 
                    console.log(n);
                    break;
                case 7: 
                    console.log(n);
                    break;
                case 14: 
                    console.log(n);
                    break;
            }
            break;
        case 9:
            console.log('Skip');
            break;
        case 10:
            self.template = "Annn";
            self.manual = "Set I = nnn.";
            self.i = nnn;
            console.log('A');
            break;
        case 11:
            console.log('B');
            break;
        case 12:
            self.template = "Cxkk";
            self.manual = "Set Vx = random byte AND kk.";
            var rand = Math.floor(Math.random()*255);
            self.v[x] = rand & kk;
            break;
        case 13:
            self.template = "Dxyn";
            self.manual = "Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.";
            console.log(self.memory);
            console.log(self.i);
            console.log(n);
            self.v[0xF]=0;
            for(var yline = 0;yline<n;yline++){
                var pixel = self.memory[self.i + yline];
                for(var xline = 0; xline < 8; xline++){
                    if((pixel & (0x80 >> xline)) != 0)
                    {
                        if(self.gfx[(x + xline + ((y + yline) * 64))] == 1){
                            self.v[0xF] = 1;      
                            self.gfx[x + xline + ((y + yline) * 64)] = 0;                           
                        }
                        else {
                            self.gfx[x + xline + ((y + yline) * 64)] = 1;       
                        }
                    }
                }
            }
            self.runVideo();
            console.log('D');
            break;
        case 14:
            self.template = "ExA1";
            self.manual = "Skip next instruction if key with the value of Vx is not pressed.";
            if (!isKeyPressed(self.v[x])){
                self.pc+=2;
            };
            console.log('E');
            break;
        case 15:
            console.log('f');
            switch (kk){
                case 0x07:
                    self.template = "Fx07";
                    self.manual = "Set Vx = delay timer value.";
                    self.v[x] = self.delayTimer;
                    break;
                case 0x15:
                    self.template = "Fx15";
                    self.manual = "Set delay timer = Vx.";
                    self.delayTimer = self.v[x];
                    break;
                case 0x29:
                    self.template = "Fx29";
                    self.manual = "Set I = location of sprite for digit Vx.";
                    self.i = self.v[x]*5;
                    break;
                case 0x33:
                    self.template = "Fx33";
                    self.manual = "Store BCD representation of Vx in memory locations I, I+1, and I+2.";
                    var arr = (""+(self.v[x])).split("").map(function(item){
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
                    self.template = "Fx65";
                    self.manual = "Read registers V0 through Vx from memory starting at location I.";
                    for(var i=0; i<=x;i++){
                        self.v[i] = self.memory[self.i + i];
                    }
                    break;


            }
            break;



    }
    this.runGui();
    self.pc+=2;
    if(playing){
        setTimeout(function(){self.run()},runSpeed);
    }
}

var chip = new chip8();
chip.reset();
chip.load("ROMS/PONG.ch8");
setTimeout(function(){
    chip.run();
}, 500);