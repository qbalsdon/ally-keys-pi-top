const DOUBLE_FINGER_ROTOR_DISTANCE = 50
const IMAGE_WIDTH = 150;
const IMAGE_HEIGHT = 150;
const ARROW_DEPTH = 25;
const IMAGE_LOCATION = "peripheral/image/";

var ctx = null;
var animationQueue = [];
var animating = false;

const padX = 180;
const padY = 120;
const minX = 0;
const minY = 0;
const maxX = 600;
const maxY = 400;

const midX = 300;
const midY = 200;

const shape_z = [
    { x: minX + padX, y: minY + padY },
    { x: maxX - padX, y: minY + padY },
    { x: minX + padX, y: maxY - padY },
    { x: maxX - padX, y: maxY - padY }
];

const shape_down_left = [
    { x: maxX - padX, y: minY + padY },
    { x: maxX - padX, y: maxY - padY },
    { x: (maxX - minX) / 2, y: maxY - padY }
];

const shape_down_left_arrow = [
    { x: (maxX - minX) / 2 + ARROW_DEPTH, y: (maxY - padY) + ARROW_DEPTH },
    { x: (maxX - minX) / 2, y: maxY - padY },
    { x: (maxX - minX) / 2 + ARROW_DEPTH, y: (maxY - padY) - ARROW_DEPTH },
]

const shape_up_right = [
    { x: minX + padX, y: maxY - padY },
    { x: minX + padX, y: minY + padY },
    { x: (maxX - minX) / 2, y: minY + padY }
];

const shape_up_right_arrow = [
    { x: (maxX - minX) / 2 - ARROW_DEPTH, y: (minY + padY) + ARROW_DEPTH },
    { x: (maxX - minX) / 2, y: minY + padY },
    { x: (maxX - minX) / 2 - ARROW_DEPTH, y: (minY + padY) - ARROW_DEPTH },
]

const shape_z_path = [
    { x: minX + padX, y: minY + padY },
    { x: maxX - padX, y: minX + padY },
    { x: minX + padX, y: maxY - padY },
    { x: maxX - padX, y: maxY - padY },
    { x: maxX - padX - 1, y: maxY - padY },
    { x: maxX - padX - 1 - ARROW_DEPTH, y: maxY - padY - ARROW_DEPTH },
    { x: maxX - padX - 1, y: maxY - padY },
    { x: maxX - padX - 1 - ARROW_DEPTH, y: maxY - padY + ARROW_DEPTH },
];

const shape_arrow_up = [
    { x: minX + padX, y: maxY - padY },
    { x: maxX / 2, y: minY + padY },
    { x: maxX - padX, y: maxY - padY }
];

const shape_arrow_down = [
    { x: minX + padX, y: minY + padY },
    { x: maxX / 2, y: maxY - padY },
    { x: maxX - padX, y: minY + padY }
];

const shape_h = [
    { x: minX + padX, y: midY },
    { x: maxX - padX, y: midY }
];

const shape_h_path_right = [
    { x: minX + padX, y: midY },
    { x: maxX - padX, y: midY },
    { x: maxX - padX - 1, y: midY },
    { x: maxX - padX - 1 - ARROW_DEPTH, y: midY - ARROW_DEPTH },
    { x: maxX - padX - 1, y: midY },
    { x: maxX - padX - 1 - ARROW_DEPTH, y: midY + ARROW_DEPTH },
];

const shape_h_path_left = [
    { x: minX + padX, y: midY },
    { x: maxX - padX, y: midY },
];

const shape_h_path_left_arrow_1 = [
    { x: minX + padX + ARROW_DEPTH, y: midY + ARROW_DEPTH },
    { x: minX + padX, y: midY },
    { x: minX + padX + ARROW_DEPTH, y: midY - ARROW_DEPTH },
]

const shape_h_path_left_arrow_2 = [
    { x: maxX - padX + ARROW_DEPTH, y: midY + ARROW_DEPTH },
    { x: maxX - padX, y: midY },
    { x: maxX - padX + ARROW_DEPTH, y: midY - ARROW_DEPTH },
]

