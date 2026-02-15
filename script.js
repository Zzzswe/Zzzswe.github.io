/**
 * 新年烟花特效脚本
 * 功能：
 * 1. 初始阶段：发射烟花，爆炸后粒子逐渐汇聚成“新年快乐”四个字。
 * 2. 持续阶段：随机发射五彩缤纷的烟花。
 * 3. 伴随效果：屏幕随机飘出祝福语。
 */

const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');
const blessingsContainer = document.getElementById('blessings-container');

let width, height;
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const particles = [];
const fireworks = [];
const textParticles = [];

const blessings = [
    "万事如意", "心想事成", "身体健康", "笑口常开",
    "步步高升", "财源广进", "大吉大利", "年年有余",
    "岁岁平安", "合家欢乐", "龙马精神", "前程似锦",
    "新春快乐", "心平气和", "好运连连", "梦想成真"
];

// 基础爆炸粒子类
class Particle {
    constructor(x, y, color, velocity) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
        this.friction = 0.95;
        this.gravity = 0.1;
        this.size = Math.random() * 2 + 1;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.velocity.y += this.gravity;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.01;
    }
}

// 烟花火箭类
class Firework {
    constructor(x, y, targetY, color) {
        this.x = x;
        this.y = height;
        this.targetY = targetY;
        this.color = color;
        // 向上飞行的初速度
        this.velocity = { 
            x: (Math.random() - 0.5) * 2, 
            y: -Math.random() * 5 - 12 
        };
        this.alive = true;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // 绘制尾迹
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.velocity.x * 2, this.y - this.velocity.y * 2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.y += 0.15; // 重力影响

        if (this.velocity.y >= 0 || this.y <= this.targetY) {
            this.explode();
            this.alive = false;
        }
    }

    explode() {
        const particleCount = 80 + Math.random() * 40;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i;
            const speed = Math.random() * 6 + 2;
            particles.push(new Particle(this.x, this.y, this.color, {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            }));
        }
    }
}

// 文字粒子类：具有汇聚效果
class TextParticle {
    constructor(x, y, color) {
        // 初始位置在屏幕中心（模拟爆炸起点）
        this.x = width / 2;
        this.y = height / 2;
        this.dest = { x, y };
        this.color = color;
        
        // 初始爆炸速度
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 10 + 5;
        this.velocity = { 
            x: Math.cos(angle) * speed, 
            y: Math.sin(angle) * speed 
        };
        
        this.friction = 0.95;
        this.alpha = 0;
        this.active = true;
        this.life = 1200; // 延长寿命
        this.gathering = false; // 是否开始汇聚
        
        // 延迟一段时间后开始汇聚
        setTimeout(() => {
            this.gathering = true;
        }, 1000);
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        if (this.gathering) {
            // 模拟汇聚的物理效果
            let dx = this.dest.x - this.x;
            let dy = this.dest.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            
            let force = distance * 0.02; // 增加汇聚力
            let angle = Math.atan2(dy, dx);
            
            this.velocity.x += Math.cos(angle) * force;
            this.velocity.y += Math.sin(angle) * force;
            this.friction = 0.85; // 汇聚时增加阻力防止震荡
        }
        
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        
        if (this.alpha < 1) this.alpha += 0.05;
        
        this.life--;
        if (this.life < 100) {
            this.alpha -= 0.01;
            if (this.alpha <= 0) this.active = false;
        }
    }
}

// 获取文字的像素坐标点
function getTextPoints(text) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = width;
    tempCanvas.height = height;
    
    // 设置文字样式
    const fontSize = Math.min(width / (text.length + 1), height / 3);
    tempCtx.font = `bold ${fontSize}px "Microsoft YaHei", "SimHei"`;
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    tempCtx.fillText(text, width / 2, height / 2);
    
    const imageData = tempCtx.getImageData(0, 0, width, height).data;
    const points = [];
    const step = Math.max(4, Math.floor(width / 400)); // 根据屏幕宽度调整采样密度
    
    for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
            const index = (y * width + x) * 4;
            if (imageData[index + 3] > 128) {
                points.push({ x, y });
            }
        }
    }
    return points;
}

let stage = 0; // 0: 等待, 1: 文字烟花, 2: 自由烟花 + 祝福语
let timer = 0;

function spawnTextFirework() {
    // 先发射一个大火箭到中心爆炸
    const centerFirework = new Firework(width / 2, height, height / 2, "#fff");
    fireworks.push(centerFirework);
    
    // 延迟爆炸后生成文字粒子
    setTimeout(() => {
        const points = getTextPoints("新年快乐");
        points.forEach(p => {
            const hue = Math.random() * 60 + 330; 
            textParticles.push(new TextParticle(p.x, p.y, `hsl(${hue}, 100%, 60%)`));
        });
    }, 1000);
}

function spawnBlessing() {
    const blessing = blessings[Math.floor(Math.random() * blessings.length)];
    const el = document.createElement('div');
    el.className = 'blessing';
    el.innerText = blessing;
    // 随机水平位置
    el.style.left = (Math.random() * 80 + 10) + '%';
    blessingsContainer.appendChild(el);
    
    // 动画结束后移除 DOM
    setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
    }, 10000);
}

function animate() {
    // 渐隐效果形成拖尾
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, width, height);
    
    timer++;
    
    // 阶段切换逻辑
    if (stage === 0 && timer > 60) {
        spawnTextFirework();
        stage = 1;
        timer = 0;
    }
    
    // 5秒后进入第二阶段（自由烟花）
    if (stage === 1 && timer > 400) {
        stage = 2;
        timer = 0;
    }
    
    if (stage === 2) {
        // 随机产生普通烟花
        if (Math.random() < 0.05) {
            const x = Math.random() * width;
            const targetY = Math.random() * height * 0.5;
            const color = `hsl(${Math.random() * 360}, 100%, 60%)`;
            fireworks.push(new Firework(x, height, targetY, color));
        }
        
        // 随机产生飘浮祝福语
        if (Math.random() < 0.015) {
            spawnBlessing();
        }
    }
    
    // 更新和绘制普通烟花
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        fireworks[i].draw();
        if (!fireworks[i].alive) fireworks.splice(i, 1);
    }
    
    // 更新和绘制爆炸碎片粒子
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].alpha <= 0) particles.splice(i, 1);
    }
    
    // 更新和绘制文字粒子
    for (let i = textParticles.length - 1; i >= 0; i--) {
        textParticles[i].update();
        textParticles[i].draw();
        if (!textParticles[i].active) textParticles.splice(i, 1);
    }
    
    requestAnimationFrame(animate);
}

// 启动动画
animate();
