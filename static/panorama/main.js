import * as THREE from 'three'
let camera, scene, renderer, material, mesh, north
let isUserInteracting = false
let onPointerDownPointerX = 0
let onPointerDownPointerY = 0
let onPointerDownLon = 0
let onPointerDownLat = 0
let fovMin = 20
let fovMax = 150
let fovStep = 10
let lon = 0
let lat = 0
let fov = 70
let fovLognSide = true

const RADIUS = 1

function str2num (str, defaultVal) {
  if (str == null) {
    return defaultVal
  }
  let num = Number(str)
  if (isNaN(num)) {
    num = defaultVal
  }
  return num
}

export default function init (_image, _lat, _lon, _fov) {
  const params = (new URL(document.location)).searchParams
  // 画角範囲などの定義
  fovMin = str2num(params.get('fovMin'), 20)
  fovMax = str2num(params.get('fovMax'), 150)
  fovStep = str2num(params.get('fovStep'), 10)
  if (params.get('fovSide') === 'short') {
    fovLognSide = false
  }

  // 表示非表示
  if (params.get('linksHidden') != null) {
    document.getElementById('links').style.visibility = 'hidden'
  }
  if (params.get('menuHidden') != null) {
    document.getElementById('menu').style.visibility = 'hidden'
  }
  if (params.get('axisinfoHidden') != null) {
    document.getElementById('axisinfo').style.visibility = 'hidden'
  }

  const container = document.getElementById('container')

  camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, RADIUS / 8, RADIUS)
  camera.target = new THREE.Vector3(0, 0, 0)

  scene = new THREE.Scene()

  const geometry = new THREE.SphereGeometry(RADIUS, 128, 48)// 球体
  geometry.applyMatrix4(new THREE.Matrix4().makeScale(-1, 1, 1))// 反転

  material = new THREE.MeshBasicMaterial({
    map: new THREE.TextureLoader().load(_image)
  })
  // THREE.ImageUtils.loadTexture(_image)
  mesh = new THREE.Mesh(geometry, material)
  mesh.matrixAutoUpdate = false
  scene.add(mesh)

  // 北側を表す点
  north = new THREE.Mesh(
    new THREE.PlaneGeometry(RADIUS / 20, RADIUS / 20),
    new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load(_image), side: THREE.DoubleSide })
  )
  north.matrix.setPosition(new THREE.Vector3(0, 0, RADIUS * 2))
  north.matrixAutoUpdate = false
  if (params.get('northHidden') == null) {
    scene.add(north)
  }

  lon = _lon
  lat = _lat
  fov = _fov

  renderer = new THREE.WebGLRenderer()
  // renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize(window.innerWidth, window.innerHeight)
  container.appendChild(renderer.domElement)

  document.addEventListener('mousedown', onDocumentMouseDown, false)
  document.addEventListener('mousemove', onDocumentMouseMove, false)
  document.addEventListener('mouseup', onDocumentMouseUp, false)
  document.addEventListener('mousewheel', onDocumentMouseWheel, false)
  document.addEventListener('DOMMouseScroll', onDocumentMouseWheel, false)

  document.addEventListener('touchstart', onDocumentMouseDown, false)
  document.addEventListener('touchmove', onDocumentMouseMove, false)
  document.addEventListener('touchend', onDocumentMouseUp, false)

  window.addEventListener('resize', onWindowResize, false)

  onWindowResize()// 初期画面が横長の場合にfovが変になるので、呼んでおく。

  animate()
}

/*
function onWindowResize () {
  camera.aspect = window.innerWidth / window.innerHeight
  setFov(fov)
  camera.updateProjectionMatrix()

  renderer.setSize(window.innerWidth, window.innerHeight)
}

function onDocumentMouseDown (event) {

  isUserInteracting = true

  const clientX = event.clientX || event.touches[0].clientX
  const clientY = event.clientY || event.touches[0].clientY

  onPointerDownPointerX = clientX
  onPointerDownPointerY = clientY

  onPointerDownLon = lon
  onPointerDownLat = lat
}

function onDocumentMouseMove (event) {
  if (isUserInteracting) {
    const clientX = event.clientX || event.touches[0].clientX
    const clientY = event.clientY || event.touches[0].clientY

    let mul
    if (camera.aspect > 1) {
      mul = fov / window.innerWidth
    } else {
      mul = fov / window.innerHeight
    }
    lon = (onPointerDownPointerX - clientX) * mul + onPointerDownLon
    lat = (clientY - onPointerDownPointerY) * mul + onPointerDownLat

    if (lon < 0) { lon += 360 }
    if (lon > 360) { lon -= 360 }
    lat = Math.max(-85, Math.min(85, lat))
  }
}

function onDocumentMouseUp (event) {
  isUserInteracting = false
}

function onDocumentMouseWheel (event) {
  let d
  if (event.wheelDeltaY) {
    // WebKit
    d = event.wheelDeltaY < 0
  } else if (event.wheelDelta) {
    // Opera / Explorer 9
    d = event.wheelDelta < 0
  } else if (event.detail) {
    // Firefox
    d = event.detail > 0
  }

  let tmpFov = fov + (d ? fovStep : -fovStep)
  tmpFov = Math.max(fovMin, Math.min(fovMax, tmpFov))
  // console.log(tmpFov);
  setFov(tmpFov)
  camera.updateProjectionMatrix()
}

function setFov (_fov) {
  if (fovLognSide) {
    setLongSideFov(_fov)
  } else {
    setShortSideFov(_fov)
  }
}

function setLongSideFov (_fov) {
  fov = _fov
  if (camera.aspect > 1) {
    camera.fov = 2 * Math.atan(Math.tan(fov / 360 * Math.PI) / camera.aspect) * 180 / Math.PI
  } else {
    camera.fov = fov
  }
}

function setShortSideFov (_fov) {
  fov = _fov
  if (camera.aspect > 1) {
    camera.fov = fov
  } else {
    camera.fov = 2 * Math.atan(Math.tan(fov / 360 * Math.PI) / camera.aspect) * 180 / Math.PI
  }
}

function animate () {
  requestAnimationFrame(animate)
  render()
}

function render () {
  camera.target.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - lat), -THREE.MathUtils.degToRad(90 + lon))
  camera.lookAt(camera.target)
  renderer.render(scene, camera)

/!*   const axis = document.getElementById('axisinfo')
  axis.innerHTML = 'lat:' + lat.toFixed(1) + ' lon:' + lon.toFixed(1) + ' fov:' + fov *!/
}
*/
