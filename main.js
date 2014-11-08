
var gl;
var canvas;

function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}


function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}


var shaderProgram;

function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.uSamplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
}


var mvMatrix = mat4.create();
var pMatrix = mat4.create();

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}


var starVertexPositionBuffer;
var starVertexColorBuffer;


function initBuffers() {
    starVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, starVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex_data), gl.STATIC_DRAW);
    starVertexPositionBuffer.itemSize = 3;
    starVertexPositionBuffer.numItems = vertex_data.length / 3;

    starVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, starVertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color_data), gl.STATIC_DRAW);
    starVertexColorBuffer.itemSize = 4;
    starVertexColorBuffer.numItems = color_data.length / 4;
}

var starTexture;

function initTextures() {
    starTexture = gl.createTexture();
    var image = new Image();
    image.onload = function() { handleTextureLoaded(image, starTexture); }
    image.src = "image.png";
}

function handleTextureLoaded(image, texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
    requestUpdate();
}

var rotationXAcceleration = 0;
var rotationYAcceleration = 0;
var rotationXVelocity = 0;
var rotationYVelocity = 0;
var rotationX = 0;
var rotationY = 0;
var position = vec3.fromValues(1.5,0,7);
var direction
var zAcceleration = 0;
var zDirection = 0;
var prevPos;
var prevTime = performance.now();
var animationFrameHandle;

function updatePosition(rotationMatrix) {
    var curTime = performance.now();
    var diffTime = curTime - prevTime;

    rotationXVelocity += rotationXAcceleration;
    rotationXVelocity *= Math.pow(.5, diffTime/1000.0);
    rotationX += rotationXVelocity;
    rotationYVelocity += rotationYAcceleration;
    rotationYVelocity *= Math.pow(.5, diffTime/1000.0);
    rotationY += rotationYVelocity;
    console.log(rotationX);
    zDirection += zAcceleration * diffTime / 1000.0
    zDirection *= Math.pow(.5, diffTime/1000);
    var direction = vec3.fromValues(0, 0, zDirection);
    vec3.rotateX(direction, direction, vec3.create(), -rotationX);
    vec3.rotateY(direction, direction, vec3.create(), -rotationY);
    vec3.scale(direction, direction, (curTime - diffTime) *.0001);
    console.log(direction);
    vec3.add(position, position, direction);
    prevTime = curTime;
}

function drawScene() {
    mat4.identity(mvMatrix);

    mat4.rotate(mvMatrix, mvMatrix, rotationX, [1, 0, 0])
    mat4.rotate(mvMatrix, mvMatrix, rotationY, [0, 1, 0])
    updatePosition(mvMatrix);
    console.log(position);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 1, 10000.0);


    mat4.translate(mvMatrix, mvMatrix, vec3.negate(vec3.create(), position));
    gl.bindBuffer(gl.ARRAY_BUFFER, starVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, starVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, starVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, starVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, starTexture);
    gl.uniform1i(gl.uSamplerUniform, 0);
    gl.drawArrays(gl.POINTS, 0, starVertexPositionBuffer.numItems);
    animationFrameHandle = null;
    if (zDirection || rotationYVelocity || rotationXVelocity) {
        requestUpdate();
    }
}

function mouseDown(event) {
    oldMouseX = event.x;
    oldMouseY = event.y
    document.addEventListener("mousemove", mouseMove);
}

function requestUpdate() {
    if (!animationFrameHandle) {
        animationFrameHandle = requestAnimationFrame(drawScene);
    }
}

var oldMouseX;
var oldMouseY;
function mouseMove(event) {
    var dx = event.x - oldMouseX;
    var dy = event.y - oldMouseY;
    rotationY += dx * .001;
    rotationX += dy * .001;
    requestUpdate();
}

function mouseUp() {
    document.removeEventListener("mousemove", mouseMove);
}

function keyDown(event) {
    if (event.keyCode==38) {
        event.preventDefault();
        zAcceleration = -0.5;
    }
    if (event.keyCode == 40) {
        event.preventDefault();
        zAcceleration = 0.5;
    }
    if (event.keyCode == 37) {
        event.preventDefault();
        rotationYAcceleration = -0.001;
        console.log("hi");
    }
    if (event.keyCode == 39) {
        event.preventDefault();
        rotationYAcceleration = 0.001
    }

    if (event.keyCode == 'A'.charCodeAt(0)) {
        event.preventDefault();
        rotationXAcceleration = -0.001;
    }
    if (event.keyCode == 'Z'.charCodeAt(0)) {
        event.preventDefault();
        rotationXAcceleration = 0.001;
    }
    requestUpdate();
}

function keyUp(event) {
    event.preventDefault();
    if (event.keyCode==38) {
        event.preventDefault();
        zAcceleration = 0;
    }
    if (event.keyCode == 40) {
        event.preventDefault();
        zAcceleration = 0;
    }
    if (event.keyCode == 37) {
        event.preventDefault();
        rotationYAcceleration = 0;
    }
    if (event.keyCode == 39) {
        event.preventDefault();
        rotationYAcceleration = 0;
    }

    if (event.keyCode == 'A'.charCodeAt(0)) {
        event.preventDefault();
        rotationXAcceleration = 0;
    }
    if (event.keyCode == 'Z'.charCodeAt(0)) {
        event.preventDefault();
        rotationXAcceleration = 0;
    }
}

function initEvents() {
    //canvas.addEventListener("mousedown", mouseDown);
    //document.addEventListener("mouseup", mouseUp);
    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);
}



function webGLStart() {
    canvas = document.getElementById("canvas");
    initGL(canvas);
    initShaders();
    initBuffers();
    initTextures();
    initEvents();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    //gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
}
