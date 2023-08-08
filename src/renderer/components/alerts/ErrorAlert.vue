<template>
    <v-alert color="error">
        <slot />
        <div class="font-weight-bold">Error details: </div>
        <div class="font-monospace error-details pa-2">
            {{ errorMessage }}
        </div>
        <slot name="actions" />
    </v-alert>
</template>

<script setup lang="ts">
interface Props {
    errorMessage: string
}

defineProps<Props>();
</script>

<style scoped>
.font-monospace {
    font-family: 'Courier New', monospace;
}
.error-details {
    background-color: #333;
}
</style>
