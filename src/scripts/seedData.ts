import mongoose from 'mongoose'
import User from '../models/user.model'
import ServiceItem from '../models/serviceItem.model'
import Product from '../models/product.model'
import Booking from '../models/booking.model'
import Review from '../models/review.model'
import Order from '../models/order.model'
import Notification, { NotificationType } from '../models/notification.model'
import BarberSchedule from '../models/barberSchedule.model'
import Promotion from '../models/promotion.model'
import Cart from '../models/cart.model'
import Payment from '../models/payment.model'
import SystemConfig from '../models/systemConfig.model'
import { UserRole, UserVerifyStatus, UserAuthProvider } from '../constants/user'
import { BookingStatus } from '../constants/booking'
import { ProductCategory } from '../constants/product'
import { GENDERS } from '../constants/user'
import envConfig from '../config/env.config'
import bcrypt from 'bcrypt'

/**
 * 💡 NOTE VỀ DATE:
 * MongoDB lưu trữ ngày giờ dưới dạng đối tượng Date (ISODate).
 * Trong script này, ta sử dụng string 'YYYY-MM-DD' để dễ nhìn khi nhập liệu thô,
 * nhưng trước khi insert vào DB, ta sẽ convert chúng thành object Date() của Javascript.
 */

// --- 1. Pre-generate ObjectIds ---
const serviceIds = Array.from({ length: 12 }, () => new mongoose.Types.ObjectId())
const barberIds = Array.from({ length: 5 }, () => new mongoose.Types.ObjectId())
const customerIds = Array.from({ length: 20 }, () => new mongoose.Types.ObjectId()) // Tăng lên 20 khách
const productIds = Array.from({ length: 17 }, () => new mongoose.Types.ObjectId())

// --- 2. Helper Functions ---
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)

// --- 3. Static Data ---

const services = [
  {
    _id: serviceIds[0],
    name: 'Cắt tóc cơ bản',
    duration: 30,
    price: 80000,
    images: ['https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&h=300&fit=crop'],
    description: 'Cắt tóc nam phong cách hiện đại, bao gồm tư vấn kiểu tóc, gội xả và sấy tạo kiểu.',
    bufferTime: 5
  },
  {
    _id: serviceIds[1],
    name: 'Cắt tóc kiểu Hàn Quốc',
    duration: 45,
    price: 120000,
    images: ['https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&h=300&fit=crop'],
    description: 'Cắt tỉa theo phong cách layer, Two-block chuẩn soái ca Hàn Quốc.',
    bufferTime: 10
  },
  {
    _id: serviceIds[2],
    name: 'Gội đầu massage',
    duration: 25,
    price: 50000,
    images: ['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop'],
    description: 'Gội đầu thư giãn với dầu gội thảo dược, kết hợp massage mặt và bấm huyệt đầu.',
    bufferTime: 5
  },
  {
    _id: serviceIds[3],
    name: 'Combo 7 bước',
    duration: 60,
    price: 150000,
    images: ['https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=300&fit=crop'],
    description: 'Quy trình chăm sóc tóc toàn diện: Gội, massage, cắt, cạo mặt, sấy tạo kiểu.',
    bufferTime: 10
  },
  {
    _id: serviceIds[4],
    name: 'Combo VIP',
    duration: 90,
    price: 250000,
    images: ['https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=300&fit=crop'],
    description: 'Trải nghiệm đẳng cấp với đầy đủ các dịch vụ chăm sóc tóc, da mặt và thư giãn sâu.',
    bufferTime: 15
  },
  {
    _id: serviceIds[5],
    name: 'Cạo râu chuyên nghiệp',
    duration: 20,
    price: 50000,
    images: ['https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=300&fit=crop'],
    description: 'Cạo râu bằng khăn nóng, kem cạo cao cấp giúp da mịn màng, không kích ứng.',
    bufferTime: 5
  },
  {
    _id: serviceIds[6],
    name: 'Uốn tóc Hàn Quốc',
    duration: 120,
    price: 350000,
    images: ['https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&h=300&fit=crop'],
    description: 'Uốn tóc tạo kiểu xoăn nhẹ, bồng bềnh tự nhiên theo phong cách các idol Hàn Quốc.',
    bufferTime: 15
  },
  {
    _id: serviceIds[7],
    name: 'Nhuộm tóc',
    duration: 90,
    price: 300000,
    images: ['https://images.unsplash.com/photo-1562322140-8baeacacf376?w=400&h=300&fit=crop'],
    description: 'Thay đổi màu tóc với bảng màu đa dạng, sử dụng thuốc nhuộm chính hãng, bền màu và không gây khô xơ.',
    bufferTime: 15
  },
  {
    _id: serviceIds[8],
    name: 'Cạo mặt, lấy ráy tai',
    duration: 30,
    price: 60000,
    images: ['https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&h=300&fit=crop'],
    description: 'Dịch vụ vệ sinh tai chuyên nghiệp và cạo mặt sạch sẽ, mang lại cảm giác sảng khoái.',
    bufferTime: 5
  },
  {
    _id: serviceIds[9],
    name: 'Nhuộm Highlight',
    duration: 120,
    price: 400000,
    images: ['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop'],
    description: 'Tạo điểm nhấn cho mái tóc với các lọn tóc màu nổi bật, cá tính và thời thượng.',
    bufferTime: 15
  },
  {
    _id: serviceIds[10],
    name: 'Phục hồi tóc hư tổn',
    duration: 60,
    price: 300000,
    images: ['https://images.unsplash.com/photo-1562322140-8baeacacf376?w=400&h=300&fit=crop'],
    description: 'Sử dụng các dưỡng chất chuyên sâu giúp tái tạo cấu trúc tóc, làm tóc mềm mượt và chắc khỏe hơn.',
    bufferTime: 10
  },
  {
    _id: serviceIds[11],
    name: 'Tẩy tóc',
    duration: 90,
    price: 350000,
    images: ['https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&h=300&fit=crop'],
    description: 'Kỹ thuật tẩy tóc chuyên nghiệp giúp nâng tông tóc, chuẩn bị cho các màu nhuộm sáng và rực rỡ.',
    bufferTime: 20
  }
]