const shape_v = [
    { x: midX, y: minY + padY },
    { x: midX, y: maxY - padY }
];

const shape_v_down_arrow = [
    { x: midX, y: minY + padY },
    { x: midX, y: maxY - padY }, // line end    
];

const shape_v_down_arrow_1 = [
    { x: midX - ARROW_DEPTH, y: maxY - padY - ARROW_DEPTH },
    { x: midX, y: maxY - padY },
    { x: midX + ARROW_DEPTH, y: maxY - padY - ARROW_DEPTH },
];

const shape_v_up_arrow_1 = [
    { x: midX - ARROW_DEPTH, y: maxY - padY + ARROW_DEPTH },
    { x: midX, y: maxY - padY },
    { x: midX + ARROW_DEPTH, y: maxY - padY + ARROW_DEPTH },
];

const shape_v_up_arrow_2 = [
    { x: midX - ARROW_DEPTH, y: minY + padY + ARROW_DEPTH },
    { x: midX, y: minY + padY },
    { x: midX + ARROW_DEPTH, y: minY + padY + ARROW_DEPTH },
];

const VO_BACK = {
    animateFn: (percent, image) => { draw_translate(percent, shape_z, image); },
    drawPathFn: () => { draw_path(shape_z_path); },
    invert: false,
    loops: 1,
    img: `${IMAGE_LOCATION}hand_two.svg`,
    fps: 60
};

const TB_BACK = {
    animateFn: (percent, image) => { draw_translate(percent, shape_down_left, image); },
    drawPathFn: () => {
        draw_path(shape_down_left);
        draw_path(shape_down_left_arrow);
    },
    invert: false,
    loops: 1,
    img: `${IMAGE_LOCATION}hand_one.svg`,
    fps: 60
};

const TB_MENU = {
    animateFn: (percent, image) => { draw_translate(percent, shape_up_right, image); },
    drawPathFn: () => {
        draw_path(shape_up_right);
        draw_path(shape_up_right_arrow);
    },
    invert: false,
    loops: 1,
    img: `${IMAGE_LOCATION}hand_one.svg`,
    fps: 60
};

const SR_NEXT_DEFAULT = {
    animateFn: (percent, image) => { draw_translate(percent, shape_h, image); },
    drawPathFn: () => { draw_path(shape_h_path_right); },
    invert: false,
    loops: 1,
    img: `${IMAGE_LOCATION}hand_one.svg`,
    fps: 100
};

const SR_PREV_DEFAULT = {
    animateFn: (percent, image) => { draw_translate(percent, shape_h, image); },
    drawPathFn: () => {
        draw_path(shape_h_path_left);
        draw_path(shape_h_path_left_arrow_1);
    },
    invert: true,
    loops: 1,
    img: `${IMAGE_LOCATION}hand_one.svg`,
    fps: 100
};

const SR_NEXT_GRANULARITY = {
    animateFn: (percent, image) => { draw_translate(percent, shape_v, image); },
    drawPathFn: () => {
        draw_path(shape_v_down_arrow);
        draw_path(shape_v_down_arrow_1);
    },
    invert: false,
    loops: 1,
    img: `${IMAGE_LOCATION}hand_one.svg`,
    fps: 100
};

const SR_PREV_GRANULARITY = {
    animateFn: (percent, image) => { draw_translate(percent, shape_v, image); },
    drawPathFn: () => {
        draw_path(shape_v);
        draw_path(shape_v_up_arrow_2);
    },
    invert: true,
    loops: 1,
    img: `${IMAGE_LOCATION}hand_one.svg`,
    fps: 100
};

const TB_GRANULARITY_CHOOSE_V_UP = {
    animateFn: (percent, image) => { draw_translate(percent, shape_arrow_up, image); },
    drawPathFn: () => {
        draw_path(shape_arrow_up);
    },
    invert: false,
    loops: 1,
    img: `${IMAGE_LOCATION}hand_one.svg`,
    fps: 100
};

