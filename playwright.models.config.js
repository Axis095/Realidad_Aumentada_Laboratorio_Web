import { defineConfig } from '@playwright/test'
import base from './playwright.config.js'

export default defineConfig({ ...base, testDir: './tests/models', timeout: 90_000 })
