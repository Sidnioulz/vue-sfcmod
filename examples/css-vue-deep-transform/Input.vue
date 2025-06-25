<template>
  <div class="wrapper">
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  border: 1px solid #ddd;
  padding: 20px;
}

.wrapper::v-deep .child-component {
  margin: 10px 0;
}

.wrapper::v-deep .child-component h2 {
  color: #333;
  font-size: 1.5rem;
}

.wrapper::v-slotted p {
  color: #666;
  line-height: 1.6;
}

.content::v-deep .nested .item {
  background: #f5f5f5;
  padding: 8px;
}

/* Mix of old and new syntax */
.wrapper::v-deep .legacy {
  border: 1px solid red;
}
</style>
