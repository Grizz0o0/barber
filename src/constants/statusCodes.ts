export enum StatusCodes {
  // 1xx: Informational (Thông tin) - Các mã trạng thái báo hiệu yêu cầu đã được nhận và server đang xử lý
  CONTINUE = 100, // Tiếp tục xử lý yêu cầu
  SWITCHING_PROTOCOLS = 101, // Máy chủ đồng ý chuyển đổi giao thức theo yêu cầu của client
  PROCESSING = 102, // Yêu cầu đang được xử lý, nhưng chưa hoàn thành (dùng trong WebDAV)

  // 2xx: Success (Thành công) - Các mã trạng thái báo hiệu yêu cầu đã được xử lý thành công
  OK = 200, // Thành công, phản hồi có thể chứa dữ liệu
  CREATED = 201, // Tạo thành công một tài nguyên mới
  ACCEPTED = 202, // Yêu cầu đã được chấp nhận để xử lý nhưng chưa hoàn thành
  NON_AUTHORITATIVE_INFORMATION = 203, // Thông tin phản hồi có thể không chính xác (không từ nguồn gốc)
  NO_CONTENT = 204, // Yêu cầu thành công nhưng không có nội dung phản hồi
  RESET_CONTENT = 205, // Yêu cầu thành công, client nên làm mới nội dung hiển thị
  PARTIAL_CONTENT = 206, // Phản hồi một phần nội dung do client yêu cầu
  MULTI_STATUS = 207, // Phản hồi nhiều trạng thái khác nhau (dùng trong WebDAV)

  // 3xx: Redirection (Chuyển hướng) - Client cần thực hiện hành động khác để hoàn tất yêu cầu
  MULTIPLE_CHOICES = 300, // Có nhiều cách để truy cập tài nguyên
  MOVED_PERMANENTLY = 301, // Tài nguyên đã di chuyển vĩnh viễn sang URL mới
  FOUND = 302, // Tài nguyên tạm thời được di chuyển (trước đây là MOVED_TEMPORARILY)
  SEE_OTHER = 303, // Tài nguyên có thể được tìm thấy tại một URL khác
  NOT_MODIFIED = 304, // Tài nguyên chưa thay đổi so với phiên bản đã lưu
  USE_PROXY = 305, // Yêu cầu phải được truy cập qua proxy (hiện không còn được dùng)
  TEMPORARY_REDIRECT = 307, // Chuyển hướng tạm thời, nhưng phương thức HTTP không thay đổi
  PERMANENT_REDIRECT = 308, // Chuyển hướng vĩnh viễn, nhưng phương thức HTTP không thay đổi

  // 4xx: Client Error (Lỗi từ phía client) - Các mã trạng thái báo hiệu lỗi do client gửi yêu cầu không hợp lệ
  BAD_REQUEST = 400, // Yêu cầu không hợp lệ, thường do lỗi cú pháp
  UNAUTHORIZED = 401, // Người dùng chưa xác thực hoặc token không hợp lệ
  PAYMENT_REQUIRED = 402, // Yêu cầu thanh toán trước khi tiếp tục (ít sử dụng)
  FORBIDDEN = 403, // Người dùng không có quyền truy cập tài nguyên
  NOT_FOUND = 404, // Không tìm thấy tài nguyên được yêu cầu
  METHOD_NOT_ALLOWED = 405, // Phương thức HTTP không được phép trên tài nguyên này
  NOT_ACCEPTABLE = 406, // Nội dung phản hồi không đáp ứng tiêu chí của client
  PROXY_AUTHENTICATION_REQUIRED = 407, // Cần xác thực proxy trước khi tiếp tục
  REQUEST_TIMEOUT = 408, // Hết thời gian chờ phản hồi từ server
  CONFLICT = 409, // Yêu cầu gây xung đột với trạng thái hiện tại của tài nguyên
  GONE = 410, // Tài nguyên không còn tồn tại trên server
  LENGTH_REQUIRED = 411, // Yêu cầu cần có độ dài nội dung nhưng chưa cung cấp
  PRECONDITION_FAILED = 412, // Một điều kiện tiên quyết không thỏa mãn
  PAYLOAD_TOO_LARGE = 413, // Kích thước dữ liệu trong yêu cầu quá lớn (trước đây là REQUEST_TOO_LONG)
  URI_TOO_LONG = 414, // URL quá dài để xử lý (trước đây là REQUEST_URI_TOO_LONG)
  UNSUPPORTED_MEDIA_TYPE = 415, // Kiểu dữ liệu không được hỗ trợ
  REQUESTED_RANGE_NOT_SATISFIABLE = 416, // Phạm vi yêu cầu không thể được đáp ứng
  EXPECTATION_FAILED = 417, // Yêu cầu không đáp ứng kỳ vọng của server
  IM_A_TEAPOT = 418, // Trạng thái đùa theo RFC 2324
  INSUFFICIENT_SPACE_ON_RESOURCE = 419, // Không đủ dung lượng trên tài nguyên để xử lý yêu cầu
  METHOD_FAILURE = 420, // Phương thức thất bại (không phải trạng thái chuẩn)
  MISDIRECTED_REQUEST = 421, // Yêu cầu được gửi đến server không thể xử lý nó
  UNPROCESSABLE_ENTITY = 422, // Yêu cầu hợp lệ nhưng không thể xử lý (thường do lỗi validation)
  LOCKED = 423, // Tài nguyên bị khóa, không thể sửa đổi
  FAILED_DEPENDENCY = 424, // Yêu cầu thất bại do phụ thuộc vào một yêu cầu khác
  PRECONDITION_REQUIRED = 428, // Yêu cầu cần có điều kiện tiên quyết

  // 5xx: Server Error (Lỗi từ phía server) - Các mã trạng thái báo hiệu lỗi do server không thể xử lý yêu cầu
  INTERNAL_SERVER_ERROR = 500, // Lỗi máy chủ không xác định
  NOT_IMPLEMENTED = 501, // Chức năng chưa được hỗ trợ
  BAD_GATEWAY = 502, // Máy chủ nhận phản hồi không hợp lệ từ upstream
  SERVICE_UNAVAILABLE = 503, // Máy chủ tạm thời không thể xử lý yêu cầu
  GATEWAY_TIMEOUT = 504, // Hết thời gian chờ từ máy chủ upstream
  HTTP_VERSION_NOT_SUPPORTED = 505 // Phiên bản HTTP không được hỗ trợ
}
