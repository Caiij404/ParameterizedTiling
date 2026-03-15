<template>
  <div class="grid-menu">
    <div class="grid-item" v-for="(item, index) in gridItems" :key="index"
         @click="handleItemClick(item, index)">
      <div class="grid-item-content">
        <div class="grid-item-icon">{{ (<any>item).icon }}</div>
        <div class="grid-item-label">{{ (<any>item).label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  gridItems: {
    type: Array,
    default: () => [
      { icon: '1' },
      { icon: '2' },
      { icon: '3' },
      { icon: '4' },
      { icon: '5' },
      { icon: '6' },
      { icon: '7' },
      { icon: '8' },
      { icon: '9' }
    ]
  }
});

const emit = defineEmits(['item-click']);

const handleItemClick = (item: any, index: number) => {
  // emit('item-click', { item, index });
  // @ts-ignore
  window.EventBus.pub('TEXTURE_ALIGN', index + 1);
  console.log("====================")
};
</script>

<style scoped>
.grid-menu {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 8px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1000;
  width: 300px;
  height: 300px;
}

.grid-item {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.grid-item:hover {
  background-color: #e0e0e0;
  transform: scale(1.05);
}

.grid-item-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.grid-item-icon {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
  color: #333;
}

.grid-item-label {
  font-size: 12px;
  color: #666;
}
</style>