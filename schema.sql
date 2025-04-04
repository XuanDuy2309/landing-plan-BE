-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: localhost:8889
-- Thời gian đã tạo: Th3 17, 2025 lúc 02:15 PM
-- Phiên bản máy phục vụ: 8.0.40
-- Phiên bản PHP: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `landing_plan`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `images`
--

CREATE DATABASE IF NOT EXISTS landing_plan;

CREATE TABLE `uploads` (
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `group_id` int DEFAULT NULL,
  `image_link` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `video_link` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `uploads`
--

INSERT INTO `uploads` (`id`, `user_id`, `group_id`, `image_link`, `video_link`, `created_at`, `updated_at`) VALUES
(20, 20, NULL, 'http://localhost:3000/uploads/1742836155388-450394409-avt.jpg', NULL, '2025-03-24 17:09:15', '2025-03-24 17:09:15'),
(21, 20, NULL, 'http://localhost:3000/uploads/1742836155389-766901277-bg-value-for-customer.png', NULL, '2025-03-24 17:09:15', '2025-03-24 17:09:15'),
(22, 20, NULL, 'http://localhost:3000/uploads/1742836155390-844471387-database_erd.png', NULL, '2025-03-24 17:09:15', '2025-03-24 17:09:15'),
(23, 20, NULL, NULL, 'http://localhost:3000/uploads/1742836403538-507923754-demo.mov', '2025-03-24 17:13:23', '2025-03-24 17:13:23');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `fullname` varchar(255) NOT NULL,
  `phone_number` varchar(10) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `background` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT 'male',
  `role` enum('user','admin') DEFAULT 'user',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `email`, `fullname`, `phone_number`, `address`, `dob`, `avatar`, `background`, `gender`, `role`, `status`, `created_at`) VALUES
(1, 'duydx', '$2b$10$opKRp5KL3/GEXw7eNKMqSOZC62QMOlewH0rWxBYNADmxT6MTMkmou', 'duydao23092003@gmail.com', 'duy dao', '0123456789', 'ha noi', '2003-09-23', 'http://localhost:3000/uploads/1742048263489-502561574-avt.jpg', 'http://localhost:3000/uploads/1742048039934-439552964-bg-value-for-customer.png', 'male', NULL, NULL, NULL),
(3, 'duydx123', '$2b$10$vSHmd.pDAKsAOfwisyg6TOgUb2T4iQgK6Kaoxdr2a3rwQOPnyDEda', 'duydao23092003@gmail.com', 'duy dao', '0192384751', NULL, NULL, NULL, '', 'male', 'user', 'active', NULL),
(15, 'duydx2k3', '$2b$10$Yq79MgW0tLjzLRh6xqQZIumsH1GPiSfLVMBGAzRUOjq4WiTVLY/Wy', 'duyxuandao23092003@gmail.com', 'dao xuan duy', '0398876732', NULL, NULL, NULL, '', 'male', 'user', 'active', NULL),
(18, 'duydx12345', '$2b$10$Qkh/G9dnEc059nPPedbAF.qWR.czTUnV1H/Wz7cSF4JQ0ivEWp6AC', 'duydao230920031@gmail.com', 'duy dao', '019234751', NULL, NULL, NULL, '', 'male', 'user', 'active', NULL),
(19, 'duydx1', '$2b$10$FUDxQPbisymF4zt6hbvQVORxaqW3bb2PQ6woRyhzHk8khHRHjhNNS', 'duyxuandao1@gmail.com', 'dao xuan duy', '0398876733', NULL, NULL, NULL, '', 'male', 'user', 'active', NULL),
(20, 'duydx2309', '$2b$10$M5m4DK3nLsQFgUnvDo5rv.Xntu9rLtk39FJiHn/Vlq9ylOeuYyw4q', 'duydao230920032@gmail.com', 'duy dao', '019234752', NULL, NULL, NULL, NULL, 'male', 'user', 'active', '2025-03-24 15:34:32');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `uploads`
--
ALTER TABLE `uploads`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `phone_number` (`phone_number`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `uploads`
--
ALTER TABLE `uploads`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `uploads`
--
ALTER TABLE `uploads`
  ADD CONSTRAINT `uploads_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

CREATE TABLE `coordinates_location` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    points POLYGON NOT NULL,
    province_id VARCHAR(10) NOT NULL,
    district_id VARCHAR(10) NOT NULL,
    ward_id VARCHAR(10) NOT NULL,
    area DECIMAL(10,2) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    content TEXT
);

INSERT INTO coordinates_location (points, province_id, district_id, ward_id, area, owner_name, content) 
VALUES (
    ST_GeomFromText('POLYGON((105.74031681785695 20.74992235892653, 
                               105.74024050159778 20.74982874776511, 
                               105.73981310391954 20.750009434613116, 
                               105.73984709903188 20.750088775838684, 
                               105.73992283078836 20.750062255127023, 
                               105.7401586680722 20.749982655586003, 
                               105.74029670993214 20.749934187997482, 
                               105.74031681785695 20.74992235892653))'),
    '1', 
    '1', 
    '1', 
    570.57, 
    'Nguyễn Thị Hiểm', 
    'Thửa 21, tổ 6. Diện tích: 570.567m²'
);

INSERT INTO coordinates_location (points, province_id, district_id, ward_id, area, owner_name, content)
VALUES (
    ST_GeomFromText('POLYGON((106.15985374788846 20.909961733135894, 
                              106.15977505134708 20.90994731391689, 
                              106.1597189371027 20.9099530405286, 
                              106.1597127134876 20.910068591803952, 
                              106.15972339799848 20.910115791157082, 
                              106.15973468638944 20.91012523181588, 
                              106.15981511737537 20.910118598342354, 
                              106.15990862088954 20.910111733680676, 
                              106.15998694733162 20.910107456738, 
                              106.16016061711927 20.91009937894286, 
                              106.16025019756556 20.910096684261074, 
                              106.16028892345794 20.91009346349186, 
                              106.16029946077435 20.910041123884014, 
                              106.16017731578192 20.910027143763543, 
                              106.15995333766462 20.909983749333822, 
                              106.15985374788846 20.909961733135894))'),
    '1', 
    '1', 
    '1', 
    763.00, 
    'Nguyễn Thị Hiểm', 
    'Thửa 293, tờ 18. Diện tích: 763m²'
);

INSERT INTO coordinates_location (points, province_id, district_id, ward_id, area, owner_name, content)
VALUES (
    ST_GeomFromText('POLYGON((105.83961856292417 20.98763476707875,
                              105.8397474448088 20.987635938113957,
                              105.8405619893709 20.987624694150025,
                              105.84056279947755 20.987597593358316,
                              105.8405801106048 20.9875975079202,
                              105.84057634530501 20.98692462277316,
                              105.83991669280418 20.986944135188004,
                              105.83961471105587 20.98694562413588,
                              105.83961856292417 20.98763476707875))'),
    '01',
    '009',
    '00358',
    7669.4,
    '',
    'Thửa 1, tờ 103. Diện tích: 7669.4m²'
);



/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;