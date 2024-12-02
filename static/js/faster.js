window.addEventListener('load', async () => {
  function preloadImages() {
    const blackswan_imageSrc = (i) => `static/demo/blackswan/${String(i).padStart(5, '0')}.jpg`;
    const flows_imageSrc = (i) => `static/demo/flows/${String(i).padStart(5, '0')}.png`;
    const flows_maskSrc = (i) => `static/demo/flows/${String(i).padStart(5, '0')}_occ.png`
    // const swing_imageSrc = (i) => `static/demo/blackswan/${String(i).padStart(5, '0')}.jpg`

    // const flows_imageSrc = (i) => `static/demo/mask/${String(i).padStart(5, '0')}.png`;
    // const flows_maskSrc = (i) => `static/demo/occ/${String(i).padStart(5, '0')}.png`
    const swing_imageSrc = (i) => `static/demo/swing/${String(i).padStart(5, '0')}.jpg`

    function preload(srcGetter) {
      result = [];
      for (var i = 0; i < 60; i++) {
        const img = new Image();
        img.src = srcGetter(i);
        result.push(img);
      }
      return result;
    }

    return {
      blackswan: preload(blackswan_imageSrc),
      flow: preload(flows_imageSrc),
      mask: preload(flows_maskSrc),
      swing: preload(swing_imageSrc)
    }
  }

  async function loadAndParseJSON(url) {
    try {
      // 使用 fetch 获取 JSON 文件
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      // 解析响应为 JSON 格式
      const data = await response.json();
      // console.log('JSON Data:', data);

      // 现在你可以使用 data 进行进一步的操作
      return data;
    } catch (error) {
      console.error('There has been a problem with your fetch operation:', error);
    }
  }

  function findNearestPoint(data, imgIndex, targetX, targetY) {
    // 检查图像索引是否有效
    if (imgIndex < 0 || imgIndex >= data.length) {
      throw new Error("Invalid image index.");
    }

    // 获取指定图像的所有点的坐标和可见性
    const points = data[imgIndex];

    let nearestPoint = null;
    let minDistanceSquared = Infinity;
    let nearestIndex = -1;

    // 遍历每个点以找到最接近的目标点
    for (let i = 0; i < points.length; i++) {
      const [x, y, visibility] = points[i];

      // 只考虑可见的点（假设可见性标志为 1 表示可见）
      // 计算距离平方（避免开方运算以提高效率）
      const distanceSquared = Math.pow(x - targetX, 2) + Math.pow(y - targetY, 2);

      // 更新最近点信息如果当前点更近
      if (distanceSquared < minDistanceSquared) {
        minDistanceSquared = distanceSquared;
        nearestPoint = {x, y};
        nearestIndex = i;
      }
  // console.log("-----------------")
  //
  // console.log(nearestIndex,minDistanceSquared)
  // console.log(x,y)
  // console.log(targetX,targetY)

    }

    // 返回最接近点的坐标及其索引
    return nearestIndex;
  }


// 调用函数并传入 JSON 文件的 URL
  const data = await loadAndParseJSON('static/demo/kpts.json');
// window.data = data;

  images = preloadImages();

  // slide follow animation
  function displayFramesWithSlider(framePathPrefix, totalFrames) {
    const frame = document.getElementById("frame");
    const slider = document.getElementById("slider");
    const sliderLabel = document.getElementById("slider-label");

    // init slider
    slider.setAttribute("max", totalFrames);
    slider.setAttribute("min", 1);

    slider.addEventListener("input", function () {
      const frameIndex = slider.value;
      const framePath = framePathPrefix + String(frameIndex).padStart(5, '0') + ".jpg";
      frame.src = framePath;
      // sliderLabel.textContent = "Slider: " + frameIndex;
    });
  }

  // Usage
  displayFramesWithSlider("static/demo/blackswan/", 49); // Example with 100 frames
  // displayFramesWithSlider("static/demo/blackswan", 49); // Example with 100 frames

  const imageBoard1 = document.querySelectorAll('.image-board')[0];
  const clickableImage1 = imageBoard1.querySelector('.clickable-image');
  const imageBoard2 = document.querySelectorAll('.image-board')[1];
  const clickableImage2 = imageBoard2.querySelector('.clickable-image');
  const initialDot = document.getElementById('initial-dot');
  const slider = document.getElementById('slider');
  const clearBtn = document.getElementById('clear-btn');
  clearBtn.addEventListener('click', function () {
    // remove original dot & add a fixed dot
    const existingDots1 = imageBoard1.querySelectorAll('.dot');
    existingDots1.forEach(dot => imageBoard1.removeChild(dot));
    const existingDots2 = imageBoard2.querySelectorAll('.dot');
    existingDots2.forEach(dot => imageBoard2.removeChild(dot));
    const existingCross2 = imageBoard2.querySelectorAll('.cross');
    existingCross2.forEach(cross => imageBoard2.removeChild(cross));
  })

  const padX = clickableImage1.offsetLeft;
  const padY = clickableImage1.offsetLeft;
  console.log("offsetLeft",padX, padY);
  const dotRadius = 6;
  const crossRadius = 6;
  // console.log('@@padX', padX);
  // console.log('@@padY', padY);
  let RandColor = getRandomColor();
  initialDot.style.backgroundColor = RandColor;
  clickableImage1.addEventListener('mousemove', function (event) {
    initialDot.natural = calculateNaturalLocation(event.offsetX, event.offsetY);
    // initialDot.natural = calculateNaturalLocation(initialDot.natural.x, initialDot.natural.y);

    initialDot.pid = findNearestPoint(data,0,initialDot.natural.x, initialDot.natural.y);
      const scaleX = clickableImage1.width / 856;
      const scaleY = clickableImage1.height / 480;
      const naturalX = Math.round(data[0][initialDot.pid][0] * scaleX);
      const naturalY = Math.round(data[0][initialDot.pid][1] * scaleY);
    initialDot.style.left = `${naturalX + padX - dotRadius}px`;
    initialDot.style.top = `${naturalY + padY - dotRadius}px`;
  })

  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    // exclude #000
    if (color === '#000000') {
      return getRandomColor();
    }
    return color;
  }

  function calculateNaturalLocation(x, y) {
    const scaleX = 856 / clickableImage1.width;
    const scaleY = 480 / clickableImage1.height;
    const naturalX = Math.round(x * scaleX);
    const naturalY = Math.round(y * scaleY);
    return { x: naturalX, y: naturalY };
  }

  function calculateViewLocation(x, y) {
    const scaleX = clickableImage2.width / 856;
    const scaleY = clickableImage2.height / 480;
    const viewX = Math.round(x * scaleX);
    const viewY = Math.round(y * scaleY);
    return {x: viewX, y: viewY};
  }


  function transferDots() {
    var imageSrc = "static/demo/flows/" + String(slider.value).padStart(5, '0') + ".png";
    var maskSrc = "static/demo/flows/" + String(slider.value).padStart(5, '0') + "_occ.png";

    var image = images.flow[slider.value];
    var mask = images.mask[slider.value];

    var image_canvas = document.createElement('canvas');
    image_canvas.width = image.width;
    image_canvas.height = image.height;
    var image_ctx = image_canvas.getContext('2d', {willReadFrequently: true});
    image_ctx.drawImage(image, 0, 0);

    var mask_canvas = document.createElement('canvas');
    mask_canvas.width = mask.width;
    mask_canvas.height = mask.height;
    var mask_ctx = mask_canvas.getContext('2d', {willReadFrequently: true});
    mask_ctx.drawImage(mask, 0, 0);

    function read_pixel(ctx, x, y) {
      var pixelData = ctx.getImageData(x, y, 1, 1).data;
      var red = new Int32Array([pixelData[0]])[0];
      var green = new Int32Array([pixelData[1]])[0];
      var blue = new Int32Array([pixelData[2]])[0];
      var alpha = new Int32Array([pixelData[3]])[0];
      return {
        red: red,
        green: green,
        blue: blue,
        alpha: alpha
      };
    }

    // Remove old dots.
    for (olddot of imageBoard2.querySelectorAll('div')) {
      olddot.remove();
    }
    // Add new ones.
    imageBoard1.querySelectorAll('.dot').forEach(dot => {
      const x = dot.natural.x;
      const y = dot.natural.y;
      const pid = dot.pid;
      const color = dot.style.backgroundColor;
      const dot2 = document.createElement('div');
      dot2.style.backgroundColor = color;

      img = document.getElementById("frame")
    const scaleX = img.width / 856;
    const scaleY = img.height / 480;
    const naturalX = Math.round(data[slider.value][pid][0] * scaleX);
    const naturalY = Math.round(data[slider.value][pid][1] * scaleY);
      const visible = data[slider.value][pid][2];

      if (!visible) {
        dot2.classList.add('dot');
      } else {
        dot2.classList.add('cross');
      }

    dot2.style.left = `${naturalX + padX - dotRadius}px`;
    dot2.style.top = `${naturalY + padY - dotRadius}px`;
      console.log("fl0ow")
      console.log("fl0ow",pid,slider.value)
      // console.log("fl0ow",data[slider.value][pid][0],data[slider.value][pid][1])
      console.log("fl0ow",naturalX,naturalY)
      // console.log("floo0w",calculateNaturalLocation(data[slider.value][pid][0],data[slider.value][pid][1]))
      imageBoard2.appendChild(dot2);
    });
  }

  clickableImage1.addEventListener('click', function (event) {
    // console.log("@before input: original dot location", event.offsetX, event.offsetY);
    // dot coordinate
    const offsetX = event.offsetX + padX - dotRadius;
    const offsetY = event.offsetY + padY - dotRadius;
    // randColor = getRandomColor();
    // console.log("event",offsetX,offsetY)
    const dot1 = document.createElement('div');
    dot1.classList.add('dot');
    dot1.style.backgroundColor = RandColor;
    // dot1.color = RandColor;

    dot1.natural = calculateNaturalLocation(event.offsetX, event.offsetY);
    dot1.pid = findNearestPoint(data,0,dot1.natural.x,dot1.natural.y)



    const scaleX = clickableImage1.width / 856;
    const scaleY = clickableImage1.height / 480;
    const naturalX = Math.round(data[0][dot1.pid][0] * scaleX);
    const naturalY = Math.round(data[0][dot1.pid][1] * scaleY);


    dot1.style.left = `${naturalX + padX - dotRadius}px`;
    dot1.style.top = `${naturalY + padY - dotRadius}px`;





    imageBoard1.appendChild(dot1);
    // update color
    RandColor = getRandomColor();
    initialDot.style.backgroundColor = RandColor;
    // console.log('Dot Location:', { offsetX, offsetY });

    // the coordinate of pointer in img
    const p_x = event.offsetX;
    const p_y = event.offsetY;

    // console.log('@@Visual Img Point Location:', { p_x, p_y });
    console.log('@@color', RandColor);
    transferDots();

    function getCurrentSliderValue(sliderId) {
      const slider = document.getElementById(sliderId);
      const sliderValue = slider.value;
      return sliderValue;
    }

    const sliderValue = getCurrentSliderValue('slider');
    console.log('Slider value:', sliderValue);
  });

  slider.addEventListener('input', transferDots);
});