const barbers = [
  {
    _id: barberIds[0],
    name: 'Nguyễn Minh Hoàng',
    rating: 4.9,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    experience: 8,
    specialty: 'Cắt tóc nam hiện đại & Undercut',
    bio: 'Hơn 8 năm kinh nghiệm, am hiểu sâu về các kiểu tóc Undercut và Pompadour.'
  },
  {
    _id: barberIds[1],
    name: 'Trần Quốc Anh',
    rating: 4.7,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    experience: 4,
    specialty: 'Tạo kiểu tóc Hàn Quốc & Layer',
    bio: 'Phong cách trẻ trung, chuyên các kiểu tóc Layer và Side part rủ chuẩn Hàn.'
  },
  {
    _id: barberIds[2],
    name: 'Lê Đức Thịnh',
    rating: 4.8,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    experience: 6,
    specialty: 'Skin Fade & Buzz Cut',
    bio: 'Bàn tay vàng trong làng Fade, tỉ mỉ từng đường cạo và tạo hình sắc nét.'
  },
  {
    _id: barberIds[3],
    name: 'Phạm Văn Hùng',
    rating: 4.6,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
    experience: 10,
    specialty: 'Cắt tóc cổ điển & Cạo râu chuyên nghiệp',
    bio: 'Bậc thầy về các kiểu tóc cổ điển và kỹ thuật cạo râu nóng thư giãn.'
  },
  {
    _id: barberIds[4],
    name: 'Võ Thanh Tùng',
    rating: 4.9,
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face',
    experience: 7,
    specialty: 'Uốn tóc & Nhuộm màu thời trang',
    bio: 'Chuyên gia xử lý hóa chất, từ uốn xoăn tự nhiên đến các màu nhuộm tẩy phức tạp.'
  }
]

