var canvas = document.querySelector('#canvas-1');
const activeCanvas = document.querySelector('.app canvas.active');
var ctx = canvas.getContext('2d');
const activeCtx = activeCanvas.getContext('2d');

var total_pages = 1;
var current_page = 1;

var lastPoint;
var force = 1;
var mouseDown = false;

var activeToolElement = document.querySelector('[data-tool].active');
var activeTool = activeToolElement.dataset.tool;

document.querySelectorAll('[data-tool]').forEach(tool => {
    tool.onclick = function (e) {
        activeToolElement.classList.toggle('active');
        activeToolElement = tool;
        activeToolElement.classList.toggle('active');
        activeTool = activeToolElement.dataset.tool;
    };
});

const swatch = [
    ["#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#d9d9d9", "#efefef", "#f3f3f3", "#ffffff"],
    ["#980000", "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#4a86e8", "#0000ff", "#9900ff", "#ff00ff"],
    ["#e6b8af", "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#c9daf8", "#cfe2f3", "#d9d2e9", "#ead1dc"],
    ["#dd7e6b", "#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9", "#a4c2f4", "#9fc5e8", "#b4a7d6", "#d5a6bd"],
    ["#cc4125", "#e06666", "#f6b26b", "#ffd966", "#93c47d", "#76a5af", "#6d9eeb", "#6fa8dc", "#8e7cc3", "#c27ba0"],
    ["#a61c00", "#cc0000", "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3c78d8", "#3d85c6", "#674ea7", "#a64d79"],
    ["#85200c", "#990000", "#b45f06", "#bf9000", "#38761d", "#134f5c", "#1155cc", "#0b5394", "#351c75", "#741b47"],
    ["#5b0f00", "#660000", "#783f04", "#7f6000", "#274e13", "#0c343d", "#1c4587", "#073763", "#20124d", "#4c1130"]
];
const colorMap = swatch.flat();

var activeShape;

let swatchContainer = document.querySelector('#color-picker');
let colorElements = {};
swatch.forEach(row => {
    let rowElem = document.createElement('div');
    rowElem.classList.add('hstack');
    row.forEach(c => {
        let elem = document.createElement('div');
        elem.classList.add('box');
        elem.classList.add('color-' + c.substr(1));
        elem.style.backgroundColor = c;
        elem.onclick = function (e) {
            colorPicker.dataset.color = c;
            colorPicker.style.color = c;
            if (colorElements[color]) {
                colorElements[color].classList.remove('active');
            }
            color = c;
            elem.classList.toggle('active');
            e.preventDefault();
        };
        colorElements[c] = elem;
        rowElem.appendChild(elem);
    });

    swatchContainer.appendChild(rowElem);
});

function randomColor() {
    return parseInt(Math.random() * colorMap.length);
}

var colorIndex = randomColor();
var color = colorMap[colorIndex];
var colorPicker = document.querySelector('[data-color]');
colorPicker.dataset.color = color;
colorPicker.style.color = color;
colorElements[color].classList.add('active');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    activeCanvas.width = window.innerWidth;
    activeCanvas.height = window.innerHeight;
}

function onPeerData(id, data) {
    let msg = JSON.parse(data);
    if (msg.event === 'draw') {
        draw(msg);
    } else if (msg.event === 'clear' && msg.page == current_page) {
        document.getElementById("canvas-" + current_page).getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    } else if (msg.event == 'change_page') {
        if (msg.page > total_pages) {
            total_pages++;
            const new_canvas = document.createElement("canvas");
            document.querySelector(".app").appendChild(new_canvas);
            new_canvas.id = "canvas-" + msg.page;
            new_canvas.classList.add("hidden");
            new_canvas.width = window.innerWidth;
            new_canvas.height = window.innerHeight;
        }
    }
}

