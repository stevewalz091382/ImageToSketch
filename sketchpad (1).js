let originalImage = null;
let sketchGenerated = false;
let eraserMode = false;
let isDrawing = false;
let activeCanvas = null;

const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const contentArea = document.getElementById('contentArea');
const originalImg = document.getElementById('originalImg');
const displayCanvas = document.getElementById('displayCanvas');
const outlineDisplayCanvas = document.getElementById('outlineDisplayCanvas');
const processCanvas = document.getElementById('processCanvas');
const outlineCanvas = document.getElementById('outlineCanvas');
const convertBtn = document.getElementById('convertBtn');
const resetBtn = document.getElementById('resetBtn');
const intensitySlider = document.getElementById('intensitySlider');
const intensityValue = document.getElementById('intensityValue');
const downloadShadedBtn = document.getElementById('downloadShadedBtn');
const downloadOutlineBtn = document.getElementById('downloadOutlineBtn');
const eraserToggleBtn = document.getElementById('eraserToggleBtn');
const eraserPanel = document.getElementById('eraserPanel');
const eraserControls = document.getElementById('eraserControls');
const eraserSizeSlider = document.getElementById('eraserSizeSlider');
const eraserSizeValue = document.getElementById('eraserSizeValue');
const undoEraserBtn = document.getElementById('undoEraserBtn');
const shadedPlaceholder = document.getElementById('shadedPlaceholder');
const outlinePlaceholder = document.getElementById('outlinePlaceholder');
const outlineSection = document.getElementById('outlineSection');

uploadArea.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
            originalImage = event.target.result;
            originalImg.src = originalImage;
            uploadArea.classList.add('hidden');
            contentArea.classList.remove('hidden');
            sketchGenerated = false;
        };
        reader.readAsDataURL(file);
    }
});

resetBtn.addEventListener('click', () => {
    originalImage = null;
    sketchGenerated = false;
    eraserMode = false;
    fileInput.value = '';
    uploadArea.classList.remove('hidden');
    contentArea.classList.add('hidden');
    convertBtn.classList.remove('hidden');
    downloadShadedBtn.classList.add('hidden');
    downloadOutlineBtn.classList.add('hidden');
    eraserPanel.classList.add('hidden');
    outlineSection.classList.add('hidden');
    intensitySlider.disabled = true;
    intensitySlider.value = 50;
    intensityValue.textContent = '50%';
});

convertBtn.addEventListener('click', convertToSketch);

intensitySlider.addEventListener('input', (e) => {
    intensityValue.textContent = e.target.value + '%';
    if (sketchGenerated) {
        convertToSketch();
    }
});

eraserToggleBtn.addEventListener('click', () => {
    eraserMode = !eraserMode;
    if (eraserMode) {
        eraserToggleBtn.textContent = 'Enabled';
        eraserToggleBtn.classList.remove('btn-outline-warning');
        eraserToggleBtn.classList.add('btn-warning');
        eraserControls.classList.remove('hidden');
        displayCanvas.classList.add('canvas-cursor-crosshair');
        outlineDisplayCanvas.classList.add('canvas-cursor-crosshair');
    } else {
        eraserToggleBtn.textContent = 'Enable';
        eraserToggleBtn.classList.remove('btn-warning');
        eraserToggleBtn.classList.add('btn-outline-warning');
        eraserControls.classList.add('hidden');
        displayCanvas.classList.remove('canvas-cursor-crosshair');
        outlineDisplayCanvas.classList.remove('canvas-cursor-crosshair');
    }
});

eraserSizeSlider.addEventListener('input', (e) => {
    eraserSizeValue.textContent = e.target.value;
});

undoEraserBtn.addEventListener('click', () => {
    const displayCtx = displayCanvas.getContext('2d');
    displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
    displayCtx.drawImage(processCanvas, 0, 0);

    const outlineDisplayCtx = outlineDisplayCanvas.getContext('2d');
    outlineDisplayCtx.clearRect(0, 0, outlineDisplayCanvas.width, outlineDisplayCanvas.height);
    outlineDisplayCtx.drawImage(outlineCanvas, 0, 0);
});

downloadShadedBtn.addEventListener('click', () => downloadImage('shaded'));
downloadOutlineBtn.addEventListener('click', () => downloadImage('outline'));

displayCanvas.addEventListener('mousedown', (e) => handleCanvasMouseDown(e, 'shaded'));
displayCanvas.addEventListener('mousemove', (e) => handleCanvasMouseMove(e, 'shaded'));
displayCanvas.addEventListener('mouseup', handleCanvasMouseUp);
displayCanvas.addEventListener('mouseleave', handleCanvasMouseUp);
displayCanvas.addEventListener('touchstart', (e) => handleCanvasTouchStart(e, 'shaded'));
displayCanvas.addEventListener('touchmove', (e) => handleCanvasTouchMove(e, 'shaded'));
displayCanvas.addEventListener('touchend', handleCanvasTouchEnd);

outlineDisplayCanvas.addEventListener('mousedown', (e) => handleCanvasMouseDown(e, 'outline'));
outlineDisplayCanvas.addEventListener('mousemove', (e) => handleCanvasMouseMove(e, 'outline'));
outlineDisplayCanvas.addEventListener('mouseup', handleCanvasMouseUp);
outlineDisplayCanvas.addEventListener('mouseleave', handleCanvasMouseUp);
outlineDisplayCanvas.addEventListener('touchstart', (e) => handleCanvasTouchStart(e, 'outline'));
outlineDisplayCanvas.addEventListener('touchmove', (e) => handleCanvasTouchMove(e, 'outline'));
outlineDisplayCanvas.addEventListener('touchend', handleCanvasTouchEnd);

