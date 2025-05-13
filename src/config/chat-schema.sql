-- Bảng conversations (Cuộc trò chuyện)
CREATE TABLE IF NOT EXISTS conversations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    type ENUM('direct', 'group') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_message_id INT,
    settings JSON -- Lưu các cài đặt của cuộc trò chuyện (notifications, theme, etc.)
);

-- Bảng conversation_members (Thành viên trong cuộc trò chuyện)
CREATE TABLE IF NOT EXISTS conversation_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('admin', 'member') DEFAULT 'member',
    nickname VARCHAR(100), -- Biệt danh trong cuộc trò chuyện
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP, -- Thời điểm xem cuộc trò chuyện gần nhất
    muted_until TIMESTAMP NULL, -- Tắt thông báo đến thời điểm
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_member (conversation_id, user_id)
);

-- Bảng messages (Tin nhắn)
CREATE TABLE IF NOT EXISTS messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    reply_id INT,
    content TEXT,
    type ENUM(
        'text', 'image', 'file', 'audio',
        'video', 'location', 'sticker',
        'emoji', 'audio_call', 'video_call',
        'mention'
    ) DEFAULT 'text',
    status ENUM('sent', 'edited', 'deleted') DEFAULT 'sent',
    metadata JSON, -- Lưu thông tin bổ sung (file size, duration, coordinates, etc.)
    mentions JSON, -- Lưu danh sách người dùng được mention trong tin nhắn
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_id) REFERENCES messages(id) ON DELETE SET NULL
);

-- Bảng message_reads (Trạng thái đọc tin nhắn)
CREATE TABLE IF NOT EXISTS message_reads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    message_id INT NOT NULL,
    user_id INT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_read (message_id, user_id)
);

-- Bảng message_reactions (Reaction cho tin nhắn)
CREATE TABLE IF NOT EXISTS message_reactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    message_id INT NOT NULL,
    user_id INT NOT NULL,
    reaction VARCHAR(50) NOT NULL, -- emoji code
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_reaction (message_id, user_id)
);

-- Bảng message_mentions (Mentions trong tin nhắn)
CREATE TABLE IF NOT EXISTS message_mentions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    message_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_mention (message_id, user_id)
);

-- Bảng message_attachments (File đính kèm)
CREATE TABLE IF NOT EXISTS message_attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    message_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INT NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Bảng call_logs (Lịch sử cuộc gọi)
CREATE TABLE IF NOT EXISTS call_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id INT NOT NULL,
    initiator_id INT NOT NULL,
    type ENUM('audio', 'video') NOT NULL,
    status ENUM('missed', 'answered', 'rejected') NOT NULL,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    duration INT, -- in seconds
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (initiator_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng call_participants (Người tham gia cuộc gọi)
CREATE TABLE IF NOT EXISTS call_participants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    call_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP NOT NULL,
    left_at TIMESTAMP,
    FOREIGN KEY (call_id) REFERENCES call_logs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Cập nhật foreign key cho last_message_id trong conversations
ALTER TABLE conversations
ADD FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- Indexes cho tối ưu truy vấn
CREATE INDEX idx_conversation_updated ON conversations(updated_at);
CREATE INDEX idx_conversation_type ON conversations(type);
CREATE INDEX idx_conversation_members ON conversation_members(conversation_id, user_id);
CREATE INDEX idx_conversation_members_user ON conversation_members(user_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_type ON messages(type);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_message_reads ON message_reads(message_id, user_id);
CREATE INDEX idx_message_reads_user ON message_reads(user_id);
CREATE INDEX idx_message_reactions ON message_reactions(message_id);
CREATE INDEX idx_message_mentions_user ON message_mentions(user_id);
CREATE INDEX idx_message_mentions_message ON message_mentions(message_id);
CREATE INDEX idx_message_attachments_message ON message_attachments(message_id);
CREATE INDEX idx_call_logs_conversation ON call_logs(conversation_id);
CREATE INDEX idx_call_participants_call ON call_participants(call_id);
CREATE INDEX idx_call_participants_user ON call_participants(user_id);
