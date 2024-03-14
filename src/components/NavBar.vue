<template>
  <div class="navbar">
    <div class="logo-bus">
      <img src="../assets/images/bus.svg" alt="" />
      <span>BUS</span>
    </div>
  </div>
  <div style="height: calc(5.5vw + 4px)"></div>
</template>

<script setup>
</script>

<style lang='scss'>
@use "../assets/scss/value";
.navbar {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  height: 5.5vw;
  width: calc(100vw - 4vw);
  padding: 2px 2vw;
  position: fixed;
  top: 0;
  background-color: #fff;
  color: value.$color-navy;
  font-size: clamp(24px, 3vw, 3vw);
  font-weight: 700;
  z-index: 1000;
}
.logo-bus {
  display: flex;
  height: clamp(24px, 3vw, 3vw);
  flex-direction: row;
  img {
    filter: invert(19%) sepia(52%) saturate(602%) hue-rotate(155deg)
      brightness(94%) contrast(113%);
  }
}
</style>