import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import envConfig from '~/config/env.config'
import { tools } from './tools/booking.tool'

const genAI = new GoogleGenerativeAI(envConfig.GEMINI_API_KEY)

interface HairConsultation {
  faceShape: string
  hairType: string
  currentLength: string
  desiredStyle: string
}

class AIService {
  private model

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  }

  async getConsultation(data: HairConsultation) {
    const { faceShape, hairType, currentLength, desiredStyle } = data

    const prompt = `
    Hãy đóng vai một nhà tạo mẫu tóc chuyên nghiệp với hơn 10 năm kinh nghiệm, chuyên tư vấn cá nhân hóa dựa trên hình dạng khuôn mặt, loại tóc và lối sống. Xem xét xu hướng năm 2026, và điều chỉnh gợi ý sao cho khả thi với độ dài tóc hiện tại của khách hàng. Nếu kiểu tóc mong muốn không đạt được ngay lập tức, hãy thêm mẹo chuyển tiếp.
    Chi tiết khách hàng:
    - Hình dạng khuôn mặt: ${faceShape}
    - Loại tóc: ${hairType}
    - Độ dài tóc hiện tại: ${currentLength}
    - Mục tiêu kiểu tóc mong muốn: ${desiredStyle}

    Gợi ý chính xác 3 kiểu tóc đa dạng: một kiểu cổ điển, một kiểu thời thượng, và một kiểu dễ bảo dưỡng. Với mỗi kiểu:
    1. Tên kiểu tóc.
    2. Mô tả ngắn (2-3 câu) giải thích tại sao nó phù hợp với hình dạng khuôn mặt, loại tóc và mục tiêu của khách hàng.
    3. Mẹo tạo kiểu (3-5 gạch đầu dòng), bao gồm sản phẩm hoặc công cụ cần thiết.

    Trả lời hoàn toàn bằng tiếng Việt. Output strictly as a JSON object with a "recommendations" array. Each object in the array must have keys: "name" (string), "description" (string), "stylingTips" (array of strings). Do NOT include any text outside the JSON. No markdown, no explanations.

    Ví dụ output cho một khách hàng mẫu (không bao gồm phần này trong phản hồi của bạn):
    {
      "recommendations": [
        {
          "name": "Tóc Bob Layer",
          "description": "Kiểu cắt này làm nổi bật khuôn mặt tròn bằng cách thêm góc cạnh và độ phồng ở đỉnh đầu.",
          "stylingTips": ["Sử dụng lược tròn để sấy khô.", "Xịt keo tạo kết cấu để giữ nếp."]
        },
        // ... (các gợi ý khác)
      ]
    }
    `

    const result = await this.model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    try {
      // Clean up potential markdown formatting if Gemini adds it
      const cleanText = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()
      return JSON.parse(cleanText)
    } catch (error) {
      console.error('Error parsing AI response:', error)
      throw new Error('Failed to parse styling recommendations')
    }
  }

  async chat(message: string, history: { role: 'user' | 'model'; parts: { text: string }[] }[]) {
    const chat = this.model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 1000
      },
      systemInstruction: {
        role: 'system',
        parts: [
          {
            text: `Bạn là trợ lý AI của một barber shop tại Hà Nội, tên là BarberBot. Hãy trả lời bằng tiếng Việt, thân thiện, chuyên nghiệp. Tập trung vào: - Tư vấn kiểu tóc dựa trên khuôn mặt, loại tóc, độ dài. - Gợi ý sản phẩm (sáp vuốt tóc, dầu gội, máy sấy). - Đặt lịch hẹn (hỏi thời gian, dịch vụ). - Trả lời câu hỏi về dịch vụ (giá cắt tóc, giờ mở cửa). - Nếu cần, tích hợp tư vấn chi tiết từ dữ liệu khách hàng. Giữ câu trả lời ngắn gọn, hữu ích, và khuyến khích hành động (như "Bạn muốn đặt lịch ngay không?"). Khi đặt lịch, hãy hỏi tên, số điện thoại, ngày giờ, dịch vụ và thợ (nếu có). Sử dụng checkAvailability để kiểm tra lịch trống trước khi đặt.`
          }
        ]
      },
      tools: [
        {
          functionDeclarations: [
            {
              name: 'checkAvailability',
              description: 'Check availability for hair styling slots.',
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  date: { type: SchemaType.STRING, description: 'Date to check in ISO 8601 format (YYYY-MM-DD)' },
                  barberName: { type: SchemaType.STRING, description: 'Optional name of the barber' }
                },
                required: ['date']
              }
            },
            {
              name: 'createBooking',
              description: 'Create a hair appointment booking.',
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  customerName: { type: SchemaType.STRING, description: 'Name of the customer' },
                  customerPhone: { type: SchemaType.STRING, description: 'Phone number of the customer' },
                  date: { type: SchemaType.STRING, description: 'Date and time of appointment in ISO 8601 format' },
                  serviceName: { type: SchemaType.STRING, description: 'Name of the service (e.g. Cắt tóc, Nhuộm)' },
                  barberName: { type: SchemaType.STRING, description: 'Name of the barber' }
                },
                required: ['customerName', 'customerPhone', 'date', 'serviceName', 'barberName']
              }
            },
            {
              name: 'getServices',
              description: 'Get list of available services and prices.',
              parameters: {
                type: SchemaType.OBJECT,
                properties: {},
                required: []
              }
            }
          ]
        }
      ]
    })

    const result = await chat.sendMessage(message)
    const response = await result.response
    const call = response.functionCalls()

    if (call) {
      const callResult: any = {}
      for (const c of call) {
        if (c.name === 'checkAvailability') {
          callResult[c.name] = await tools.checkAvailability(c.args as any)
        }
        if (c.name === 'createBooking') {
          callResult[c.name] = await tools.createBooking(c.args as any)
        }
        if (c.name === 'getServices') {
          callResult[c.name] = await tools.getServices()
        }
      }

      // Send result back to model
      const part = call.map((c) => {
        return {
          functionResponse: {
            name: c.name,
            response: {
              name: c.name,
              content: callResult[c.name]
            }
          }
        }
      })

      const result2 = await chat.sendMessage(part)
      return {
        message: result2.response.text()
      }
    }

    return {
      message: response.text()
    }
  }
}

export default new AIService()