const TB_GRANULARITY_CHOOSE_V_DOWN = {
    animateFn: (percent, image) => { draw_translate(percent, shape_arrow_down, image); },
    drawPathFn: () => { draw_path(shape_arrow_down); },
    invert: false,
    loops: 1,
    img: `${IMAGE_LOCATION}hand_one.svg`,
    fps: 100
};

const TB_GRANULARITY_CHOOSE_3_LEFT = {
    animateFn: (percent, image) => { draw_translate(percent, shape_h, image); },
    drawPathFn: () => {
        const space = padX / 2;

        draw_path(shape_h_path_left);
        draw_path(shape_h_path_left_arrow_1);

        draw_path(shape_h_path_left, 0, -space);
        draw_path(shape_h_path_left_arrow_1, 0, -space);

        draw_path(shape_h_path_left, 0, space);
        draw_path(shape_h_path_left_arrow_1, 0, space);
    },
    invert: true,
    loops: 1,
    img: `${IMAGE_LOCATION}hand_three.svg`,
    fps: 100
};

const TB_GRANULARITY_CHOOSE_3_RIGHT = {
    animateFn: (percent, image) => { draw_translate(percent, shape_h, image); },
    drawPathFn: () => {
        const space = padX / 2;
        draw_path(shape_h_path_right);

        draw_path(shape_h_path_right, 0, -space);
        draw_path(shape_h_path_right, 0, space);
    },
    invert: false,
    loops: 1,
    img: `${IMAGE_LOCATION}hand_three.svg`,
    fps: 100
};

const VO_ROTOR_1_NEXT = {
    animateFn: (percent, image) => { draw_rotate(percent, image); },
    drawPathFn: () => { },
    invert: false,
    loops: 1,
    img: `${IMAGE_LOCATION}hand_one_rotate.svg`,
    fps: 100
};

const VO_ROTOR_1_PREV = {
    animateFn: (percent, image) => { draw_rotate(percent, image); },
    drawPathFn: () => { },
    invert: true,
    loops: 1,
    img: `${IMAGE_LOCATION}hand_one_rotate_inv.svg`,
    fps: 100
};

const VO_ROTOR_2_NEXT = {
    animateFn: (percent, image) => {
        draw_translate(percent, shape_v, image, false, DOUBLE_FINGER_ROTOR_DISTANCE);
        draw_translate(percent, shape_v, image, true, -DOUBLE_FINGER_ROTOR_DISTANCE);
    },
    drawPathFn: () => {
        draw_path(shape_v, DOUBLE_FINGER_ROTOR_DISTANCE);
        draw_path(shape_v_down_arrow_1, DOUBLE_FINGER_ROTOR_DISTANCE);
        draw_path(shape_v, -DOUBLE_FINGER_ROTOR_DISTANCE);
        draw_path(shape_v_up_arrow_2, -DOUBLE_FINGER_ROTOR_DISTANCE);
    },
    invert: false,
    loops: 1,
    img: `${IMAGE_LOCATION}hand_one.svg`,
    fps: 100
};

const SR_ACTIVATE = {
    animateFn: (percent, image) => {
        draw_activate(percent, image);
    },
    drawPathFn: () => { },
    invert: false,
    loops: 1,
    img: `${IMAGE_LOCATION}hand_one.svg`,
    fps: 100
};

const VO_ROTOR_2_PREV = {
    animateFn: (percent, image) => {
        draw_translate(percent, shape_v, image, false, DOUBLE_FINGER_ROTOR_DISTANCE);
        draw_translate(percent, shape_v, image, true, -DOUBLE_FINGER_ROTOR_DISTANCE);
    },
    drawPathFn: () => {
        draw_path(shape_v, DOUBLE_FINGER_ROTOR_DISTANCE);
        draw_path(shape_v, -DOUBLE_FINGER_ROTOR_DISTANCE);
        draw_path(shape_v_up_arrow_2, DOUBLE_FINGER_ROTOR_DISTANCE);
        draw_path(shape_v_down_arrow_1, -DOUBLE_FINGER_ROTOR_DISTANCE);
    },
    invert: true,
    loops: 1,
    img: `${IMAGE_LOCATION}hand_one.svg`,
    fps: 100
};

