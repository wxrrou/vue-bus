<template>
  <div class="navbar">
    <div class="logo-bus">
      <img src="../assets/images/bus.svg" alt="" />
      <span>BUS</span>
    </div>
    <div class="nav">
      <button>公車動態</button>
      <button>站牌</button>
    </div>
  </div>
  <div style="height: 5.5vw"></div>
</template>

<script setup>
</script>

<style lang='scss'>
@use "../assets/scss/value";
.navbar {
  // box-sizing: border-box;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: 5.5vw;
  width: calc(100vw - 4vw);
  padding: 2px 2vw;
  // position: fixed;
  // top: 0;
  position: fixed;
  top: 0;
  background-color: #fff;
  color: value.$color-navy;
  font-size: 3vw;
  font-weight: 700;
  z-index: 1000;
}
.logo-bus {
  display: flex;
  height: 3vw;
  flex-direction: row;
  img {
    filter: invert(19%) sepia(52%) saturate(602%) hue-rotate(155deg)
      brightness(94%) contrast(113%);
  }
}
.nav {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1vw;
  height: 5vw;
  button {
    padding: 0;
    color: value.$color-blue-d;
    background-color: transparent;
    border: 0.1rem solid value.$color-blue-d;
    border-radius: 4vw;
    height: 3.5vw;
    width: 8.5vw;
    font-size: 1.5vw;
    &:hover {
      background-color: value.$color-blue-d;
      color: #fff;
      border: 0.1rem solid value.$color-blue-d;
      outline: none;
    }
    &:focus,
    :focus-visible {
      background-color: value.$color-blue-d;
      color: #fff;
      border: 0.1rem solid value.$color-blue-d;
      outline: none;
    }
  }
}
</style>