function draw(data) {
    const curr_canvas = document.getElementById("canvas-" + data.page);
    const curr_ctx = curr_canvas.getContext("2d");
    curr_ctx.beginPath();
    curr_ctx.moveTo(data.lastPoint.x, data.lastPoint.y);
    curr_ctx.lineTo(data.x, data.y);
    curr_ctx.strokeStyle = data.color;
    curr_ctx.lineWidth = 2;
    curr_ctx.lineCap = 'round';
    curr_ctx.stroke();
    curr_ctx.closePath();
}

function move(e) {
    mouseDown = e.buttons;
    if (e.buttons) {
        if (!lastPoint) {
            lastPoint = { x: e.offsetX, y: e.offsetY };
            originPoint = { x: e.offsetX, y: e.offsetY };
            return;
        }

        if (activeTool === 'pencil') {
            draw({
                lastPoint,
                x: e.offsetX,
                y: e.offsetY,
                force: force,
                color: color,
                page: current_page
            });

            broadcast(JSON.stringify({
                event: 'draw',
                lastPoint,
                x: e.offsetX,
                y: e.offsetY,
                force: force,
                color: color,
                page: current_page
            }));
        }

        lastPoint = { x: e.offsetX, y: e.offsetY };
    } else {
        lastPoint = undefined;
    }
}

function down(e) {
    originPoint = { x: e.offsetX, y: e.offsetY };
}

function up() {
    if (activeShape) {
        activeShape.page = current_page;
        // drawRect(activeShape, true);
        broadcast(JSON.stringify(Object.assign({
            event: 'drawRect',
            commit: true,
            page: current_page
        }, activeShape)));
        activeShape = undefined;
    }
    lastPoint = undefined;
    originPoint = undefined;
}

function key(e) {
    if (e.key === 'Backspace') {
        document.getElementById("canvas-" + current_page).getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        broadcast(JSON.stringify({
            event: 'clear',
            page: current_page
        }));
    }
    if (e.key === 'ArrowRight') {
        colorIndex++;
    }
    if (e.key === 'ArrowLeft') {
        colorIndex--;
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        if (colorIndex >= colorMap.length) {
            colorIndex = 0;
        }
        if (colorIndex < 0) {
            colorIndex = colorMap.length - 1;
        }
        if (colorElements[color]) {
            colorElements[color].classList.remove('active');
        }
        color = colorMap[colorIndex];
        colorPicker.dataset.color = color;
        colorPicker.style.color = color;
        colorElements[color].classList.toggle('active');
    }
}

function forceChanged(e) {
    force = e.webkitForce || 1;
}

window.onresize = resize;
window.onmousedown = down;
window.onmousemove = move;
window.onmouseup = up;
window.onkeydown = key;

window.onwebkitmouseforcechanged = forceChanged;

resize();


// Handle Pagination
const next_btn = document.getElementById("next-btn");
const prev_btn = document.getElementById("prev-btn");
const page_num = document.getElementById("page-num");

function nextPage() {
    broadcast(JSON.stringify({
        event: 'change_page',
        page: current_page+1
    }));

    console.log(current_page);
    canvas.classList.add("hidden");
    if (current_page >= total_pages) {
        total_pages++;
        current_page++;
        canvas = document.createElement("canvas");
        document.querySelector(".app").appendChild(canvas);
        canvas.id = "canvas-" + current_page;
        resize();
    } else {
        current_page++;
        canvas = document.querySelector(".app #canvas-" + current_page);
        canvas.classList.remove("hidden");
    }
    console.log(current_page);
    ctx = canvas.getContext('2d');
    page_num.innerHTML = current_page;
}

function prevPage() {
    if (current_page > 1) {
        current_page--;
        canvas.classList.add("hidden");
        canvas = document.querySelector(".app #canvas-" + current_page);
        canvas.classList.remove("hidden");
        ctx = canvas.getContext('2d');
        page_num.innerHTML = current_page;
    }
}

next_btn.addEventListener("click", nextPage);
prev_btn.addEventListener("click", prevPage);