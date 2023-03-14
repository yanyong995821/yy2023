import * as THREE from 'three'
let isUserInteracting = false
let onPointerDownPointerX = 0
let onPointerDownPointerY = 0
let onPointerDownLon = 0
let onPointerDownLat = 0
let fovMin = 25
let fovMax = 144
let fovStep = 10
let fovLognSide = true
const RADIUS = 1

class Panorama {
  // 渲染器
  renderer = null
  // 透视摄像机
  camera = null
  // 场景
  scene = null
  // 正方形
  geometry = null
  // 材质
  material = null
  // 网格
  cube = null

  constructor (options) {
    if (options) {
      this.container = document.getElementById(options.id)
      if (!this.container) {
        alert('不存在挂载点，无法创建渲染器！')
        return
      }
      this.lon = options._lon
      this.lat = options._lat
      this.fov = options._fov
    }
    this.init()
  }

  init () {
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
    const params = (new URL(document.location)).searchParams
    // 画角範囲などの定義
    fovMin = str2num(params.get('fovMin'), 20)
    fovMax = str2num(params.get('fovMax'), 150)
    fovStep = str2num(params.get('fovStep'), 10)
    if (params.get('fovSide') === 'short') {
      fovLognSide = false
    }
    this.params = params

    this.createWebGlRenderer()
    this.createPerspectiveCamera()
    this.createScene()
    this.boxGeometry()
    this.createMaterial()
    this.createCube()
    this.addEvent()
    this.refreshRender()
  }

  updateCamera () {
    this.camera.updateProjectionMatrix()
  }

  // 创建一个WebGL渲染器
  createWebGlRenderer () {
    const renderer = new THREE.WebGLRenderer()
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    const canvas = renderer.domElement
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    this.container.appendChild(renderer.domElement)
    this.renderer = renderer
  }

  // 创建透视摄像机
  createPerspectiveCamera () {
    this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, RADIUS / 8, RADIUS)
    this.camera.position.set(0, 0, 0)
  }

  // 创建场景
  createScene () {
    this.scene = new THREE.Scene()
  }

  boxGeometry () {
    this.geometry = new THREE.SphereGeometry(RADIUS, 128, 48)// 球体
    this.geometry.applyMatrix4(new THREE.Matrix4().makeScale(-1, 1, 1))// 反転
  }

  // 创建材质
  createMaterial () {
    this.material = new THREE.MeshBasicMaterial(
      {
        map: new THREE.TextureLoader().load(require('./360.jpg'))
      }
    )
  }

  // 创建网格
  createCube () {
    this.cube = new THREE.Mesh(this.geometry, this.material)
  }

  refreshRender () {
    this.scene.add(this.cube)
    // 北側を表す点
    const north = new THREE.Mesh(
      new THREE.PlaneGeometry(RADIUS / 20, RADIUS / 20),
      new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load(require('./360.jpg')), side: THREE.DoubleSide })
    )
    north.matrix.setPosition(new THREE.Vector3(0, 0, RADIUS * 2))
    north.matrixAutoUpdate = false
    if (this.params.get('northHidden') == null) {
      this.scene.add(north)
    }
    const left = this
    requestAnimationFrame(render)
    function render () {
      console.log(left.lon)
      left.camera.position.x = 1
      left.camera.position.y = THREE.MathUtils.degToRad(90 - left.lat)
      left.camera.position.z = -THREE.MathUtils.degToRad(90 + left.lon)
      console.log(left.camera.position)

      left.renderer.render(left.scene, left.camera)
      requestAnimationFrame(render)
    }
  }

  change () {
    const camera = this.camera
    console.log(camera.fov)
    const fov = camera.fov + 5
    if (fov > 100) {
      camera.fov = 0
    } else {
      camera.fov = fov
    }
    this.updateCamera()
  }

  addEvent () {
    const left = this
    const container = this.container
    const camera = this.camera

    const onDocumentMouseDown = (event) => {
      event.preventDefault()
      isUserInteracting = true
      const clientX = event.clientX || event.touches[0].clientX
      const clientY = event.clientY || event.touches[0].clientY
      onPointerDownPointerX = clientX
      onPointerDownPointerY = clientY
      onPointerDownLon = left.lon
      onPointerDownLat = left.lon
    }
    const onDocumentMouseMove = (event) => {
      if (isUserInteracting) {
        console.log(1)
        const clientX = event.clientX || event.touches[0].clientX
        const clientY = event.clientY || event.touches[0].clientY

        let mul
        if (camera.aspect > 1) {
          mul = left.fov / container.innerWidth
        } else {
          mul = left.fov / container.innerHeight
        }
        left.lon = (onPointerDownPointerX - clientX) * mul + onPointerDownLon
        left.lon = (clientY - onPointerDownPointerY) * mul + onPointerDownLat

        if (left.lon < 0) { left.lon += 360 }
        if (left.lon > 360) { left.lon -= 360 }
        left.lat = Math.max(-85, Math.min(85, left.lat))
      }
    }
    const onDocumentMouseUp = (event) => {
      isUserInteracting = false
    }
    const onDocumentMouseWheel = (event) => {
      console.log('2')
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

      let tmpFov = left.fov + (d ? fovStep : -fovStep)
      tmpFov = Math.max(fovMin, Math.min(fovMax, tmpFov))
      setFov(tmpFov)
    }
    function setFov (_fov) {
      if (fovLognSide) {
        setLongSideFov(_fov)
      } else {
        setShortSideFov(_fov)
      }
      camera.updateProjectionMatrix()
    }
    function setLongSideFov (_fov) {
      left.fov = _fov
      if (camera.aspect > 1) {
        camera.fov = 2 * Math.atan(Math.tan(left.fov / 360 * Math.PI) / camera.aspect) * 180 / Math.PI
      } else {
        camera.fov = left.fov
      }
    }

    function setShortSideFov (_fov) {
      left.fov = _fov
      if (camera.aspect > 1) {
        camera.fov = left.fov
      } else {
        camera.fov = 2 * Math.atan(Math.tan(left.fov / 360 * Math.PI) / camera.aspect) * 180 / Math.PI
      }
    }
    container.addEventListener('mousedown', onDocumentMouseDown, false)
    container.addEventListener('mousemove', onDocumentMouseMove, false)
    container.addEventListener('mouseup', onDocumentMouseUp, false)
    container.addEventListener('mousewheel', onDocumentMouseWheel, false)
    container.addEventListener('DOMMouseScroll', onDocumentMouseWheel, false)
    container.addEventListener('touchstart', onDocumentMouseDown, false)
    container.addEventListener('touchmove', onDocumentMouseMove, false)
    container.addEventListener('touchend', onDocumentMouseUp, false)
  }
}

export default Panorama