const products = [
  {
    _id: productIds[0],
    name: 'Volcanic Clay Gatsby',
    category: ProductCategory.Wax,
    images: ['https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=400&h=400&fit=crop'],
    price: 280000,
    stock: 50,
    description: 'Sáp vuốt tóc Volcanic Clay với độ giữ nếp cực cao (Extreme Hold) và hoàn thiện mờ tự nhiên.'
  },
  {
    _id: productIds[1],
    name: 'Sea Salt Spray Ocean',
    category: ProductCategory.Spray,
    images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop'],
    price: 180000,
    stock: 35,
    description: 'Xịt muối biển tạo phồng và kết cấu tóc tự nhiên, mang lại vẻ ngoài lãng tử.'
  },
  {
    _id: productIds[2],
    name: 'Matte Pomade Baxter',
    category: ProductCategory.Wax,
    images: ['https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=400&h=400&fit=crop'],
    price: 350000,
    stock: 42,
    description: 'Pomade gốc nước tạo độ bóng mờ, giữ nếp linh hoạt và dễ dàng gội rửa.'
  },
  {
    _id: productIds[3],
    name: 'Strong Hold Gel Morris',
    category: ProductCategory.Gel,
    images: ['https://images.unsplash.com/photo-1595740411327-0243e8bb4355?w=400&h=400&fit=crop'],
    price: 150000,
    stock: 68,
    description: 'Gel giữ nếp siêu cứng, không để lại vảy trắng và duy trì kiểu tóc suốt 24h.'
  },
  {
    _id: productIds[4],
    name: 'Dầu gội Keune For Men',
    category: ProductCategory.Shampoo,
    images: ['https://images.unsplash.com/photo-1631729371254-42c2a89ddf0d?w=400&h=400&fit=crop'],
    price: 420000,
    stock: 28,
    description: 'Dầu gội cao cấp giúp làm sạch sâu, cân bằng độ ẩm và nuôi dưỡng da đầu khỏe mạnh.'
  },
  {
    _id: productIds[5],
    name: 'Dầu dưỡng râu Captain Fawcett',
    category: ProductCategory.Beard,
    images: ['https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?w=400&h=400&fit=crop'],
    price: 380000,
    stock: 22,
    description: 'Tinh dầu dưỡng râu giúp râu mềm mượt, giảm ngứa và mang lại mùi hương nam tính cổ điển.'
  },
  {
    _id: productIds[6],
    name: 'Hair Spray Taft Power',
    category: ProductCategory.Spray,
    images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop'],
    price: 120000,
    stock: 55,
    description: 'Gôm xịt tóc giữ nếp mạnh mẽ, bảo vệ tóc khỏi độ ẩm và tác động của môi trường.'
  },
  {
    _id: productIds[7],
    name: 'Pre-styling Tonic Layrite',
    category: ProductCategory.Other,
    images: ['https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=400&h=400&fit=crop'],
    price: 290000,
    stock: 18,
    description: 'Nước dưỡng tóc hỗ trợ tạo kiểu, tăng độ phồng và bảo vệ tóc khỏi nhiệt độ máy sấy.'
  },
  {
    _id: productIds[8],
    name: 'Máy sấy tóc Philips',
    category: ProductCategory.Other,
    images: ['https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=400&h=400&fit=crop'],
    price: 650000,
    stock: 10,
    description: 'Máy sấy tóc công suất lớn với công nghệ ion giúp tóc khô nhanh và không bị xơ rối.'
  },
  {
    _id: productIds[9],
    name: 'Lược tạo kiểu Chaoba',
    category: ProductCategory.Other,
    images: ['https://images.unsplash.com/photo-1631730303028-eb1da329e4ba?w=400&h=400&fit=crop'],
    price: 45000,
    stock: 100,
    description: 'Lược chuyên dụng chịu nhiệt, hỗ trợ tạo kiểu Pompadour và Quiff chuyên nghiệp.'
  },
  {
    _id: productIds[10],
    name: 'Sáp Reuzel Blue',
    category: ProductCategory.Wax,
    images: ['https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=400&h=400&fit=crop'],
    price: 420000,
    stock: 30,
    description: 'Sáp vuốt tóc gốc nước (Strong Hold Water Soluble) với độ bóng cao và hương gỗ vani.'
  },
  {
    _id: productIds[11],
    name: 'Dầu gội Tresemme Men',
    category: ProductCategory.Shampoo,
    images: ['https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?w=400&h=400&fit=crop'],
    price: 180000,
    stock: 40,
    description: 'Dầu gội dành riêng cho nam giới, giúp loại bỏ bã nhờn và ngăn ngừa gàu hiệu quả.'
  },
  {
    _id: productIds[12],
    name: 'Kem cạo râu Gillette',
    category: ProductCategory.Beard,
    images: ['https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?w=400&h=400&fit=crop'],
    price: 120000,
    stock: 60,
    description: 'Kem cạo râu tạo bọt mịn màng, giúp dao cạo lướt êm và bảo vệ da khỏi trầy xước.'
  },
  {
    _id: productIds[13],
    name: 'Dao cạo râu cổ điển',
    category: ProductCategory.Beard,
    images: ['https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&h=400&fit=crop'],
    price: 350000,
    stock: 15,
    description: 'Dao cạo truyền thống bằng thép không gỉ cao cấp, mang lại trải nghiệm cạo sát và sạch.'
  },
  {
    _id: productIds[14],
    name: 'Tinh dầu dưỡng tóc Moroccanoil',
    category: ProductCategory.Other,
    images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop'],
    price: 850000,
    stock: 20,
    description: 'Tinh dầu Argan nguyên chất giúp phục hồi tóc hư tổn, tăng độ bóng mượt tức thì.'
  },
  {
    _id: productIds[15],
    name: 'Xịt dưỡng phồng tóc Kevin Murphy',
    category: ProductCategory.Spray,
    images: ['https://images.unsplash.com/photo-1595740411327-0243e8bb4355?w=400&h=400&fit=crop'],
    price: 680000,
    stock: 25,
    description: 'Xịt tạo phồng cao cấp (Anti-Gravity), không gây bết dính và giữ nếp tự nhiên.'
  },
  {
    _id: productIds[16],
    name: 'Máy cạo râu Xiaomi Enchen',
    category: ProductCategory.Other,
    images: ['https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=400&fit=crop'],
    price: 320000,
    stock: 40,
    description: 'Máy cạo râu điện 3 lưỡi kép, chống nước IPX7, pin sạc dùng 60 phút.'
  }
]

const mockCustomers = [
  { name: 'Nguyễn Văn An', phone: '0901234567', email: 'an@email.com' },
  { name: 'Trần Minh Tuấn', phone: '0912345678', email: 'tuan@email.com' },
  { name: 'Lê Hoàng Nam', phone: '0923456789', email: 'nam@email.com' },
  { name: 'Phạm Quốc Bảo', phone: '0934567890', email: 'bao@email.com' },
  { name: 'Hoàng Đức Minh', phone: '0945678901', email: 'minh@email.com' },
  { name: 'Vũ Thanh Long', phone: '0956789012', email: 'long@email.com' }
]

