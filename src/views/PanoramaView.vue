<template>
  <div id="PanoramaView">
  </div>
</template>

<script>
import Panorama from './Panorama'
export default {
  name: 'PanoramaView',
  data () {
    return {
      panorama: null
    }
  },
  mounted () {
  },
  methods: {
    click () {
      this.panorama = new Panorama({ id: 'PanoramaView', _lon: 0, _lat: 0, _fov: 102 })
      this.panorama.change()
    }
  }
}
</script>

<style lang="less" scoped>
#PanoramaView {
  width: 1000px;
  height: 700px;
  background-color: #ccddee;
  cursor: move;
}
</style>