function handleCanvasMouseDown(e, canvasType) {
    if (!eraserMode) return;
    activeCanvas = canvasType;
    isDrawing = true;
    erase(e, canvasType);
}

function handleCanvasMouseMove(e, canvasType) {
    if (!eraserMode || !isDrawing || activeCanvas !== canvasType) return;
    erase(e, canvasType);
}

function handleCanvasMouseUp() {
    isDrawing = false;
    activeCanvas = null;
}

function handleCanvasTouchStart(e, canvasType) {
    if (!eraserMode) return;
    e.preventDefault();
    activeCanvas = canvasType;
    isDrawing = true;
    const touch = e.touches[0];
    erase(touch, canvasType);
}

function handleCanvasTouchMove(e, canvasType) {
    if (!eraserMode || !isDrawing || activeCanvas !== canvasType) return;
    e.preventDefault();
    const touch = e.touches[0];
    erase(touch, canvasType);
}

function handleCanvasTouchEnd(e) {
    e.preventDefault();
    isDrawing = false;
    activeCanvas = null;
}

function erase(e, canvasType) {
    const canvas = canvasType === 'outline' ? outlineDisplayCanvas : displayCanvas;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.beginPath();
    ctx.arc(x, y, parseInt(eraserSizeSlider.value) * scaleX, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function convertToSketch() {
    if (!originalImage) return;

    convertBtn.disabled = true;
    convertBtn.textContent = 'Processing...';

    const img = new Image();
    img.onload = () => {
        const ctx = processCanvas.getContext('2d');
        processCanvas.width = img.width;
        processCanvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, processCanvas.width, processCanvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
        }

        ctx.putImageData(imageData, 0, 0);

        const grayData = ctx.getImageData(0, 0, processCanvas.width, processCanvas.height);
        const edges = ctx.createImageData(processCanvas.width, processCanvas.height);

        const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
        const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

        const intensityFactor = parseInt(intensitySlider.value) / 50;

        for (let y = 1; y < processCanvas.height - 1; y++) {
            for (let x = 1; x < processCanvas.width - 1; x++) {
                let pixelX = 0;
                let pixelY = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = ((y + ky) * processCanvas.width + (x + kx)) * 4;
                        const gray = grayData.data[idx];
                        pixelX += gray * sobelX[ky + 1][kx + 1];
                        pixelY += gray * sobelY[ky + 1][kx + 1];
                    }
                }

                const magnitude = Math.sqrt(pixelX * pixelX + pixelY * pixelY);
                const edgeValue = 255 - Math.min(255, magnitude * intensityFactor);

                const idx = (y * processCanvas.width + x) * 4;
                edges.data[idx] = edgeValue;
                edges.data[idx + 1] = edgeValue;
                edges.data[idx + 2] = edgeValue;
                edges.data[idx + 3] = 255;
            }
        }

        ctx.putImageData(edges, 0, 0);

        displayCanvas.width = processCanvas.width;
        displayCanvas.height = processCanvas.height;
        const displayCtx = displayCanvas.getContext('2d');
        displayCtx.drawImage(processCanvas, 0, 0);

        generateOutlineVersion();

        shadedPlaceholder.classList.add('hidden');
        convertBtn.classList.add('hidden');
        downloadShadedBtn.classList.remove('hidden');
        eraserPanel.classList.remove('hidden');
        outlineSection.classList.remove('hidden');
        intensitySlider.disabled = false;
        sketchGenerated = true;
        convertBtn.disabled = false;
        convertBtn.textContent = 'Convert to Sketch';
    };

    img.src = originalImage;
}

function generateOutlineVersion() {
    const ctx = outlineCanvas.getContext('2d');
    outlineCanvas.width = processCanvas.width;
    outlineCanvas.height = processCanvas.height;

    const sourceData = processCanvas.getContext('2d').getImageData(0, 0, processCanvas.width, processCanvas.height);
    const outlineData = ctx.createImageData(outlineCanvas.width, outlineCanvas.height);

    const threshold = 130;

    for (let i = 0; i < sourceData.data.length; i += 4) {
        const brightness = sourceData.data[i];

        if (brightness < threshold) {
            outlineData.data[i] = 0;
            outlineData.data[i + 1] = 0;
            outlineData.data[i + 2] = 0;
            outlineData.data[i + 3] = 255;
        } else {
            outlineData.data[i] = 255;
            outlineData.data[i + 1] = 255;
            outlineData.data[i + 2] = 255;
            outlineData.data[i + 3] = 255;
        }
    }

    ctx.putImageData(outlineData, 0, 0);

    outlineDisplayCanvas.width = outlineCanvas.width;
    outlineDisplayCanvas.height = outlineCanvas.height;
    const outlineDisplayCtx = outlineDisplayCanvas.getContext('2d');
    outlineDisplayCtx.drawImage(outlineCanvas, 0, 0);

    outlinePlaceholder.classList.add('hidden');
    downloadOutlineBtn.classList.remove('hidden');
}

function downloadImage(version) {
    const sourceCanvas = version === 'shaded' ? displayCanvas : outlineDisplayCanvas;
    const format = document.querySelector('input[name="format"]:checked').value;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = sourceCanvas.width;
    exportCanvas.height = sourceCanvas.height;
    const exportCtx = exportCanvas.getContext('2d');

    if (format === 'jpeg') {
        exportCtx.fillStyle = 'white';
        exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }
    
    exportCtx.drawImage(sourceCanvas, 0, 0);

    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const extension = format === 'jpeg' ? 'jpg' : 'png';
    const quality = format === 'jpeg' ? 0.95 : 1.0;

    const dataUrl = exportCanvas.toDataURL(mimeType, quality);

    const link = document.createElement('a');
    link.download = 'sketch-' + version + '.' + extension;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
