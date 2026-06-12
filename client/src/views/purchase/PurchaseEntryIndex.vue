<template>
  <PurchaseEntryList
    v-if="!showNewEntry"
    @add-entry="showNewEntry = true"
  />
  <PurchaseEntryNew
    v-else
    @back="handleBack"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PurchaseEntryList from './PurchaseEntryList.vue'
import PurchaseEntryNew from './PurchaseEntryNew.vue'

const showNewEntry = ref(false)

function handleBack() {
  showNewEntry.value = false
}
</script>
