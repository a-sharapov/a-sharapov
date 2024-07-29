// 1. Импортируйте утилиты из `astro:content`
import { defineCollection, z } from 'astro:content'

const docs = defineCollection({
  type: 'content',
  schema: z.object({
    pagetitle: z.string().optional(),
    longtitle: z.string().optional(),
    description: z.string().optional(),
    keywords: z.string().optional()
  })
})

export const collections = {
  docs
}