const ANIMATION_TAG_MAP = new Map();
ANIMATION_TAG_MAP.set("trigger_vo_nav_back", VO_BACK);
ANIMATION_TAG_MAP.set("trigger_tb_nav_back", TB_BACK);
ANIMATION_TAG_MAP.set("trigger_tb_nav_menu", TB_MENU);
ANIMATION_TAG_MAP.set("trigger_nav_prev", SR_PREV_DEFAULT);
ANIMATION_TAG_MAP.set("trigger_nav_next", SR_NEXT_DEFAULT);
ANIMATION_TAG_MAP.set("trigger_nav_activate", SR_ACTIVATE);
ANIMATION_TAG_MAP.set("trigger_rotor_option_prev", VO_ROTOR_1_PREV);
ANIMATION_TAG_MAP.set("trigger_rotor_option_next", VO_ROTOR_1_NEXT);
ANIMATION_TAG_MAP.set("trigger_rotor_option_prev_alt", VO_ROTOR_2_PREV);
ANIMATION_TAG_MAP.set("trigger_rotor_option_next_alt", VO_ROTOR_2_NEXT);
ANIMATION_TAG_MAP.set("trigger_rotor_select_prev", SR_PREV_GRANULARITY);
ANIMATION_TAG_MAP.set("trigger_rotor_select_next", SR_NEXT_GRANULARITY);
ANIMATION_TAG_MAP.set("trigger_granularity_select_prev", TB_GRANULARITY_CHOOSE_3_LEFT);
ANIMATION_TAG_MAP.set("trigger_granularity_select_next", TB_GRANULARITY_CHOOSE_3_RIGHT);
ANIMATION_TAG_MAP.set("trigger_granularity_select_prev_2", TB_GRANULARITY_CHOOSE_V_DOWN);
ANIMATION_TAG_MAP.set("trigger_granularity_select_next_2", TB_GRANULARITY_CHOOSE_V_UP);

let animationPopup = null;
const ANIMATION_ID = 'animation-canvas';
const windowParams = `scrollbars=no,resizable=no,status=no,location=no,toolbar=no,menubar=no,width=${maxX},height=${maxY},left=100,top=100`;

function showAnimation(animation_tag, openWindow) {
    if (!ANIMATION_TAG_MAP.has(animation_tag)) { return };
    log(`showAnimation(animation_tag='${animation_tag}', openWindow='${openWindow}')`);
    if (animationPopup === null) {
        if (openWindow) {
            showAnimationWindow();
        } else {
            return;
        }
    }

    startAnimation(ANIMATION_TAG_MAP.get(animation_tag));
}

function showAnimationWindow() {
    animationPopup = window.open("about:blank", "Animations", windowParams);
    animationPopup.document.write(`
    <html>
      <head>
        <title>Animations</title>
        <link rel="stylesheet" href="peripheral/style/colours.css">
        <link rel="stylesheet" href="peripheral/style/main.css">
        <body>
          <canvas id="${ANIMATION_ID}" width="${maxX}" height="${maxY}"></canvas>          
        </body>        
    </html>
    `);

    animationPopup.window.addEventListener('beforeunload', () => {
        animationPopup = null;
    });
}

function getAnimationImage(animObj) {
    if (document.body.classList.contains("dark-mode")) {
        return animObj.img.replace(".svg", "_dark.svg");
    } else {
        return animObj.img
    }
}

function startAnimation(animObj) {
    if (
        (document.body.classList.contains("dark-mode") && !animationPopup.document.body.classList.contains("dark-mode")) ||
        (!document.body.classList.contains("dark-mode") && animationPopup.document.body.classList.contains("dark-mode"))
    ) {
        animationPopup.document.body.classList.toggle('dark-mode');
    }
    let canvas = animationPopup.document.getElementById(ANIMATION_ID)
    ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, maxX, maxY);
    var animationImage = new Image();
    animationImage.onload = () => {
        animationQueue.push(() => {
            animate(
                (percent) => { animObj.animateFn(percent, animationImage); },
                () => { animObj.drawPathFn(); },
                animObj.invert,
                0,
                animObj.loops,
                animObj.fps
            );
        });
        if (!animating) {
            animating = true;
            animationQueue.shift()();
        }
    };
    animationImage.src = getAnimationImage(animObj);
}

