export type Language = 'en' | 'vi';

const messages = {
  en: {
    protect: 'Protect', files: 'Files', restore: 'Restore', settings: 'Settings', about: 'About',
    title: 'Protect sensitive information before sharing', subtitle: 'Review local detections, then replace only what you choose.',
    input: 'Sensitive text', placeholder: 'Paste text containing names, email addresses, phone numbers, or secrets…',
    analyze: 'Analyze locally', protectAction: 'Protect selected', detected: 'Detected entities', output: 'Protected output',
    copy: 'Copy protected text', clear: 'Clear session', empty: 'No entities detected yet.',
    modelRequired: 'Local detection model required', download: 'Download Local Model', notNow: 'Not Now',
    modelBody: 'GLiNER PII Small (approximately 83 MB) runs on this device. Documents are not uploaded. The verified model is cached locally, so core protection can work offline after download.',
    local: 'Processing: Local', network: 'Network: only for verified model download when not cached',
    restoreTitle: 'Restore protected content', restoreHint: 'Paste a response containing placeholders from this current session.',
    restoreAction: 'Restore locally', restored: 'Restored output',
    filesTitle: 'Protect files locally', filesHint: 'DOCX and XLSX are regenerated with supported content protected and metadata scrubbed. Images use local OCR.',
    open: 'Choose a file', processFile: 'Analyze file', exportFile: 'Export protected copy',
    customTerms: 'Custom protection terms', ignoreList: 'Ignore list', savePrefs: 'Save local preferences',
    privacy: 'Sensitive session data stays in memory and is cleared when the app closes.',
    language: 'Language', region: 'Regex region', model: 'Detection model',
  },
  vi: {
    protect: 'Bảo vệ', files: 'Tệp', restore: 'Khôi phục', settings: 'Cài đặt', about: 'Giới thiệu',
    title: 'Bảo vệ thông tin nhạy cảm trước khi chia sẻ', subtitle: 'Xem lại kết quả phát hiện cục bộ, sau đó chỉ thay thế nội dung bạn chọn.',
    input: 'Văn bản nhạy cảm', placeholder: 'Dán văn bản có tên, email, số điện thoại hoặc thông tin bí mật…',
    analyze: 'Phân tích cục bộ', protectAction: 'Bảo vệ mục đã chọn', detected: 'Thực thể đã phát hiện', output: 'Kết quả đã bảo vệ',
    copy: 'Sao chép văn bản', clear: 'Xóa phiên hiện tại', empty: 'Chưa phát hiện thực thể.',
    modelRequired: 'Cần mô hình phát hiện cục bộ', download: 'Tải mô hình cục bộ', notNow: 'Để sau',
    modelBody: 'GLiNER PII Small (khoảng 83 MB) chạy trên thiết bị này. Tài liệu không được tải lên. Mô hình đã xác minh được lưu đệm cục bộ để có thể bảo vệ ngoại tuyến sau khi tải.',
    local: 'Xử lý: Cục bộ', network: 'Mạng: chỉ dùng để tải mô hình đã xác minh khi chưa có bộ nhớ đệm',
    restoreTitle: 'Khôi phục nội dung đã bảo vệ', restoreHint: 'Dán phản hồi có chứa mã giữ chỗ từ phiên hiện tại.',
    restoreAction: 'Khôi phục cục bộ', restored: 'Kết quả khôi phục',
    filesTitle: 'Bảo vệ tệp cục bộ', filesHint: 'DOCX và XLSX được tạo lại với nội dung hỗ trợ đã bảo vệ và siêu dữ liệu đã xóa. Ảnh dùng OCR cục bộ.',
    open: 'Chọn tệp', processFile: 'Phân tích tệp', exportFile: 'Xuất bản sao đã bảo vệ',
    customTerms: 'Thuật ngữ bảo vệ tùy chỉnh', ignoreList: 'Danh sách bỏ qua', savePrefs: 'Lưu tùy chọn cục bộ',
    privacy: 'Dữ liệu phiên nhạy cảm chỉ nằm trong bộ nhớ và được xóa khi đóng ứng dụng.',
    language: 'Ngôn ngữ', region: 'Vùng quy tắc', model: 'Mô hình phát hiện',
  },
} as const;

export type MessageKey = keyof typeof messages.en;
export const translate = (language: Language, key: MessageKey): string => messages[language][key];
