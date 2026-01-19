import axios from 'axios'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

const API_KEY = process.env.GEMINI_API_KEY
const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`

async function getModels() {
  try {
    console.log('Fetching models...')
    const response = await axios.get(URL)
    const models = response.data.models

    let output = 'Available Models:\n'
    models.forEach((m: any) => {
      output += `- ${m.name} (${m.version}) [Supported methods: ${m.supportedGenerationMethods}]\n`
    })

    console.log(output)
    fs.writeFileSync('available_models.txt', output)
  } catch (error: any) {
    console.error('Error fetching models:', error.response ? error.response.data : error.message)
    fs.writeFileSync(
      'available_models.txt',
      `Error: ${JSON.stringify(error.response ? error.response.data : error.message, null, 2)}`
    )
  }
}

getModels()
