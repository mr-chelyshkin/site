<script setup lang="ts">
import CommerceSection from '@/components/sections/CommerceSection.vue'
import ContactSection from '@/components/sections/ContactSection.vue'
import HeroSection from '@/components/sections/HeroSection.vue'
import OpenSourceSection from '@/components/sections/OpenSourceSection.vue'
import PracticeSection from '@/components/sections/PracticeSection.vue'
import { siteContent } from '@/contents'

const { home, socialProfiles } = siteContent
</script>

<template>
  <HeroSection :content="home.hero" />
  <PracticeSection :content="home.practice" />
  <CommerceSection :content="home.commerce" />
  <OpenSourceSection :content="home.openSource" />
  <ContactSection :content="home.contact" :profiles="socialProfiles" />
</template>
