const imageUpload = document.getElementById('imageUpload');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const output = document.getElementById('output');
const resSlider = document.getElementById('resolution');
const resValue = document.getElementById('resValue');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');
const contrastSlider = document.getElementById('contrast');
const contrastValue = document.getElementById('contrastValue');
const edgeSlider = document.getElementById('edgeThreshold');
const edgeValue = document.getElementById('edgeValue');
const densitySlider = document.getElementById('density');
const densityValue = document.getElementById('densityValue');

let image = new Image();
let fileLoaded = false;

function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

const debouncedGenerate = debounce(() => {
  if (fileLoaded) generateAsciiArt();
}, 200);



const uploadBtn = document.getElementById("upload-btn");
const imageThumb = document.getElementById("image-thumb");
const filenameSpan = document.getElementById("upload-filename");

uploadBtn.addEventListener("click", () => {
  imageUpload.click(); // trigger hidden file input
});

imageUpload.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  filenameSpan.textContent = file.name;

  const reader = new FileReader();
  reader.onload = function (event) {
    image.src = event.target.result;
  };
  reader.readAsDataURL(file);

  image.onload = () => {
    imageThumb.src = image.src;
    imageThumb.style.display = "block";
    fileLoaded = true;
    // optionally trigger initial generation
    debouncedGenerate();
  };
});


resSlider.addEventListener('input', () => {
  resValue.textContent = resSlider.value;
  debouncedGenerate();
});

contrastSlider.addEventListener('input', () => {
  contrastValue.textContent = parseFloat(contrastSlider.value).toFixed(3);  // 3 decimals
  debouncedGenerate();
});

edgeSlider.addEventListener('input', () => {
  edgeValue.textContent = edgeSlider.value;
  debouncedGenerate();
});

densitySlider.addEventListener('input', () => {
  densityValue.textContent = densitySlider.value;
  debouncedGenerate();
});


function scalePreviewToFit() {
  const wrapper = document.getElementById('previewWrapper');
  const output = document.getElementById('output');

  // Reset transform first to measure original size
  output.style.transform = 'scale(1)';
  
  // Allow the browser to render it first
  requestAnimationFrame(() => {
    const scaleX = wrapper.clientWidth / output.scrollWidth;
    const scaleY = wrapper.clientHeight / output.scrollHeight;
    const scale = Math.min(scaleX, scaleY, 1); // never upscale
    output.style.transform = `scale(${scale})`;
  });
}


function generateAsciiArt() {
  const resolution = parseInt(resSlider.value);
  const contrastFactor = parseFloat(contrastSlider.value);
  const edgeThreshold = parseInt(edgeSlider.value);
  const densityLevel = parseFloat(densitySlider.value) / 200; // e.g. 0.1 to 1
  const fullChars = "@%#*+=-:. ";
  let chars = fullChars.slice(0, Math.max(1, Math.floor(densityLevel * fullChars.length)));

  const aspectRatio = image.height / image.width;
  const charAspectRatio = 0.5;
  const height = Math.floor(resolution * aspectRatio * charAspectRatio);

  canvas.width = resolution;
  canvas.height = height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, resolution, height);

  const containerWidth = previewWrapper.clientWidth;   // in pixels
  const containerHeight = previewWrapper.clientHeight; // in pixels  
  const fontSizeByWidth = containerWidth / resolution;    // approx pixel width per char
  const fontSizeByHeight = containerHeight / height;      // approx pixel height per line  
  // Usually monospace chars are taller than wide, so to keep aspect ratio consistent:
  const minFontSize = 6; // px, minimum readable font size
  const fontSize = Math.max(minFontSize, Math.min(fontSizeByWidth, fontSizeByHeight) * 0.9); // 0.9 for some padding  
  output.style.fontSize = fontSize + 'px';


  const imageData = ctx.getImageData(0, 0, resolution, height);
  const data = imageData.data;

  const lineChars = { vertical: '|', horizontal: '_', diag1: '/', diag2: '\\' };

  function getGray(x, y) {
    if (x < 0 || x >= resolution || y < 0 || y >= height) return 255;
    const i = (y * resolution + x) * 4;
    let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray = (gray - 128) * contrastFactor + 128;
    return Math.min(255, Math.max(0, gray));
  }

  let result = '';

  for (let y = 0; y < height; y++) {
    let row = '';
    for (let x = 0; x < resolution; x++) {
      const gray = getGray(x, y);
      const gx = Math.abs(getGray(x + 1, y) - getGray(x - 1, y));
      const gy = Math.abs(getGray(x, y + 1) - getGray(x, y - 1));

      if (gx > edgeThreshold && gy > edgeThreshold) {
        const gd1 = Math.abs(getGray(x + 1, y + 1) - getGray(x - 1, y - 1));
        const gd2 = Math.abs(getGray(x - 1, y + 1) - getGray(x + 1, y - 1));
        row += gd1 > gd2 ? lineChars.diag1 : lineChars.diag2;
      } else if (gx > edgeThreshold) {
        row += lineChars.vertical;
      } else if (gy > edgeThreshold) {
        row += lineChars.horizontal;
      } else {
        const charIndex = Math.floor((gray / 255) * (chars.length - 1));
        row += chars[charIndex];
      }

    }
    result += row + '\n';
  }

  output.textContent = result;
  scalePreviewToFit();

  copyBtn.style.display = 'block';
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(result).then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = 'Copy Text';
      }, 2000);
    });
  };
}