const mockBookingsData = [
  {
    customerEmail: 'an@email.com',
    serviceName: 'Combo 7 bước',
    barberName: 'Nguyễn Minh Hoàng',
    time: '10:00',
    status: 'confirmed',
    dayOffset: 1, // Tomorrow
    price: 150000
  },
  {
    customerEmail: 'tuan@email.com',
    serviceName: 'Cắt tóc kiểu Hàn Quốc',
    barberName: 'Lê Đức Thịnh',
    time: '10:30',
    status: 'pending',
    dayOffset: 1,
    price: 120000
  },
  {
    customerEmail: 'nam@email.com',
    serviceName: 'Combo VIP',
    barberName: 'Võ Thanh Tùng',
    time: '11:00',
    status: 'completed',
    dayOffset: -3, // Past
    price: 250000
  },
  {
    customerEmail: 'bao@email.com',
    serviceName: 'Cắt tóc cơ bản',
    barberName: 'Trần Quốc Anh',
    time: '14:00',
    status: 'confirmed',
    dayOffset: 1,
    price: 80000
  },
  {
    customerEmail: 'minh@email.com',
    serviceName: 'Gội đầu massage',
    barberName: 'Phạm Văn Hùng',
    time: '14:30',
    status: 'cancelled',
    dayOffset: 1,
    price: 50000
  },
  {
    customerEmail: 'long@email.com',
    serviceName: 'Uốn tóc Hàn Quốc',
    barberName: 'Nguyễn Minh Hoàng',
    time: '09:00',
    status: 'pending',
    dayOffset: 2,
    price: 350000
  }
]

const mockReviewsData = [
  {
    userName: 'Nguyễn Văn An',
    serviceName: 'Combo 7 bước',
    barberName: 'Nguyễn Minh Hoàng',
    rating: 5,
    comment:
      'Dịch vụ tuyệt vời! Thợ cắt tận tâm và chuyên nghiệp. Kiểu tóc đúng như mình mong muốn, massage đầu rất thư giãn. Chắc chắn sẽ quay lại!',
    image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&h=300&fit=crop'
  },
  {
    userName: 'Trần Minh Tuấn',
    serviceName: 'Cắt tóc kiểu Hàn Quốc',
    barberName: 'Lê Đức Thịnh',
    rating: 5,
    comment:
      'Thợ cắt rất hiểu xu hướng, tư vấn kiểu tóc phù hợp với khuôn mặt. Không gian shop sang trọng, sạch sẽ. Giá cả hợp lý so với chất lượng.'
  },
  {
    userName: 'Lê Hoàng Nam',
    serviceName: 'Combo VIP',
    barberName: 'Võ Thanh Tùng',
    rating: 4,
    comment:
      'Combo VIP đáng tiền! Được chăm sóc từ A-Z, từ cắt tóc đến chăm sóc da mặt. Nhân viên thân thiện, không gian thư giãn. Sẽ giới thiệu cho bạn bè.',
    images: [
      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=300&fit=crop'
    ]
  },
  {
    userName: 'Phạm Quốc Bảo',
    serviceName: 'Cắt tóc cơ bản',
    barberName: 'Trần Quốc Anh',
    rating: 5,
    comment:
      'Lần đầu đến cắt ở đây, rất hài lòng! Thợ cắt nhanh nhẹn, cắt đẹp, giá sinh viên thân thiện. Sẽ ủng hộ shop dài dài.'
  },
  {
    userName: 'Hoàng Đức Minh',
    serviceName: 'Uốn tóc Hàn Quốc',
    barberName: 'Nguyễn Minh Hoàng',
    rating: 5,
    comment: 'Uốn xong tóc bồng bềnh tự nhiên lắm, không bị xơ hay khô. Thợ tư vấn kỹ trước khi làm, rất chuyên nghiệp.'
  }
]

const mockOrdersData = [
  {
    userName: 'Nguyễn Văn An',
    items: [
      { productName: 'Volcanic Clay Gatsby', quantity: 2 },
      { productName: 'Sea Salt Spray Ocean', quantity: 1 }
    ],
    status: 'delivered',
    dayOffset: -7
  },
  {
    userName: 'Trần Minh Tuấn',
    items: [{ productName: 'Matte Pomade Baxter', quantity: 1 }],
    status: 'shipped',
    dayOffset: -2
  }
]

// --- 4. Main Seed Function ---

