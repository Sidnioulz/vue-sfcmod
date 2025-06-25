<template>
  <div class="card">
    <h2 class="card-title">Card Title</h2>
    <p class="card-text">Card content goes here</p>
    <button class="card-button">Action</button>
  </div>
</template>

<style scoped>:root {
  --color-text-primary: #333333;
  --color-text-secondary: #666666;
  --color-primary: #007bff;
  --color-primary-dark: #0056b3;
  --color-background: #ffffff;
  --color-border: #e0e0e0;
  --color-disabled: #cccccc;
  --color-background: white;
  --shadow-light: rgba(0, 0, 0, 0.1);
}

.card {
  background: var(--color-background);
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-title {
  color: var(--color-text-primary);
  font-size: 1.25rem;
  margin: 0 0 12px 0;
}

.card-text {
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0 0 16px 0;
}

.card-button {
  background: var(--color-primary);
  color: var(--color-background);
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.card-button:hover {
  background: var(--color-primary-dark);
}

.card-button:disabled {
  background: var(--color-disabled);
  cursor: not-allowed;
}
</style>