function animate(animateFn, pathFn, invert, percent, loops, fps) {
    if (loops <= 0) {
        if (animationQueue.length == 0) {
            animating = false;
        } else {
            animationQueue.shift()();
        }
        return;
    }
    var percent = percent + 1;
    if (percent >= 100) {
        percent = 0;
        loops -= 1;
    }

    ctx.clearRect(0, 0, maxX, maxY);
    if (percent) {
        pathFn();
        if (invert) {
            animateFn(100 - percent);
        } else {
            animateFn(percent);
        }
    }

    setTimeout(function () {
        requestAnimationFrame(() => { animate(animateFn, pathFn, invert, percent, loops, fps) });
    }, 1000 / fps);
}

function getStrokColor() {
    if (document.body.classList.contains("dark-mode")) { return '#f5a142' } else { return '#f5bf42' }
}

function draw_path(path, x_offset = 0, y_offset = 0) {
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.strokeStyle = getStrokColor();
    ctx.moveTo(path[0].x + x_offset, path[0].y + y_offset);
    for (var i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x + x_offset, path[i].y + y_offset);
    }
    ctx.stroke();
}
function mapNumber(number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

function draw_activate(percent, animationImage) {
    const radius = 20;
    const cenX = maxX / 2;
    const cenY = maxY / 2;
    const sine = mapNumber((percent % 50) * 1.0, 0, 50.0, 0.0, Math.PI);
    const scale = 1 + (Math.sin(sine) / 2);

    if (percent > 10 && scale <= 1.3) {
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.strokeStyle = getStrokColor();
        ctx.arc(cenX + (IMAGE_WIDTH / 12), cenY - (IMAGE_HEIGHT / 4), radius, 0, 2 * Math.PI);
        ctx.stroke();
    }

    drawPointer(
        animationImage,
        cenX,
        cenY,
        25,
        IMAGE_WIDTH * scale,
        IMAGE_HEIGHT * scale);
}

function draw_translate(percent, path, animationImage, invert = false, x_offset = 0) {
    if (invert) {
        percent = 100 - percent;
    }

    if (userSettings.reduce_motion) { percent = 50; }

    // find along which segment you should be based on progress
    var segmentPercent = 100 / (path.length - 1);
    const startIndex = (path.length == 2) ? 0 : Math.floor(percent / segmentPercent);

    const lineStart = path[startIndex];
    const lineEnd = path[startIndex + 1];

    // calculate the percent distance along the segment
    const mappedPercent = (percent - (startIndex * segmentPercent)) * 1.0 / segmentPercent;

    const posX = (mappedPercent * ((lineEnd.x + x_offset) - (lineStart.x + x_offset))) + (lineStart.x + x_offset);
    const posY = (mappedPercent * (lineEnd.y - lineStart.y)) + lineStart.y;

    drawPointer(animationImage, posX, posY);
}

function draw_rotate(percent, animationImage) {
    if (userSettings.reduce_motion) { percent = 50; }
    const rotation = mapNumber(percent, 0, 99, 0, 90);
    drawPointer(animationImage, maxX / 2, maxY / 2, rotation);
}

function drawPointer(animationImage, x, y, rotation = 0, imageWidth = IMAGE_WIDTH, imageHeight = IMAGE_HEIGHT) {
    ctx.save();
    const cenX = x - (imageWidth / 2);
    const cenY = y - (imageHeight / 2);
    ctx.translate(maxX / 2, maxY / 2);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.translate(-(maxX / 2), -(maxY / 2));

    ctx.drawImage(
        animationImage,
        cenX,
        cenY,
        imageWidth,
        imageHeight
    );
    ctx.restore();
}