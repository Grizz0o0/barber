'use strict'

import { HttpResponse } from '~/constants/httpStatusCode'

const { ReasonPhrases, StatusCodes } = HttpResponse

interface ErrorDetail {
  field?: string
  message: string
  code?: string
}

class ErrorResponse extends Error {
  status: number
  errors?: ErrorDetail[]
  errorCode?: string
  timestamp: string

  constructor(message: string, status: number, errors?: ErrorDetail[], errorCode?: string) {
    super(message)
    this.status = status
    this.errors = errors
    this.errorCode = errorCode
    this.timestamp = new Date().toISOString()

    // Đảm bảo kế thừa đúng
    Object.setPrototypeOf(this, new.target.prototype)

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor)
  }
}

// Xung đột request
class ConflictRequestError extends ErrorResponse {
  constructor(
    message: string = ReasonPhrases.CONFLICT,
    statusCode: number = StatusCodes.CONFLICT,
    errors?: ErrorDetail[],
    errorCode: string = 'CONFLICT_ERROR'
  ) {
    super(message, statusCode, errors, errorCode)
  }
}

// Lỗi request không hợp lệ
class BadRequestError extends ErrorResponse {
  constructor(
    message: string = ReasonPhrases.BAD_REQUEST,
    statusCode: number = StatusCodes.BAD_REQUEST,
    errors?: ErrorDetail[],
    errorCode: string = 'BAD_REQUEST_ERROR'
  ) {
    super(message, statusCode, errors, errorCode)
  }
}

// Lỗi xác thực thất bại
class UnauthorizedError extends ErrorResponse {
  constructor(
    message: string = ReasonPhrases.UNAUTHORIZED,
    statusCode: number = StatusCodes.UNAUTHORIZED,
    errors?: ErrorDetail[],
    errorCode: string = 'UNAUTHORIZED_ERROR'
  ) {
    super(message, statusCode, errors, errorCode)
  }
}

// Lỗi tài nguyên không tìm thấy
class NotFoundError extends ErrorResponse {
  constructor(
    message: string = ReasonPhrases.NOT_FOUND,
    statusCode: number = StatusCodes.NOT_FOUND,
    errors?: ErrorDetail[],
    errorCode: string = 'NOT_FOUND_ERROR'
  ) {
    super(message, statusCode, errors, errorCode)
  }
}

// Lỗi không có quyền truy cập
class ForbiddenError extends ErrorResponse {
  constructor(
    message: string = ReasonPhrases.FORBIDDEN,
    statusCode: number = StatusCodes.FORBIDDEN,
    errors?: ErrorDetail[],
    errorCode: string = 'FORBIDDEN_ERROR'
  ) {
    super(message, statusCode, errors, errorCode)
  }
}

// Lỗi request quá lớn
class PayloadTooLargeError extends ErrorResponse {
  constructor(
    message: string = ReasonPhrases.REQUEST_TOO_LONG,
    statusCode: number = StatusCodes.PAYLOAD_TOO_LARGE,
    errors?: ErrorDetail[],
    errorCode: string = 'PAYLOAD_TOO_LARGE'
  ) {
    super(message, statusCode, errors, errorCode)
  }
}

// Lỗi phương thức không được phép
class MethodNotAllowedError extends ErrorResponse {
  constructor(
    message: string = ReasonPhrases.METHOD_NOT_ALLOWED,
    statusCode: number = StatusCodes.METHOD_NOT_ALLOWED,
    errors?: ErrorDetail[],
    errorCode: string = 'METHOD_NOT_ALLOWED'
  ) {
    super(message, statusCode, errors, errorCode)
  }
}

// Lỗi máy chủ nội bộ
class InternalServerError extends ErrorResponse {
  constructor(
    message: string = ReasonPhrases.INTERNAL_SERVER_ERROR,
    statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    errors?: ErrorDetail[],
    errorCode: string = 'INTERNAL_SERVER_ERROR'
  ) {
    super(message, statusCode, errors, errorCode)
  }
}

// Lỗi thời gian yêu cầu hết hạn
class RequestTimeoutError extends ErrorResponse {
  constructor(
    message: string = ReasonPhrases.REQUEST_TIMEOUT,
    statusCode: number = StatusCodes.REQUEST_TIMEOUT,
    errors?: ErrorDetail[],
    errorCode: string = 'REQUEST_TIMEOUT'
  ) {
    super(message, statusCode, errors, errorCode)
  }
}

// Lỗi dịch vụ không khả dụng
class ServiceUnavailableError extends ErrorResponse {
  constructor(
    message: string = ReasonPhrases.SERVICE_UNAVAILABLE,
    statusCode: number = StatusCodes.SERVICE_UNAVAILABLE,
    errors?: ErrorDetail[],
    errorCode: string = 'SERVICE_UNAVAILABLE'
  ) {
    super(message, statusCode, errors, errorCode)
  }
}

// Helper function để tạo chi tiết lỗi từ một trường
export const createFieldError = (field: string, message: string, code?: string): ErrorDetail => ({
  field,
  message,
  code
})

// Export các class để sử dụng
export {
  ErrorResponse,
  ConflictRequestError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
  PayloadTooLargeError,
  MethodNotAllowedError,
  InternalServerError,
  RequestTimeoutError,
  ServiceUnavailableError
}
