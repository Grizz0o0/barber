'use strict'
import { Response } from 'express'
import { HttpResponse } from '~/constants/httpStatusCode'

const { ReasonPhrases, StatusCodes } = HttpResponse

interface ResponseData {
  [key: string]: any
}

interface PaginationInfo {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

class SuccessResponse {
  message: string
  statusCode: number
  reasonStatusCode: string
  metadata?: ResponseData
  timestamp: string
  pagination?: PaginationInfo

  constructor({
    message,
    statusCode = StatusCodes.OK,
    reasonStatusCode = ReasonPhrases.OK,
    metadata = {},
    pagination
  }: {
    message: string
    statusCode?: number
    reasonStatusCode?: string
    metadata?: ResponseData
    pagination?: PaginationInfo
  }) {
    this.message = !message ? (reasonStatusCode as string) : message
    this.statusCode = statusCode
    this.reasonStatusCode = reasonStatusCode
    this.metadata = metadata
    this.timestamp = new Date().toISOString()
    if (pagination) {
      this.pagination = pagination
    }
  }

  send(res: Response) {
    return res.status(this.statusCode).json(this)
  }
}

class OK extends SuccessResponse {
  constructor({
    message = 'Success',
    statusCode = StatusCodes.OK,
    reasonStatusCode = ReasonPhrases.OK,
    metadata = {},
    pagination
  }: {
    message?: string
    statusCode?: number
    reasonStatusCode?: string
    metadata?: ResponseData
    pagination?: PaginationInfo
  }) {
    super({ message, reasonStatusCode, statusCode, metadata, pagination })
  }
}

class Created extends SuccessResponse {
  constructor({
    message = 'Created successfully',
    statusCode = StatusCodes.CREATED,
    reasonStatusCode = ReasonPhrases.CREATED,
    metadata = {}
  }: {
    message?: string
    statusCode?: number
    reasonStatusCode?: string
    metadata?: ResponseData
  }) {
    super({ message, reasonStatusCode, statusCode, metadata })
  }
}

class NoContent extends SuccessResponse {
  constructor({
    message = 'No Content',
    statusCode = StatusCodes.NO_CONTENT,
    reasonStatusCode = ReasonPhrases.NO_CONTENT,
    metadata = {}
  }: {
    message?: string
    statusCode?: number
    reasonStatusCode?: string
    metadata?: ResponseData
  }) {
    super({ message, reasonStatusCode, statusCode, metadata })
  }

  send(res: Response) {
    return res.status(this.statusCode).end()
  }
}

class Accepted extends SuccessResponse {
  constructor({
    message = 'Accepted',
    statusCode = StatusCodes.ACCEPTED,
    reasonStatusCode = ReasonPhrases.ACCEPTED,
    metadata = {}
  }: {
    message?: string
    statusCode?: number
    reasonStatusCode?: string
    metadata?: ResponseData
  }) {
    super({ message, reasonStatusCode, statusCode, metadata })
  }
}

class PartialContent extends SuccessResponse {
  constructor({
    message = 'Partial Content',
    statusCode = StatusCodes.PARTIAL_CONTENT,
    reasonStatusCode = ReasonPhrases.OK,
    metadata = {},
    pagination
  }: {
    message?: string
    statusCode?: number
    reasonStatusCode?: string
    metadata?: ResponseData
    pagination?: PaginationInfo
  }) {
    super({ message, reasonStatusCode, statusCode, metadata, pagination })
  }
}

// Helper function để tạo đối tượng phân trang
export const createPagination = (page: number, limit: number, totalItems: number): PaginationInfo => {
  const totalPages = Math.ceil(totalItems / limit)
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  }
}

export { SuccessResponse, OK, Created, NoContent, Accepted, PartialContent }