const seedData = async () => {
  try {
    let mongoUri = envConfig.NODE_ENV === 'dev' ? envConfig.DEV_DATABASE_URL : envConfig.PRO_DATABASE_URL
    if (!mongoUri) {
      mongoUri = 'mongodb://localhost:27017/BarberDev'
    }
    await mongoose.connect(mongoUri)
    console.log('📦 Connected to MongoDB')

    // Clean DB
    await Promise.all([
      User.deleteMany({ role: { $ne: UserRole.Admin } }), // Keep Admin account
      ServiceItem.deleteMany({}),
      Product.deleteMany({}),
      Booking.deleteMany({}),
      Review.collection.drop().catch(() => {}), // Drop to reset indexes
      Order.deleteMany({}),
      Notification.deleteMany({}),
      BarberSchedule.deleteMany({}),
      Promotion.deleteMany({}),
      Cart.deleteMany({}),
      Payment.deleteMany({}),
      SystemConfig.deleteMany({})
    ])
    console.log('🧹 Cleaned database')

    // B. Create Users (Barbers & Customers)
    const barberUsers = barbers.map((b, i) => ({
      _id: b._id,
      name: b.name,
      email: `barber${i + 1}@barber.com`,
      password: '123456',
      role: UserRole.Barber,
      verify: UserVerifyStatus.Verified,
      avatar: b.avatar,
      rating: b.rating,
      experience: b.experience,
      specialty: b.specialty,
      bio: b.bio,
      gender: GENDERS[0], // Male
      address: {
        street: '123 Barber Street',
        city: 'Hà Nội',
        country: 'Vietnam'
      }
    }))

    // --- 3.2 Sample Data for Diversity ---
    const sampleComments = [
      'Dịch vụ ở đây thực sự tuyệt vời, nhân viên phục vụ rất nhiệt tình và chu đáo từ khâu đón khách đến khi ra về.',
      'Không gian quán cực kỳ sạch sẽ và thoáng mát, thợ cắt tóc rất tỉ mỉ, tạo kiểu đẹp đúng như mình mong muốn.',
      'Mình cảm thấy rất hài lòng với kiểu tóc mới này, cảm ơn thợ đã tư vấn rất kỹ lưỡng để phù hợp với khuôn mặt.',
      'Mức giá ở đây rất hợp lý so với chất lượng dịch vụ cao cấp, chắc chắn đây là địa chỉ tin cậy cho phái mạnh.',
      'Thợ có tay nghề rất cao, tư vấn cực kỳ có tâm và không hề chèo kéo khách hàng sử dụng thêm dịch vụ không cần thiết.',
      'Trải nghiệm lần đầu rất ấn tượng, mình chắc chắn sẽ quay lại ủng hộ shop thường xuyên và giới thiệu cho bạn bè.',
      'Trải nghiệm gội đầu massage ở đây thực sự rất thư giãn, giúp mình xua tan hết mệt mỏi sau một ngày làm việc căng thẳng.',
      'Mình đã cắt tóc ở đây rất nhiều lần và lần nào cũng cảm thấy vô cùng hài lòng với sự ổn định của chất lượng dịch vụ.',
      'Quy trình làm việc rất chuyên nghiệp, hệ thống đặt lịch trực tuyến dễ dàng giúp mình chủ động được thời gian.',
      'Màu nhuộm lên cực chuẩn và đều màu, sau khi làm xong tóc vẫn giữ được độ mềm mượt tự nhiên, không bị khô xơ.',
      'Theo đánh giá của mình thì đây là tiệm cắt tóc nam đẹp và chất lượng nhất trong khu vực này hiện nay.',
      'Đội ngũ nhân viên ở đây không chỉ chuyên nghiệp mà còn rất thân thiện, vui tính, tạo cảm giác thoải mái cho khách.',
      'Chất lượng phục vụ xứng đáng 5 sao! Mọi thứ từ khăn lau đến dụng cụ đều được vệ sinh sạch sẽ, an tâm tuyệt đối.',
      'Shop có phong cách trang trí rất đẹp và hiện đại, âm nhạc nhẹ nhàng tạo nên một không gian vô cùng dễ chịu.',
      'Mỗi lần đến đây mình đều cảm thấy rất thư thái, vừa được làm đẹp vừa được tận hưởng không gian yên tĩnh.'
    ]

    const customerAvatars = [
      'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1628157588553-5eeea00af15c?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop'
    ]

    // Tao 20 khach hang
    const customerUsers = customerIds.map((id, i) => ({
      _id: id,
      name: `Customer ${i + 1}`,
      email: `customer${i + 1}@email.com`,
      password: '123456',
      role: UserRole.Customer,
      verify: UserVerifyStatus.Verified,
      phone: `09${getRandomInt(10000000, 99999999)}`,
      avatar: getRandomItem(customerAvatars),
      gender: getRandomItem([GENDERS[0], GENDERS[1]]),
      address: {
        street: `${getRandomInt(1, 999)} Random St`,
        district: `District ${getRandomInt(1, 12)}`,
        city: 'Hà Nội',
        country: 'Vietnam'
      }
    }))

    // Add specific mock customers
    const specificCustomers = mockCustomers.map((c, i) => ({
      _id: new mongoose.Types.ObjectId(),
      name: c.name,
      email: c.email,
      phone: c.phone,
      password: '123456',
      role: UserRole.Customer,
      verify: UserVerifyStatus.Verified,
      avatar: `https://ui-avatars.com/api/?name=${c.name.split(' ').join('+')}&background=random`,
      gender: GENDERS[0],
      address: {
        street: '10 Specific St',
        district: 'District 1',
        city: 'Hà Nội',
        country: 'Vietnam'
      }
    }))

    await User.insertMany([...barberUsers, ...customerUsers, ...specificCustomers])
    console.log(
      `✅ Seeded ${barberUsers.length} barbers, ${customerUsers.length} random customers & ${specificCustomers.length} specific customers`
    )

    // C. Create Schedules (Only for barbers)
    const schedules = []
    for (const bId of barberIds) {
      for (let day = 0; day <= 6; day++) {
        schedules.push({ barber: bId, dayOfWeek: day, startTime: '09:00', endTime: '18:00', isDayOff: day === 0 }) // CN nghỉ (demo)
      }
    }
    await BarberSchedule.insertMany(schedules)

    // D. Create Services & Products
    await ServiceItem.insertMany(services)
    await Product.insertMany(products)

    // E. Create Promotions
    await Promotion.insertMany([
      {
        code: 'WELCOME50',
        discountValue: 50000,
        minOrderValue: 100000,
        expiryDate: addDays(new Date(), 365),
        description: 'Giảm 50.000đ cho đơn hàng đầu tiên từ 100.000đ.'
      },
      {
        code: 'TET2026',
        discountValue: 100000,
        minOrderValue: 500000,
        expiryDate: addDays(new Date(), 60),
        description: 'Giảm 100.000đ cho đơn hàng từ 500.000đ nhân dịp Tết Nguyên Đán.'
      },
      {
        code: 'STUDENT10',
        discountValue: 20000,
        minOrderValue: 50000,
        expiryDate: addDays(new Date(), 365),
        description: 'Giảm 20.000đ cho học sinh, sinh viên với hóa đơn từ 50.000đ.'
      }
    ])

    // F. Generate BULK Bookings (Quan trọng: tạo nhiều dữ liệu để test chart)
    const bookings = []
    const reviews = []
    const notifications = []

    // Tạo 50 booking trong quá khứ và tương lai gần (từ -30 ngày đến +7 ngày so với hiện tại)
    const today = new Date()

    for (let i = 0; i < 50; i++) {
      const service = getRandomItem(services)
      const barber = getRandomItem(barberUsers)
      const customerId = getRandomItem(customerIds)
      const promotion = Math.random() > 0.7 ? getRandomItem(await Promotion.find({})) : undefined // 30% chance of promotion

      // Random ngày giờ
      const dayOffset = getRandomInt(-30, 7)
      const bookingDate = addDays(today, dayOffset)
      bookingDate.setHours(getRandomInt(9, 17), 0, 0, 0) // 9h -> 17h

      const startTime = bookingDate
      const endTime = new Date(startTime.getTime() + service.duration * 60000)

      // Trạng thái theo thời gian
      let status = BookingStatus.Pending
      if (dayOffset < 0) {
        // Quá khứ: 80% completed, 20% cancelled
        status = Math.random() > 0.2 ? BookingStatus.Completed : BookingStatus.Cancelled
      } else {
        // Tương lai: confirmed or pending
        status = Math.random() > 0.5 ? BookingStatus.Confirmed : BookingStatus.Pending
      }

      const bookingId = new mongoose.Types.ObjectId()
      let totalPrice = service.price
      let discountAmount = 0
      if (promotion && totalPrice >= promotion.minOrderValue) {
        discountAmount = promotion.discountValue || 0
        totalPrice = Math.max(0, totalPrice - discountAmount)
      }

      bookings.push({
        _id: bookingId,
        user: customerId,
        barber: barber._id,
        service: service._id,
        startTime,
        endTime,
        status,
        totalPrice,
        paymentStatus: status === 'completed' ? 'paid' : 'unpaid',
        notes: getRandomItem(['', '', 'Cắt ngắn 2 bên', 'Không cạo mặt', 'Gội kỹ giúp em']),
        promotion: promotion ? promotion._id : undefined,
        discountAmount: discountAmount
      })

      // Nếu completed, tạo review ngẫu nhiên (50% cơ hội)
      if (status === 'completed' && Math.random() > 0.5) {
        reviews.push({
          user: customerId,
          barber: barber._id, // Barber being reviewed
          booking: bookingId,
          rating: getRandomInt(4, 5), // Hầu hết là đánh giá tốt
          comment: getRandomItem(sampleComments),
          createdAt: addDays(endTime, 1)
        })
      }

      // Notification
      notifications.push({
        user: customerId,
        title: 'Trạng thái lịch hẹn',
        message: `Lịch hẹn ${status === BookingStatus.Confirmed ? 'đã xác nhận' : 'đã hoàn thành'}.`,
        type: NotificationType.Booking,
        referenceId: bookingId,
        createdAt: startTime
      })
    }

    // Force create 3-5 confirmed bookings for TODAY (for Admin Overview)
    const bookingsTodayCount = getRandomInt(3, 5)
    for (let i = 0; i < bookingsTodayCount; i++) {
      const service = getRandomItem(services)
      const barber = getRandomItem(barberUsers)
      const customerId = getRandomItem(customerIds)
      const bookingDate = new Date(today) // TODAY
      bookingDate.setHours(getRandomInt(9, 20), getRandomItem([0, 30]), 0, 0)

      const bookingId = new mongoose.Types.ObjectId()
      bookings.push({
        _id: bookingId,
        user: customerId,
        barber: barber._id,
        service: service._id,
        startTime: bookingDate,
        endTime: new Date(bookingDate.getTime() + service.duration * 60000),
        status: BookingStatus.Confirmed,
        totalPrice: service.price,
        paymentStatus: 'unpaid',
        notes: getRandomItem(['', '', 'Cắt ngắn 2 bên', 'Không cạo mặt', 'Gội kỹ giúp em'])
      })
    }

    // Generate Specific Bookings (from mock data)
    for (const mb of mockBookingsData) {
      const customer = specificCustomers.find((c) => c.email === mb.customerEmail)
      const barber = barberUsers.find((b) => b.name === mb.barberName)
      const service = services.find((s) => s.name === mb.serviceName)

      if (customer && barber && service) {
        const [hour, minute] = mb.time.split(':').map(Number)
        const bookingDate = addDays(today, mb.dayOffset)
        bookingDate.setHours(hour, minute, 0, 0)

        const bookingId = new mongoose.Types.ObjectId()

        bookings.push({
          _id: bookingId,
          user: customer._id,
          barber: barber._id,
          service: service._id,
          startTime: bookingDate,
          endTime: new Date(bookingDate.getTime() + service.duration * 60000),
          status: mb.status,
          totalPrice: service.price,
          paymentStatus: mb.status === 'completed' ? 'paid' : 'unpaid',
          notes: getRandomItem(['', '', 'Cắt ngắn 2 bên', 'Không cạo mặt', 'Gội kỹ giúp em'])
        })
      }
    }

    // Generate Specific Reviews (from mock data)
    for (const review of mockReviewsData) {
      const customer = specificCustomers.find((c) => c.name === review.userName)
      const barber = barberUsers.find((b) => b.name === review.barberName)
      const service = services.find((s) => s.name === review.serviceName)

      if (customer && barber && service) {
        // Create a past booking for this review if not exists (simplified: just attach to a new booking id or find one?)
        // For simplicity, we create a disconnected review or a review connected to a new fake completed booking
        // actually let's just make sure we don't duplicate keys. Review needs user+product or user+booking.
        // We'll create a dedicated booking for the review.
        const bookingId = new mongoose.Types.ObjectId()
        const bookingDate = addDays(today, -5)

        bookings.push({
          _id: bookingId,
          user: customer._id,
          barber: barber._id,
          service: service._id,
          startTime: bookingDate,
          endTime: new Date(bookingDate.getTime() + service.duration * 60000),
          status: 'completed',
          totalPrice: service.price,
          paymentStatus: 'paid'
        })

        reviews.push({
          user: customer._id,
          barber: barber._id,
          booking: bookingId,
          rating: review.rating,
          comment: review.comment,
          images: review.images || (review.image ? [review.image] : []),
          createdAt: addDays(bookingDate, 1)
        })
      }
    }

    await Booking.insertMany(bookings)
    await Review.insertMany(reviews)
    await Notification.insertMany(notifications)
    console.log(`✅ Seeded ${bookings.length} bookings & ${reviews.length} reviews`)

    // G. Generate BULK Orders
    const orders = []

    // Specific Orders
    for (const mo of mockOrdersData) {
      const customer = specificCustomers.find((c) => c.name === mo.userName)
      if (!customer) continue

      const orderItems = []
      let total = 0
      for (const item of mo.items) {
        const prod = products.find((p) => p.name === item.productName)
        if (prod) {
          orderItems.push({
            product: prod._id,
            nameAtPurchase: prod.name,
            priceAtPurchase: prod.price,
            quantity: item.quantity
          })
          total += prod.price * item.quantity
        }
      }

      if (orderItems.length > 0) {
        const orderId = new mongoose.Types.ObjectId()
        orders.push({
          _id: orderId,
          user: customer._id,
          items: orderItems,
          totalPrice: total,
          status: mo.status as any,
          paymentMethod: 'Cash', // Default for now
          paymentStatus: ['delivered', 'shipped'].includes(mo.status) ? 'paid' : 'unpaid',
          shippingAddress: { street: '456 Street', city: 'Hà Nội', country: 'Vietnam' },
          createdAt: addDays(today, mo.dayOffset),
          updatedAt: addDays(today, mo.dayOffset)
        })
      }
    }

    const shippingAddresses = [
      { street: '123 Le Loi', district: 'District 1', city: 'Hà Nội', country: 'Vietnam' },
      { street: '456 Nguyen Hue', district: 'District 1', city: 'Hà Nội', country: 'Vietnam' },
      { street: '789 Tran Hung Dao', district: 'District 5', city: 'Hà Nội', country: 'Vietnam' },
      { street: '10 Phan Dang Luu', district: 'Ba Dinh', city: 'Hà Nội', country: 'Vietnam' },
      { street: '11 Hoang Hoa Tham', district: 'Tay Ho', city: 'Hà Nội', country: 'Vietnam' }
    ]

    for (let i = 0; i < 20; i++) {
      const customerId = getRandomItem(customerIds)
      const numItems = getRandomInt(1, 3)
      const orderItems = []
      let total = 0

      for (let j = 0; j < numItems; j++) {
        const prod = getRandomItem(products)
        const qty = getRandomInt(1, 2)
        orderItems.push({
          product: prod._id,
          nameAtPurchase: prod.name,
          priceAtPurchase: prod.price,
          quantity: qty
        })
        total += prod.price * qty
      }

      const statusList = ['processing', 'shipped', 'delivered', 'cancelled']
      const status = getRandomItem(statusList)
      const createdDate = addDays(today, getRandomInt(-20, 0)) // Trong 20 ngày gần đây

      const orderId = new mongoose.Types.ObjectId()
      orders.push({
        _id: orderId,
        user: customerId,
        items: orderItems,
        totalPrice: total,
        status: status as any,
        paymentMethod: getRandomItem(['Cash', 'MoMo', 'Banking']),
        paymentStatus: ['delivered', 'shipped'].includes(status) ? 'paid' : 'unpaid',
        shippingAddress: getRandomItem(shippingAddresses),
        createdAt: createdDate,
        updatedAt: createdDate
      })
    }

    // Force create 2-3 new orders for TODAY (for Admin Overview)
    const ordersTodayCount = getRandomInt(2, 3)
    for (let i = 0; i < ordersTodayCount; i++) {
      const customerId = getRandomItem(customerIds)
      const prod = getRandomItem(products)
      const orderId = new mongoose.Types.ObjectId()
      orders.push({
        _id: orderId,
        user: customerId,
        items: [
          {
            product: prod._id,
            nameAtPurchase: prod.name,
            priceAtPurchase: prod.price,
            quantity: 1
          }
        ],
        totalPrice: prod.price,
        status: 'processing',
        paymentMethod: getRandomItem(['Cash', 'MoMo']),
        paymentStatus: 'unpaid',
        shippingAddress: getRandomItem(shippingAddresses),
        createdAt: new Date(), // TODAY
        updatedAt: new Date()
      })
    }
    await Order.insertMany(orders)
    console.log(`✅ Seeded ${orders.length} orders`)

    // H. Generate PAYMENTS for Bookings & Orders
    const payments = []

    // 1. Payments for Bookings (those marked as paid)
    for (const b of bookings) {
      if (b.paymentStatus === 'paid') {
        payments.push({
          paymentFor: 'booking',
          booking: b._id,
          amount: b.totalPrice,
          paymentMethod: getRandomItem(['COD', 'VNPay', 'Momo', 'Bank']), // Booking payment usually at store (COD/Cash) or Transfer
          status: 'success',
          transactionId: `TXN_B_${b._id}_${Date.now()}`,
          isDeleted: false,
          createdAt: b.endTime, // Payment after service
          updatedAt: b.endTime
        })
      }
    }

    // 2. Payments for Orders
    for (const o of orders) {
      if (o.paymentStatus === 'paid') {
        // Map Order payment method to Payment model method
        let method = 'COD'
        if (o.paymentMethod === 'MoMo') method = 'Momo'
        if (o.paymentMethod === 'Banking') method = 'Bank'

        payments.push({
          paymentFor: 'order',
          order: o._id,
          amount: o.totalPrice,
          paymentMethod: method,
          status: 'success',
          transactionId: `TXN_O_${o._id}_${Date.now()}`,
          isDeleted: false,
          createdAt: o.createdAt,
          updatedAt: o.createdAt
        })
      }
    }

    await Payment.insertMany(payments)

    console.log(`✅ Seeded ${payments.length} payment records`)

    // I. Create Carts (Mock carts for some users)
    const carts = []
    // Add cart for 'an@email.com' (first mock customer)
    const customerAn = specificCustomers.find((c) => c.email === 'an@email.com')
    if (customerAn) {
      const product1 = products[0]
      const product2 = products[1]
      carts.push({
        user: customerAn._id,
        items: [
          { product: product1._id, quantity: 1 },
          { product: product2._id, quantity: 2 }
        ],
        totalPrice: product1.price * 1 + product2.price * 2
      })
    }
    // Add Cart for 'tuan@email.com'
    const customerTuan = specificCustomers.find((c) => c.email === 'tuan@email.com')
    if (customerTuan) {
      const product3 = products[2]
      carts.push({
        user: customerTuan._id,
        items: [{ product: product3._id, quantity: 1 }],
        totalPrice: product3.price * 1
      })
    }

    await Cart.insertMany(carts)
    console.log(`✅ Seeded ${carts.length} carts`)

    // J. System Config
    await SystemConfig.create({
      storeName: 'Barber Shop',
      address: '123 Cắt Tóc, Hà Nội',
      phone: '0909000111',
      email: 'contact@barber.com',
      workingHours: {
        weekdays: '09:00 - 21:00',
        weekend: '08:00 - 22:00'
      },
      socials: {
        facebook: 'https://facebook.com/barbershop',
        instagram: 'https://instagram.com/barbershop'
      }
    })
    console.log('✅ SystemConfig seeded')

    // I. Ensure Admin Account Exists
    const adminEmail = envConfig.ADMIN_EMAIL
    const adminPassword = envConfig.ADMIN_PASSWORD
    if (adminEmail && adminPassword) {
      const existingAdmin = await User.findOne({ email: adminEmail })
      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10)
        await User.create({
          name: 'Admin',
          email: adminEmail,
          password: hashedPassword,
          role: UserRole.Admin,
          verify: UserVerifyStatus.Verified,
          authProvider: UserAuthProvider.Local,
          isActive: true
        })
        console.log('✅ Admin account created')
      } else {
        console.log('ℹ️ Admin account already exists (preserved)')
      }
    }

    console.log('🎉 Seeding completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding error:', error)
    process.exit(1)
  }
}

seedData()
