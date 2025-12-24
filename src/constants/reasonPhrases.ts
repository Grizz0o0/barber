// Định nghĩa một enum HttpStatus để chứa các mã trạng thái HTTP dưới dạng chuỗi
export enum ReasonPhrases {
  // 2xx: Thành công (Success)
  OK = 'OK', // Yêu cầu đã được thực hiện thành công
  CREATED = 'Created', // Đã tạo tài nguyên mới thành công
  ACCEPTED = 'Accepted', // Yêu cầu đã được chấp nhận để xử lý nhưng chưa hoàn thành
  NO_CONTENT = 'No Content', // Yêu cầu thành công nhưng không có nội dung phản hồi

  // 3xx: Chuyển hướng (Redirection)
  MOVED_PERMANENTLY = 'Moved Permanently', // Tài nguyên đã được di chuyển vĩnh viễn
  MOVED_TEMPORARILY = 'Moved Temporarily', // Tài nguyên tạm thời được di chuyển
  PERMANENT_REDIRECT = 'Permanent Redirect', // Chuyển hướng vĩnh viễn đến một URL mới
  MULTIPLE_CHOICES = 'Multiple Choices', // Có nhiều lựa chọn cho tài nguyên được yêu cầu

  // 4xx: Lỗi từ phía client (Client Errors)
  BAD_REQUEST = 'Bad Request', // Yêu cầu không hợp lệ
  UNAUTHORIZED = 'Unauthorized', // Người dùng chưa được xác thực
  FORBIDDEN = 'Forbidden', // Người dùng không có quyền truy cập
  NOT_FOUND = 'Not Found', // Không tìm thấy tài nguyên yêu cầu
  METHOD_NOT_ALLOWED = 'Method Not Allowed', // Phương thức HTTP không được phép
  REQUEST_TIMEOUT = 'Request Timeout', // Hết thời gian chờ yêu cầu từ client
  CONFLICT = 'Conflict', // Xung đột với trạng thái hiện tại của tài nguyên
  LENGTH_REQUIRED = 'Length Required', // Yêu cầu phải có độ dài nội dung
  REQUEST_URI_TOO_LONG = 'Request-URI Too Long', // URL quá dài để xử lý
  REQUEST_TOO_LONG = 'Request Entity Too Large', // Dữ liệu yêu cầu quá lớn

  // 5xx: Lỗi từ phía server (Server Errors)
  INTERNAL_SERVER_ERROR = 'Internal Server Error', // Lỗi máy chủ không xác định
  NOT_IMPLEMENTED = 'Not Implemented', // Chức năng chưa được hỗ trợ
  BAD_GATEWAY = 'Bad Gateway', // Máy chủ trung gian nhận phản hồi không hợp lệ
  SERVICE_UNAVAILABLE = 'Service Unavailable', // Máy chủ tạm thời không thể xử lý yêu cầu
  GATEWAY_TIMEOUT = 'Gateway Timeout', // Hết thời gian chờ từ máy chủ upstream
  HTTP_VERSION_NOT_SUPPORTED = 'HTTP Version Not Supported', // Phiên bản HTTP không được hỗ trợ

  // Các trạng thái đặc biệt khác
  IM_A_TEAPOT = "I'm a teapot", // Trạng thái đùa theo RFC 2324
  LOCKED = 'Locked', // Tài nguyên bị khóa
  FAILED_DEPENDENCY = 'Failed Dependency', // Yêu cầu thất bại do phụ thuộc vào một yêu cầu khác
  EXPECTATION_FAILED = 'Expectation Failed', // Yêu cầu không đáp ứng kỳ vọng của server
  NON_AUTHORITATIVE_INFORMATION = 'Non Authoritative Information', // Thông tin phản hồi có thể không chính xác
  REQUEST_HEADER_FIELDS_TOO_LARGE = 'Request Header Fields Too Large', // Header của yêu cầu quá lớn
  PRECONDITION_FAILED = 'Precondition Failed', // Điều kiện tiên quyết không thỏa mãn
  NETWORK_AUTHENTICATION_REQUIRED = 'Network Authentication Required', // Cần xác thực để truy cập mạng
  REQUESTED_RANGE_NOT_SATISFIABLE = 'Requested Range Not Satisfiable' // Phạm vi yêu cầu không thể được đáp ứng
}
