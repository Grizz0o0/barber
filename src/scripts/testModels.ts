import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

  const modelsToTest = [
    'gemini-exp-1206',
    'models/gemini-1.5-flash',
    'gemini-1.5-flash',
    'models/gemini-2.0-flash-lite-preview-02-05'
  ]

  let output = ''

  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing ${modelName}...`)
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent('Hi')
      output += `SUCCESS: ${modelName} works!\n`
      console.log(`SUCCESS: ${modelName} works!`)
    } catch (error: any) {
      output += `FAILED: ${modelName} - ${error.message}\n`
      console.log(`FAILED: ${modelName}`)
    }
  }

  fs.writeFileSync('model_test_output_v3.txt', output)
}

listModels()
