<template>
  <div v-if="isLoading" class="loaderContainer">
    <div class="loader"></div>
  </div>
</template>

<script>
export default {};
</script>

<style lang='scss' scoped>
@use "../assets/scss/value";
.loaderContainer {
  position: fixed;
  top: 0;
  left: auto;
  right: auto;
  width: 100%;
  height: 100%;
  background-color: #a8dadc80;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.loader {
  width: fit-content;
  font-weight: bold;
  font-size: 3vw;
  background: radial-gradient(
      circle closest-side,
      value.$color-yellow 94%,
      #0000
    )
    right/calc(200% - 1em) 100%;
  animation: l24 1s infinite alternate linear;
  &:before {
    content: "Loading...";
    line-height: 1em;
    color: #0000;
    background: inherit;
    background-image: radial-gradient(
      circle closest-side,
      #fff 94%,
      value.$color-navy
    );
    -webkit-background-clip: text;
    background-clip: text;
  }
}
@keyframes l24 {
  100% {
    background-position: left;
  }
}
</style>